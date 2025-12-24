from rest_framework import serializers
from .models import Bid, BidReview, BidMilestone, Customer, BidCategory, BidDocument
from users.models import User

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'code', 'email', 'phone', 'address', 'website',
            'customer_type', 'industry', 'annual_revenue', 'credit_rating',
            'relationship_score', 'is_active', 'tags', 'notes'
        ]
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'customer_type': {'required': True},
            'is_active': {'default': True},
            'tags': {'default': list, 'required': False},
        }

    def validate_name(self, value):
        """Ensure name is unique and not empty"""
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty")
        return value.strip()

    def validate_customer_type(self, value):
        """Ensure customer_type is one of the valid choices"""
        valid_types = ['government', 'corporate', 'sme', 'individual']
        if value not in valid_types:
            raise serializers.ValidationError(f"Customer type must be one of {', '.join(valid_types)}")
        return value

class BidCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BidCategory
        fields = ['id', 'name', 'description', 'code_prefix', 'parent']

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role']

class BidSerializer(serializers.ModelSerializer):
    customer_detail = CustomerSerializer(source='customer', read_only=True)
    requested_by_detail = UserSimpleSerializer(source='requested_by', read_only=True)
    assigned_to_detail = UserSimpleSerializer(source='assigned_to', read_only=True)
    category_detail = BidCategorySerializer(source='category', read_only=True)
    days_until_due = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    estimated_profit = serializers.SerializerMethodField()
    
    class Meta:
        model = Bid
        fields = [
            'id', 'code', 'title', 'description',
            'br_request_date', 'br_date', 'bid_due_date',
            'submission_date', 'decision_date',
            'is_urgent', 'priority', 'complexity',
            'business_unit', 'bid_level',
            'bid_value', 'estimated_cost', 'profit_margin', 'currency',
            'customer', 'customer_detail',
            'region', 'country',
            'requested_by', 'requested_by_detail',
            'assigned_to', 'assigned_to_detail',
            'team_members',
            'status', 'progress',
            'win_probability', 'risk_score', 'complexity_score',
            'ai_recommendations', 'ml_features',
            'requirements', 'comments', 'winner',
            'last_review_date', 'next_review_date', 'review_cycle',
            'tags', 'internal_notes',
            'created_at', 'updated_at', 'closed_at',
            'days_until_due', 'is_overdue', 'estimated_profit',
            'category', 'category_detail'
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_review_date']
    
    def get_days_until_due(self, obj):
        return obj.days_until_due
    
    def get_is_overdue(self, obj):
        return obj.is_overdue
    
    def get_estimated_profit(self, obj):
        return obj.estimated_profit

class BidCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = [
            'code', 'title', 'description',
            'br_request_date', 'br_date', 'bid_due_date',
            'is_urgent', 'priority', 'complexity',
            'business_unit', 'bid_level',
            'bid_value', 'estimated_cost', 'profit_margin', 'currency',
            'customer', 'region', 'country',
            'requirements', 'comments',
            'category'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['requested_by'] = request.user
            validated_data['created_by'] = request.user
        return super().create(validated_data)

class BidReviewSerializer(serializers.ModelSerializer):
    bid_code = serializers.CharField(source='bid.code', read_only=True)
    bid_title = serializers.CharField(source='bid.title', read_only=True)
    assigned_to_detail = UserSimpleSerializer(source='assigned_to', read_only=True)
    reviewed_by_detail = UserSimpleSerializer(source='reviewed_by', read_only=True)
    
    class Meta:
        model = BidReview
        fields = [
            'id', 'bid', 'bid_code', 'bid_title',
            'review_type', 'sequence',
            'assigned_to', 'assigned_to_detail',
            'reviewed_by', 'reviewed_by_detail',
            'assigned_date', 'due_date', 'completed_date',
            'status', 'decision',
            'score', 'strengths', 'weaknesses',
            'recommendations', 'comments',
            'ai_analysis', 'ai_suggestions', 'sentiment_score',
            'is_mandatory', 'requires_signature',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['assigned_date', 'created_at', 'updated_at']

class BidMilestoneSerializer(serializers.ModelSerializer):
    bid_code = serializers.CharField(source='bid.code', read_only=True)
    assigned_to_detail = UserSimpleSerializer(source='assigned_to', read_only=True)
    
    class Meta:
        model = BidMilestone
        fields = [
            'id', 'bid', 'bid_code',
            'name', 'description',
            'due_date', 'completed_date',
            'status', 'assigned_to', 'assigned_to_detail'
        ]

class AIPredictionSerializer(serializers.Serializer):
    win_probability = serializers.FloatField()
    risk_score = serializers.FloatField()
    confidence = serializers.FloatField()
    recommendations = serializers.ListField(child=serializers.CharField())
    timestamp = serializers.DateTimeField()

class AIRecommendationSerializer(serializers.Serializer):
    recommendations = serializers.ListField(child=serializers.CharField())
    reasoning = serializers.CharField()
    priority = serializers.CharField()

class BidDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = UserSimpleSerializer(source='uploaded_by', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BidDocument
        fields = [
            'id', 'bid', 'name', 'file', 'file_type', 'file_size',
            'uploaded_by', 'uploaded_by_detail', 'upload_date',
            'description', 'file_url'
        ]
        read_only_fields = ['uploaded_by', 'upload_date', 'file_size', 'file_type']
    
    def get_file_url(self, obj):
        return obj.file_url
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['uploaded_by'] = request.user
        
        # Extract file info
        file = validated_data.get('file')
        if file:
            validated_data['name'] = validated_data.get('name', file.name)
            validated_data['file_size'] = file.size
            validated_data['file_type'] = file.content_type or 'application/octet-stream'
        
        return super().create(validated_data)