from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
import uuid

from users.models import User

class BidCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    code_prefix = models.CharField(max_length=10, unique=True)
    
    class Meta:
        verbose_name_plural = 'Bid Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    
    # Customer Classification
    customer_type = models.CharField(
        max_length=20,
        choices=[
            ('government', 'Government'),
            ('corporate', 'Corporate'),
            ('sme', 'SME'),
            ('individual', 'Individual'),
        ],
        default='corporate'
    )
    industry = models.CharField(max_length=100, blank=True)
    
    # Financial Information
    annual_revenue = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    credit_rating = models.CharField(max_length=10, blank=True)
    
    # Relationship Metrics
    relationship_score = models.IntegerField(
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    last_interaction = models.DateField(null=True, blank=True)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['customer_type']),
            models.Index(fields=['industry']),
        ]
    
    def __str__(self):
        return self.name

class Bid(models.Model):
    class BidStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted for Review'
        UNDER_REVIEW = 'under_review', 'Under Review'
        TECHNICAL_REVIEW = 'technical_review', 'Technical Review'
        COMMERCIAL_REVIEW = 'commercial_review', 'Commercial Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        WON = 'won', 'Won'
        LOST = 'lost', 'Lost'
        CANCELLED = 'cancelled', 'Cancelled'
    
    class Priority(models.TextChoices):
        CRITICAL = 'critical', 'Critical'
        HIGH = 'high', 'High'
        MEDIUM = 'medium', 'Medium'
        LOW = 'low', 'Low'
    
    class Complexity(models.TextChoices):
        SIMPLE = 'simple', 'Simple'
        MODERATE = 'moderate', 'Moderate'
        COMPLEX = 'complex', 'Complex'
        HIGHLY_COMPLEX = 'highly_complex', 'Highly Complex'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core Information
    code = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=500)
    description = models.TextField()
    
    # Category
    category = models.ForeignKey(BidCategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Dates
    br_request_date = models.DateField(verbose_name="BR Request Date")
    br_date = models.DateField(verbose_name="BR Date")
    bid_due_date = models.DateField(verbose_name="Bid Due Date")
    submission_date = models.DateField(null=True, blank=True)
    decision_date = models.DateField(null=True, blank=True)
    
    # Classification
    is_urgent = models.BooleanField(default=False)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    complexity = models.CharField(max_length=20, choices=Complexity.choices, default=Complexity.MODERATE)
    
    # Business Unit & Level
    business_unit = models.CharField(
        max_length=10,
        choices=[
            ('JIS', 'JIS'),
            ('JCS', 'JCS'),
        ]
    )
    bid_level = models.CharField(
        max_length=10,
        choices=[
            ('A', 'A Level - Strategic'),
            ('B', 'B Level - Major'),
            ('C', 'C Level - Standard'),
            ('D', 'D Level - Minor'),
        ],
        default='C'
    )
    
    # Financial Information
    bid_value = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
    )
    estimated_cost = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
    )
    profit_margin = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Estimated profit margin percentage"
    )
    currency = models.CharField(max_length=3, default='USD')
    
    # Customer Information
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='bids')
    region = models.CharField(max_length=100)
    country = models.CharField(max_length=100, blank=True)
    
    # Stakeholders
    requested_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='bids_requested'
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bids_assigned'
    )
    team_members = models.ManyToManyField(
        User,
        related_name='bids_team',
        blank=True
    )
    
    # Status & Progress
    status = models.CharField(
        max_length=30,
        choices=BidStatus.choices,
        default=BidStatus.DRAFT
    )
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # AI/ML Features
    win_probability = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="ML predicted win probability (%)"
    )
    risk_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="ML calculated risk score (0-100)"
    )
    complexity_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="AI assessed complexity score"
    )
    ai_recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text="AI generated recommendations"
    )
    ml_features = models.JSONField(
        default=dict,
        blank=True,
        help_text="Features used for ML predictions"
    )
    
    # Requirements
    requirements = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured requirements"
    )
    comments = models.TextField(blank=True)
    winner = models.CharField(max_length=200, blank=True)
    
    # Documents & Attachments
    rfp_document = models.FileField(upload_to='rfp_documents/', null=True, blank=True)
    proposal_document = models.FileField(upload_to='proposals/', null=True, blank=True)
    
    # Review Information
    last_review_date = models.DateTimeField(null=True, blank=True)
    next_review_date = models.DateTimeField(null=True, blank=True)
    review_cycle = models.IntegerField(default=1)
    
    # Metadata
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    internal_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    # Audit
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='bids_created'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status']),
            models.Index(fields=['bid_due_date']),
            models.Index(fields=['business_unit']),
            models.Index(fields=['priority']),
            models.Index(fields=['win_probability']),
            models.Index(fields=['created_at']),
            models.Index(fields=['customer', 'created_at']),
        ]
        verbose_name = 'Bid'
        verbose_name_plural = 'Bids'
    
    def __str__(self):
        return f'{self.code}: {self.title}'
    
    @property
    def days_until_due(self):
        if self.bid_due_date:
            delta = self.bid_due_date - timezone.now().date()
            return delta.days
        return None
    
    @property
    def is_overdue(self):
        return self.days_until_due is not None and self.days_until_due < 0
    
    @property
    def estimated_profit(self):
        if self.bid_value and self.profit_margin:
            return self.bid_value * (self.profit_margin / 100)
        return None
    
    @property
    def requires_attention(self):
        return (
            self.is_urgent or 
            self.priority in ['critical', 'high'] or
            self.is_overdue or
            (self.days_until_due is not None and self.days_until_due <= 3)
        )

