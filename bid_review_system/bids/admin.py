from django.contrib import admin
from .models import BidCategory, Customer, Bid, BidReview, BidMilestone, BidAnalytics

@admin.register(BidCategory)
class BidCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code_prefix', 'parent']
    list_filter = ['parent']
    search_fields = ['name', 'code_prefix']

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer_type', 'industry', 'relationship_score', 'is_active']
    list_filter = ['customer_type', 'industry', 'is_active']
    search_fields = ['name', 'email', 'code']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'title', 'business_unit', 'bid_level',
        'status', 'priority', 'bid_due_date', 'is_urgent',
        'win_probability', 'risk_score'
    ]
    list_filter = [
        'business_unit', 'status', 'priority', 'bid_level',
        'is_urgent', 'complexity', 'created_at'
    ]
    search_fields = ['code', 'title', 'description', 'customer__name']
    readonly_fields = ['created_at', 'updated_at', 'last_review_date']
    filter_horizontal = ['team_members']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'title', 'description', 'category')
        }),
        ('Dates', {
            'fields': ('br_request_date', 'br_date', 'bid_due_date', 'submission_date', 'decision_date')
        }),
        ('Classification', {
            'fields': ('is_urgent', 'priority', 'complexity', 'business_unit', 'bid_level')
        }),
        ('Financial', {
            'fields': ('bid_value', 'estimated_cost', 'profit_margin', 'currency')
        }),
        ('Customer Information', {
            'fields': ('customer', 'region', 'country')
        }),
        ('Stakeholders', {
            'fields': ('requested_by', 'assigned_to', 'team_members', 'created_by')
        }),
        ('Status & Progress', {
            'fields': ('status', 'progress')
        }),
        ('AI/ML Features', {
            'fields': ('win_probability', 'risk_score', 'complexity_score', 'ai_recommendations', 'ml_features')
        }),
        ('Requirements & Comments', {
            'fields': ('requirements', 'comments', 'winner', 'internal_notes')
        }),
        ('Review Information', {
            'fields': ('last_review_date', 'next_review_date', 'review_cycle')
        }),
        ('Metadata', {
            'fields': ('tags',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'closed_at')
        }),
    )

@admin.register(BidReview)
class BidReviewAdmin(admin.ModelAdmin):
    list_display = ['bid', 'review_type', 'assigned_to', 'status', 'decision', 'due_date']
    list_filter = ['review_type', 'status', 'decision', 'assigned_date']
    search_fields = ['bid__code', 'bid__title', 'assigned_to__email']

@admin.register(BidMilestone)
class BidMilestoneAdmin(admin.ModelAdmin):
    list_display = ['bid', 'name', 'due_date', 'status', 'assigned_to']
    list_filter = ['status', 'due_date']
    search_fields = ['bid__code', 'name']

@admin.register(BidAnalytics)
class BidAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['bid', 'total_views', 'total_edits', 'quality_score']
    search_fields = ['bid__code']
    readonly_fields = ['updated_at']