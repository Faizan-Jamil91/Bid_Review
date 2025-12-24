from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg, F
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import json
import logging

from .models import Bid, BidReview, BidMilestone, Customer, BidCategory, BidAnalytics, BidDocument
from .serializers import (
    BidSerializer, BidCreateSerializer, BidReviewSerializer,
    BidMilestoneSerializer, CustomerSerializer, BidCategorySerializer,
    AIPredictionSerializer, BidDocumentSerializer
)
from .permissions import BidPermissions, ReviewPermissions
from users.permissions import IsAdminUser, IsManagerOrAdmin
from .ai.gemini_client import GeminiAIClient
from .ml.bid_predictor import BidPredictor

logger = logging.getLogger(__name__)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class BidViewSet(viewsets.ModelViewSet):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated, BidPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'business_unit', 'status', 'region', 'priority',
        'complexity', 'bid_level', 'is_urgent', 'customer'
    ]
    search_fields = ['code', 'title', 'description', 'customer__name']
    ordering_fields = [
        'bid_due_date', 'created_at', 'updated_at',
        'bid_value', 'win_probability', 'risk_score'
    ]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BidCreateSerializer
        return BidSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Filter by business unit if user is not admin
        if user.role != 'admin' and user.business_unit != 'all':
            queryset = queryset.filter(business_unit=user.business_unit)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def predict(self, request, pk=None):
        """Get AI/ML predictions for bid"""
        bid = self.get_object()
        
        try:
            # Initialize AI client and ML predictor
            ai_client = GeminiAIClient()
            ml_predictor = BidPredictor()
            
            # Get ML predictions
            ml_prediction = ml_predictor.predict_for_bid(bid)
            
            # Get AI recommendations
            bid_features = {
                'title': bid.title,
                'description': bid.description,
                'bid_value': float(bid.bid_value or 0),
                'customer_name': bid.customer.name,
                'requirements': bid.requirements,
                'complexity': bid.complexity,
            }
            
            ai_recommendations = ai_client.predict_win_probability(bid_features)
            
            # Combine predictions
            combined_prediction = {
                'ml_predictions': ml_prediction,
                'ai_insights': ai_recommendations,
                'combined_win_probability': (
                    ml_prediction['win_probability'] * 0.6 +
                    ai_recommendations.get('win_probability', 0.5) * 0.4
                ),
                'recommendations': ml_predictor.get_recommendations(bid, ml_prediction),
                'timestamp': timezone.now().isoformat()
            }
            
            # Update bid with predictions
            bid.win_probability = combined_prediction['combined_win_probability'] * 100
            bid.risk_score = ml_prediction['risk_score'] * 100
            bid.ai_recommendations = combined_prediction['recommendations']
            bid.ml_features = ml_prediction['features']
            bid.save()
            
            serializer = AIPredictionSerializer({
                'win_probability': combined_prediction['combined_win_probability'],
                'risk_score': ml_prediction['risk_score'],
                'confidence': ml_prediction['confidence'],
                'recommendations': combined_prediction['recommendations'],
                'timestamp': combined_prediction['timestamp']
            })
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error generating predictions: {e}")
            return Response(
                {'error': 'Failed to generate predictions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def generate_proposal(self, request, pk=None):
        """Generate proposal content using AI"""
        bid = self.get_object()
        
        try:
            ai_client = GeminiAIClient()
            
            bid_data = {
                'title': bid.title,
                'description': bid.description,
                'requirements': bid.requirements,
                'customer_name': bid.customer.name,
                'bid_value': float(bid.bid_value or 0),
                'region': bid.region,
            }
            
            proposal_sections = ai_client.generate_proposal_sections(bid_data)
            
            # Generate executive summary
            executive_summary = ai_client.generate_executive_summary(bid_data)
            
            response_data = {
                'executive_summary': executive_summary,
                'sections': proposal_sections,
                'generated_at': timezone.now().isoformat(),
                'bid_id': str(bid.id)
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error generating proposal: {e}")
            return Response(
                {'error': 'Failed to generate proposal'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get comprehensive dashboard data"""
        user = request.user
        queryset = self.get_queryset()
        
        # Basic metrics
        total_bids = queryset.count()
        active_bids = queryset.exclude(status__in=['won', 'lost', 'cancelled']).count()
        urgent_bids = queryset.filter(is_urgent=True).count()
        overdue_bids = queryset.filter(bid_due_date__lt=timezone.now().date()).count()
        
        # Financial metrics
        total_value = queryset.aggregate(total=Sum('bid_value'))['total'] or 0
        avg_win_probability = queryset.aggregate(avg=Avg('win_probability'))['avg'] or 0
        
        # Status distribution
        status_distribution = dict(queryset.values_list('status').annotate(count=Count('id')))
        
        # Priority distribution
        priority_distribution = dict(queryset.values_list('priority').annotate(count=Count('id')))
        
        # Top customers by bid value
        top_customers = queryset.values('customer__name').annotate(
            total_value=Sum('bid_value'),
            bid_count=Count('id')
        ).order_by('-total_value')[:5]
        
        # Upcoming deadlines
        upcoming_deadlines = queryset.filter(
            bid_due_date__gte=timezone.now().date(),
            bid_due_date__lte=timezone.now().date() + timedelta(days=7)
        ).values('code', 'title', 'bid_due_date', 'priority')[:10]
        
        response_data = {
            'overview': {
                'total_bids': total_bids,
                'active_bids': active_bids,
                'urgent_bids': urgent_bids,
                'overdue_bids': overdue_bids,
                'total_value': float(total_value),
                'avg_win_probability': float(avg_win_probability),
            },
            'distributions': {
                'status': status_distribution,
                'priority': priority_distribution,
            },
            'insights': {
                'top_customers': list(top_customers),
                'upcoming_deadlines': list(upcoming_deadlines),
            }
        }
        
        return Response(response_data)
    
    @action(detail=True, methods=['post'])
    def analyze_requirements(self, request, pk=None):
        """Analyze bid requirements using AI"""
        bid = self.get_object()
        requirements_text = request.data.get('requirements', '')
        
        if not requirements_text:
            requirements_text = bid.description
        
        try:
            ai_client = GeminiAIClient()
            analysis = ai_client.analyze_bid_requirements(requirements_text)
            
            # Update bid with analysis
            bid.requirements = analysis
            bid.save()
            
            return Response(analysis)
            
        except Exception as e:
            logger.error(f"Error analyzing requirements: {e}")
            return Response(
                {'error': 'Failed to analyze requirements'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Get all documents for a bid"""
        bid = self.get_object()
        documents = bid.documents.all()
        serializer = BidDocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_documents(self, request, pk=None):
        """Upload multiple documents for a bid"""
        bid = self.get_object()
        
        if 'files' not in request.FILES:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        files = request.FILES.getlist('files')
        uploaded_documents = []
        
        try:
            with transaction.atomic():
                for file in files:
                    document_data = {
                        'bid': bid.id,
                        'file': file,
                        'name': file.name,
                        'description': request.data.get(f'description_{file.name}', '')
                    }
                    serializer = BidDocumentSerializer(
                        data=document_data,
                        context={'request': request}
                    )
                    if serializer.is_valid():
                        document = serializer.save()
                        uploaded_documents.append(serializer.data)
                    else:
                        return Response(
                            serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            return Response({
                'message': f'Successfully uploaded {len(uploaded_documents)} documents',
                'documents': uploaded_documents
            })
            
        except Exception as e:
            logger.error(f"Error uploading documents: {e}")
            return Response(
                {'error': 'Failed to upload documents'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'], url_path='documents/(?P<document_id>[^/.]+)')
    def update_document(self, request, pk=None, document_id=None):
        """Update a specific document"""
        bid = self.get_object()
        
        try:
            document = bid.documents.get(id=document_id)
            
            # Only allow updating description and name
            allowed_fields = ['name', 'description']
            update_data = {}
            
            for field in allowed_fields:
                if field in request.data:
                    update_data[field] = request.data[field]
            
            serializer = BidDocumentSerializer(
                document, 
                data=update_data, 
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                updated_document = serializer.save()
                return Response(serializer.data)
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except BidDocument.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating document: {e}")
            return Response(
                {'error': 'Failed to update document'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='documents/(?P<document_id>[^/.]+)')
    def delete_document(self, request, pk=None, document_id=None):
        """Delete a specific document"""
        bid = self.get_object()
        
        try:
            document = bid.documents.get(id=document_id)
            document.file.delete()  # Delete the file from storage
            document.delete()  # Delete the database record
            
            return Response({'message': 'Document deleted successfully'})
            
        except BidDocument.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return Response(
                {'error': 'Failed to delete document'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='documents/(?P<document_id>[^/.]+)/download')
    def download_document(self, request, pk=None, document_id=None):
        """Download a specific document"""
        bid = self.get_object()
        
        try:
            document = bid.documents.get(id=document_id)
            
            # Return the file for download
            from django.http import FileResponse
            response = FileResponse(
                document.file.open('rb'),
                as_attachment=True,
                filename=document.name
            )
            return response
            
        except BidDocument.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error downloading document: {e}")
            return Response(
                {'error': 'Failed to download document'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BidReviewViewSet(viewsets.ModelViewSet):
    queryset = BidReview.objects.all()
    serializer_class = BidReviewSerializer
    permission_classes = [IsAuthenticated, ReviewPermissions]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'decision', 'review_type', 'bid']
    ordering_fields = ['due_date', 'assigned_date', 'completed_date']
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role != 'admin':
            # Filter by assigned reviews or bid business unit
            queryset = queryset.filter(
                Q(assigned_to=user) |
                Q(bid__business_unit=user.business_unit)
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a review"""
        review = self.get_object()
        decision = request.data.get('decision')
        comments = request.data.get('comments', '')
        score = request.data.get('score')
        
        if not decision:
            return Response(
                {'error': 'Decision is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        review.status = 'completed'
        review.decision = decision
        review.comments = comments
        review.score = score
        review.completed_date = timezone.now()
        review.reviewed_by = request.user
        
        # Analyze feedback with AI
        try:
            ai_client = GeminiAIClient()
            feedback_analysis = ai_client.analyze_review_feedback(comments)
            review.ai_analysis = feedback_analysis
        except Exception as e:
            logger.error(f"Error analyzing feedback: {e}")
        
        review.save()
        
        # Update bid status based on review decision
        if decision == 'approved' and review.is_final_review:
            review.bid.status = 'approved'
            review.bid.save()
        
        return Response({'message': 'Review completed successfully'})

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows customers to be viewed or edited.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'code', 'industry']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Optionally filter customers by query parameters
        """
        queryset = Customer.objects.all()
        return queryset
    
    def list(self, request):
        """
        List all customers
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    def create(self, request, *args, **kwargs):
        """
        Create a new customer
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def bids(self, request, pk=None):
        """Get all bids for a specific customer"""
        customer = self.get_object()
        bids = customer.bids.all()
        page = self.paginate_queryset(bids)
        if page is not None:
            serializer = BidSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = BidSerializer(bids, many=True)
        return Response(serializer.data)

class BidMilestoneViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows bid milestones to be viewed or edited.
    """
    queryset = BidMilestone.objects.all()
    serializer_class = BidMilestoneSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'bid', 'assigned_to']
    ordering_fields = ['due_date', 'completed_date', 'created_at']
    ordering = ['due_date']
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role != 'admin':
            # Filter by user's business unit through bid relationship
            queryset = queryset.filter(bid__business_unit=user.business_unit)
        
        return queryset
    
    def perform_create(self, serializer):
        # Set created_by if user is authenticated
        if self.request and hasattr(self.request, 'user'):
            serializer.save()

class AIToolsView(generics.GenericAPIView):
    """AI-powered tools for bid management"""
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'prompt': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='The prompt for AI content generation'
                ),
                'context': openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    description='Additional context for the AI (optional)'
                )
            },
            required=['prompt']
        ),
        responses={
            201: openapi.Response(
                description='AI content generated successfully',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'response': openapi.Schema(type=openapi.TYPE_STRING),
                        'model': openapi.Schema(type=openapi.TYPE_STRING),
                        'timestamp': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: openapi.Response(
                description='Bad Request - Prompt is required'
            ),
            500: openapi.Response(
                description='Internal Server Error'
            )
        },
        operation_description='Generate AI content based on prompt',
        operation_summary='Generate AI content for bid management'
    )
    def post(self, request):
        """Generate AI content based on prompt"""
        prompt = request.data.get('prompt', '')
        context = request.data.get('context', {})
        
        if not prompt:
            return Response(
                {'error': 'Prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ai_client = GeminiAIClient()
            
            full_prompt = f"""
            Context: {json.dumps(context, indent=2)}
            
            Task: {prompt}
            
            Please provide a professional, well-structured response.
            """
            
            if not ai_client.initialized:
                return Response({
                    'response': 'AI service not configured. Please check your API key.',
                    'model': 'gemini-pro',
                    'timestamp': timezone.now().isoformat()
                })
            
            response = ai_client.model.generate_content(
                full_prompt,
                generation_config=ai_client.generation_config,
                safety_settings=ai_client.safety_settings
            )
            
            return Response({
                'response': response.text,
                'model': 'gemini-pro',
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error generating AI content: {e}")
            error_message = 'Failed to generate content'
            
            # Check for quota exceeded error
            if 'quota' in str(e).lower() or '429' in str(e):
                error_message = 'AI API quota exceeded. Please check your billing settings or try again later.'
            
            return Response(
                {'error': error_message, 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MLTrainingView(generics.GenericAPIView):
    """ML model training endpoints"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        """Trigger ML model training"""
        try:
            predictor = BidPredictor()
            predictor.train_models(retrain=True)
            
            return Response({
                'message': 'ML models trained successfully',
                'models': ['win_predictor', 'risk_predictor'],
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error training ML models: {e}")
            return Response(
                {'error': 'Failed to train models'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request):
        """Get ML model status"""
        try:
            predictor = BidPredictor()
            
            # Check if models exist and are trained
            models_status = []
            
            try:
                # Check win predictor
                win_model_status = predictor.get_model_status('win_predictor')
                models_status.append(win_model_status)
            except:
                models_status.append({
                    'name': 'win_predictor',
                    'status': 'error',
                    'accuracy': None,
                    'last_trained': None,
                    'version': None
                })
            
            try:
                # Check risk predictor
                risk_model_status = predictor.get_model_status('risk_predictor')
                models_status.append(risk_model_status)
            except:
                models_status.append({
                    'name': 'risk_predictor',
                    'status': 'error',
                    'accuracy': None,
                    'last_trained': None,
                    'version': None
                })
            
            return Response({
                'models': models_status,
                'last_training': predictor.get_last_training_time()
            })
            
        except Exception as e:
            logger.error(f"Error getting ML model status: {e}")
            return Response(
                {'error': 'Failed to get model status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )