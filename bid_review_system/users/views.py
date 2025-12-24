from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import User, NotificationPreferences, Notification
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    ChangePasswordSerializer, UserProfileSerializer,
    NotificationSerializer, NotificationPreferencesSerializer
)
from .permissions import IsAdminUser, IsSameUserOrAdmin
from .services import NotificationService

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        
        # Filter by unread status if requested
        unread_only = self.request.query_params.get('unread_only', 'false').lower() == 'true'
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        # Limit results
        limit = int(self.request.query_params.get('limit', 20))
        return queryset[:limit]

class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        notification_ids = request.data.get('notification_ids', [])
        mark_all = request.data.get('mark_all', False)
        
        if mark_all:
            count = NotificationService.mark_notifications_read(request.user)
        else:
            count = NotificationService.mark_notifications_read(request.user, notification_ids)
        
        return Response({
            'message': f'{count} notifications marked as read',
            'count': count
        })

class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        count = NotificationService.get_unread_count(request.user)
        return Response({'unread_count': count})

class NotificationPreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        # Get or create notification preferences for the user
        preferences, created = NotificationPreferences.objects.get_or_create(
            user=self.request.user,
            defaults={
                'enabled_notifications': [
                    'bid_assigned', 'bid_review', 'bid_approved', 
                    'bid_rejected', 'bid_due_soon', 'deadline_reminder'
                ]
            }
        )
        return preferences
    
    def update(self, request, *args, **kwargs):
        # Update last activity
        self.request.user.update_last_activity()
        return super().update(request, *args, **kwargs)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Update last login and login count
        user.last_login = timezone.now()
        user.login_count += 1
        user.save(update_fields=['last_login', 'login_count'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        
        return Response(status=status.HTTP_205_RESET_CONTENT)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        # Update last activity
        self.request.user.update_last_activity()
        return super().update(request, *args, **kwargs)

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check old password
        if not user.check_password(serializer.data.get("old_password")):
            return Response({"old_password": ["Wrong password."]}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(serializer.data.get("new_password"))
        user.last_password_change = timezone.now()
        user.save()
        
        return Response({"message": "Password updated successfully."})

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['role', 'business_unit', 'is_active']

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser | IsSameUserOrAdmin]