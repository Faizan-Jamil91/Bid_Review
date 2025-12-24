from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.validators import MinLengthValidator
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        
        return self.create_user(email, username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrator'
        BID_MANAGER = 'bid_manager', 'Bid Manager'
        REVIEWER = 'reviewer', 'Reviewer'
        ANALYST = 'analyst', 'Business Analyst'
        VIEWER = 'viewer', 'Viewer'
        SALES = 'sales', 'Sales Executive'
    
    class BusinessUnit(models.TextChoices):
        JIS = 'JIS', 'JIS Business Unit'
        JCS = 'JCS', 'JCS Business Unit'
        ALL = 'all', 'All Business Units'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name='Email Address')
    username = models.CharField(max_length=150, unique=True, validators=[MinLengthValidator(3)])
    
    # Personal Information
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    title = models.CharField(max_length=100, blank=True, verbose_name='Job Title')
    department = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Role and Permissions
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
        verbose_name='User Role'
    )
    business_unit = models.CharField(
        max_length=10,
        choices=BusinessUnit.choices,
        default=BusinessUnit.ALL,
        verbose_name='Business Unit'
    )
    
    # Flags
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    requires_password_change = models.BooleanField(default=False)
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    last_password_change = models.DateTimeField(default=timezone.now)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    # Professional Options
    is_professional = models.BooleanField(default=False, verbose_name='Professional User')
    professional_title = models.CharField(max_length=100, blank=True, verbose_name='Professional Title')
    professional_bio = models.TextField(blank=True, verbose_name='Professional Bio')
    
    # Analytics
    login_count = models.IntegerField(default=0)
    failed_login_attempts = models.IntegerField(default=0)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['role']),
            models.Index(fields=['business_unit']),
            models.Index(fields=['date_joined']),
        ]
    
    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'
    
    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()
    
    @property
    def is_manager_or_above(self):
        return self.role in [self.Role.ADMIN, self.Role.BID_MANAGER]
    
    @property
    def can_review_bids(self):
        return self.role in [self.Role.ADMIN, self.Role.BID_MANAGER, self.Role.REVIEWER]
    
    @property
    def can_view_analytics(self):
        return self.role in [self.Role.ADMIN, self.Role.BID_MANAGER, self.Role.ANALYST]
    
    def update_last_activity(self):
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])

class NotificationPreferences(models.Model):
    class NotificationType(models.TextChoices):
        BID_ASSIGNED = 'bid_assigned', 'Bid Assigned'
        BID_REVIEW = 'bid_review', 'Bid Review Required'
        BID_APPROVED = 'bid_approved', 'Bid Approved'
        BID_REJECTED = 'bid_rejected', 'Bid Rejected'
        BID_DUE_SOON = 'bid_due_soon', 'Bid Due Soon'
        BID_WON = 'bid_won', 'Bid Won'
        BID_LOST = 'bid_lost', 'Bid Lost'
        DEADLINE_REMINDER = 'deadline_reminder', 'Deadline Reminder'
        SYSTEM_UPDATE = 'system_update', 'System Update'
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Professional notification preferences
    professional_bid_notifications = models.BooleanField(
        default=True, 
        verbose_name='Professional Bid Notifications',
        help_text='Receive notifications for professional bid activities'
    )
    professional_review_notifications = models.BooleanField(
        default=True,
        verbose_name='Professional Review Notifications',
        help_text='Receive notifications for professional review requests'
    )
    professional_deadline_notifications = models.BooleanField(
        default=True,
        verbose_name='Professional Deadline Notifications',
        help_text='Receive professional deadline reminders'
    )
    
    # Notification types enabled
    enabled_notifications = models.JSONField(
        default=list,
        blank=True,
        help_text='List of enabled notification types'
    )
    
    # Notification channels
    email_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    
    # Professional-specific settings
    professional_email_frequency = models.CharField(
        max_length=20,
        choices=[
            ('immediate', 'Immediate'),
            ('hourly', 'Hourly'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
        ],
        default='immediate',
        verbose_name='Professional Email Frequency'
    )
    
    professional_priority_threshold = models.CharField(
        max_length=20,
        choices=[
            ('all', 'All Notifications'),
            ('high', 'High Priority Only'),
            ('critical', 'Critical Only'),
        ],
        default='high',
        verbose_name='Professional Priority Threshold'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notification Preferences'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f'Notification Preferences for {self.user.email}'
    
    def is_notification_enabled(self, notification_type):
        """Check if a specific notification type is enabled"""
        return notification_type in self.enabled_notifications
    
    def enable_notification_type(self, notification_type):
        """Enable a specific notification type"""
        if notification_type not in self.enabled_notifications:
            self.enabled_notifications.append(notification_type)
            self.save()
    
    def disable_notification_type(self, notification_type):
        """Disable a specific notification type"""
        if notification_type in self.enabled_notifications:
            self.enabled_notifications.remove(notification_type)
            self.save()

class Notification(models.Model):
    class Type(models.TextChoices):
        BID_ASSIGNED = 'bid_assigned', 'Bid Assigned'
        BID_REVIEW = 'bid_review', 'Bid Review Required'
        BID_APPROVED = 'bid_approved', 'Bid Approved'
        BID_REJECTED = 'bid_rejected', 'Bid Rejected'
        BID_DUE_SOON = 'bid_due_soon', 'Bid Due Soon'
        BID_WON = 'bid_won', 'Bid Won'
        BID_LOST = 'bid_lost', 'Bid Lost'
        DEADLINE_REMINDER = 'deadline_reminder', 'Deadline Reminder'
        SYSTEM_UPDATE = 'system_update', 'System Update'
    
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=Type.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    
    # Optional related object
    bid_id = models.UUIDField(null=True, blank=True)
    
    # Status and timestamps
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Email notification status
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['type']),
            models.Index(fields=['priority']),
        ]
    
    def __str__(self):
        return f'{self.title} - {self.user.email}'
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def mark_email_sent(self):
        """Mark email as sent"""
        self.email_sent = True
        self.email_sent_at = timezone.now()
        self.save(update_fields=['email_sent', 'email_sent_at'])