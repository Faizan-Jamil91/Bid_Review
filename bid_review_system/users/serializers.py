from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from .models import User, Notification, NotificationPreferences

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'title', 'department', 'phone_number',
            'role', 'business_unit', 'is_active', 'is_verified',
            'date_joined', 'last_login', 'last_activity',
            'is_professional', 'professional_title', 'professional_bio'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'last_activity']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(required=False)
    business_unit = serializers.CharField(required=False)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password2', 'role', 'business_unit']
        extra_kwargs = {
            'role': {'required': False},
            'business_unit': {'required': False}
        }
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        
        # Assign default role if not provided
        if 'role' not in validated_data or not validated_data['role']:
            validated_data['role'] = 'analyst'  # Default role for new users
        
        # Assign default business unit if not provided
        if 'business_unit' not in validated_data or not validated_data['business_unit']:
            validated_data['business_unit'] = 'JIS'  # Default business unit
        
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'),
                              email=email, password=password)
            if not user:
                msg = _('Unable to log in with provided credentials.')
                raise serializers.ValidationError(msg, code='authorization')
            if not user.is_active:
                msg = _('User account is disabled.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Must include "email" and "password".')
            raise serializers.ValidationError(msg, code='authorization')
        
        data['user'] = user
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True, min_length=8)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"new_password": "New passwords don't match."})
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name',
                 'title', 'department', 'phone_number',
                 'role', 'business_unit', 'is_professional', 
                 'professional_title', 'professional_bio']
        read_only_fields = ['email', 'role']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'priority', 'bid_id',
            'is_read', 'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']

class NotificationPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreferences
        fields = [
            'professional_bid_notifications', 'professional_review_notifications',
            'professional_deadline_notifications', 'enabled_notifications',
            'email_notifications', 'in_app_notifications',
            'professional_email_frequency', 'professional_priority_threshold'
        ]