class BidReview(models.Model):
    class ReviewType(models.TextChoices):
        TECHNICAL = 'technical', 'Technical Review'
        COMMERCIAL = 'commercial', 'Commercial Review'
        LEGAL = 'legal', 'Legal Review'
        FINANCIAL = 'financial', 'Financial Review'
        RISK = 'risk', 'Risk Assessment'
        FINAL = 'final', 'Final Review'
    
    class Decision(models.TextChoices):
        APPROVED = 'approved', 'Approved'
        APPROVED_WITH_COMMENTS = 'approved_comments', 'Approved with Comments'
        MODIFICATIONS_REQUIRED = 'modifications_required', 'Modifications Required'
        REJECTED = 'rejected', 'Rejected'
        ESCALATED = 'escalated', 'Escalated'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bid = models.ForeignKey(Bid, on_delete=models.CASCADE, related_name='reviews')
    
    # Review Details
    review_type = models.CharField(max_length=20, choices=ReviewType.choices)
    sequence = models.IntegerField(default=1)
    
    # Assignments
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_reviews')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='completed_reviews')
    
    # Dates
    assigned_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    completed_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=30,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('overdue', 'Overdue'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    decision = models.CharField(max_length=30, choices=Decision.choices, null=True, blank=True)
    
    # Review Content
    score = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    strengths = models.TextField(blank=True)
    weaknesses = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    comments = models.TextField(blank=True)
    
    # AI Assistance
    ai_analysis = models.JSONField(default=dict, blank=True)
    ai_suggestions = models.TextField(blank=True)
    sentiment_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Metadata
    is_mandatory = models.BooleanField(default=True)
    requires_signature = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sequence', 'assigned_date']
        unique_together = ['bid', 'review_type', 'sequence']
    
    def __str__(self):
        return f'{self.review_type} Review for {self.bid.code}'

class BidMilestone(models.Model):
    bid = models.ForeignKey(Bid, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField()
    completed_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('delayed', 'Delayed'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['due_date']
    
    def __str__(self):
        return f'{self.name} for {self.bid.code}'

class BidDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bid = models.ForeignKey(Bid, on_delete=models.CASCADE, related_name='documents')
    
    # File Information
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='bid_documents/')
    file_type = models.CharField(max_length=50)
    file_size = models.PositiveIntegerField()
    
    # Metadata
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    upload_date = models.DateTimeField(auto_now_add=True)
    
    # Optional description
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['bid', 'upload_date']),
            models.Index(fields=['uploaded_by']),
        ]
    
    def __str__(self):
        return f'{self.name} for {self.bid.code}'
    
    @property
    def file_url(self):
        return self.file.url if self.file else None

class BidAnalytics(models.Model):
    bid = models.OneToOneField(Bid, on_delete=models.CASCADE, related_name='analytics')
    
    # Engagement Metrics
    total_views = models.IntegerField(default=0)
    total_edits = models.IntegerField(default=0)
    total_reviews = models.IntegerField(default=0)
    total_comments = models.IntegerField(default=0)
    
    # Time Metrics
    time_to_submit = models.DurationField(null=True, blank=True)
    time_to_decision = models.DurationField(null=True, blank=True)
    review_cycle_time = models.DurationField(null=True, blank=True)
    
    # Cost Metrics
    estimated_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Quality Metrics
    quality_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    compliance_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # ML Insights
    pattern_insights = models.JSONField(default=dict, blank=True)
    anomaly_flags = models.JSONField(default=list, blank=True)
    
    # Historical Data
    status_history = models.JSONField(default=list, blank=True)
    value_history = models.JSONField(default=list, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'Analytics for {self.bid.code}'