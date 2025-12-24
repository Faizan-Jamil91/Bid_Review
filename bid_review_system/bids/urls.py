from django.urls import path
from .views import (
    BidViewSet, BidReviewViewSet, CustomerViewSet, BidMilestoneViewSet,
    AIToolsView, MLTrainingView
)

# Explicitly define all URL patterns
urlpatterns = [
    # Bids endpoints
    path('', BidViewSet.as_view({'get': 'list', 'post': 'create'}), name='bid-list'),
    path('<uuid:pk>/', BidViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='bid-detail'),
    
    # Customers endpoints
    path('customers/', CustomerViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='customer-list'),
    
    path('customers/<uuid:pk>/', CustomerViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='customer-detail'),
    
    # Reviews endpoints
    path('reviews/', BidReviewViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='review-list'),
    
    path('reviews/<uuid:pk>/', BidReviewViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='review-detail'),
    
    # Milestones endpoints
    path('milestones/', BidMilestoneViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='milestone-list'),
    
    path('milestones/<uuid:pk>/', BidMilestoneViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='milestone-detail'),
    
    # Special endpoints
    path('<uuid:pk>/predict/', BidViewSet.as_view({'post': 'predict'}), name='bid-predict'),
    path('<uuid:pk>/generate-proposal/', BidViewSet.as_view({'post': 'generate_proposal'}), name='bid-generate-proposal'),
    path('<uuid:pk>/analyze-requirements/', BidViewSet.as_view({'post': 'analyze_requirements'}), name='bid-analyze-requirements'),
    path('<uuid:pk>/upload_documents/', BidViewSet.as_view({'post': 'upload_documents'}), name='bid-upload-documents'),
    path('<uuid:pk>/documents/', BidViewSet.as_view({'get': 'documents'}), name='bid-documents'),
    path('<uuid:pk>/documents/<str:document_id>/', BidViewSet.as_view({'patch': 'update_document', 'delete': 'delete_document'}), name='bid-document-detail'),
    path('<uuid:pk>/documents/<str:document_id>/download/', BidViewSet.as_view({'get': 'download_document'}), name='bid-download-document'),
    path('dashboard/', BidViewSet.as_view({'get': 'dashboard'}), name='bid-dashboard'),
    path('reviews/<uuid:pk>/complete/', BidReviewViewSet.as_view({'post': 'complete'}), name='review-complete'),
    
    # AI Tools
    path('ai/tools/', AIToolsView.as_view(), name='ai-tools'),
    
    # ML Training
    path('ml/train/', MLTrainingView.as_view(), name='ml-train'),
    path('ml/status/', MLTrainingView.as_view(), name='ml-status'),
]