from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from celery import shared_task
from .models import Notification, NotificationPreferences

class NotificationService:
    """Service for handling notifications"""
    
    @staticmethod
    def create_notification(user, notification_type, title, message, priority='medium', bid_id=None):
        """Create a new notification"""
        notification = Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            priority=priority,
            bid_id=bid_id
        )
        
        # Send email if enabled
        NotificationService._send_email_if_enabled(notification)
        
        return notification
    
    @staticmethod
    def _send_email_if_enabled(notification):
        """Send email notification if user has it enabled"""
        try:
            preferences = notification.user.notification_preferences
            
            # Check if notifications are enabled
            if not preferences.email_notifications:
                return
            
            # Check if this notification type is enabled
            if not preferences.is_notification_enabled(notification.type):
                return
            
            # Check professional notification settings
            if notification.user.is_professional:
                if not NotificationService._should_send_professional_notification(notification, preferences):
                    return
            
            # Send email
            NotificationService._send_email(notification)
            notification.mark_email_sent()
            
        except NotificationPreferences.DoesNotExist:
            # Create default preferences and retry
            preferences = NotificationPreferences.objects.create(
                user=notification.user,
                enabled_notifications=[
                    'bid_assigned', 'bid_review', 'bid_approved', 
                    'bid_rejected', 'bid_due_soon', 'deadline_reminder'
                ]
            )
            NotificationService._send_email_if_enabled(notification)
    
    @staticmethod
    def _should_send_professional_notification(notification, preferences):
        """Check if professional notification should be sent"""
        # Check professional-specific notification types
        professional_types = ['bid_assigned', 'bid_review', 'bid_due_soon']
        
        if notification.type in professional_types:
            if notification.type == 'bid_assigned' and not preferences.professional_bid_notifications:
                return False
            elif notification.type == 'bid_review' and not preferences.professional_review_notifications:
                return False
            elif notification.type == 'bid_due_soon' and not preferences.professional_deadline_notifications:
                return False
        
        # Check priority threshold
        if preferences.professional_priority_threshold == 'high':
            return notification.priority in ['high', 'critical']
        elif preferences.professional_priority_threshold == 'critical':
            return notification.priority == 'critical'
        
        return True
    
    @staticmethod
    def _send_email(notification):
        """Send email notification"""
        subject = f"[BidReview] {notification.title}"
        
        # Create HTML email template
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">BidReview</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Professional Bid Management System</p>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
                <h2 style="color: #374151; margin-bottom: 15px;">{notification.title}</h2>
                <p style="color: #6b7280; line-height: 1.6;">{notification.message}</p>
                
                <div style="margin-top: 25px; padding: 15px; background-color: #e5e7eb; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        <strong>Priority:</strong> {notification.get_priority_display()}<br>
                        <strong>Type:</strong> {notification.get_type_display()}<br>
                        <strong>Time:</strong> {notification.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
                    </p>
                </div>
            </div>
            
            <div style="padding: 20px; text-align: center; background-color: #f3f4f6;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    This is an automated notification from BidReview System.<br>
                    You can manage your notification preferences in your profile settings.
                </p>
            </div>
        </body>
        </html>
        """
        
        try:
            send_mail(
                subject=subject,
                message=f"{notification.title}\n\n{notification.message}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.user.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't fail the notification creation
            print(f"Failed to send email notification: {e}")
    
    @staticmethod
    def mark_notifications_read(user, notification_ids=None):
        """Mark notifications as read"""
        if notification_ids:
            notifications = Notification.objects.filter(
                user=user, 
                id__in=notification_ids,
                is_read=False
            )
        else:
            notifications = Notification.objects.filter(user=user, is_read=False)
        
        for notification in notifications:
            notification.mark_as_read()
        
        return notifications.count()
    
    @staticmethod
    def get_unread_count(user):
        """Get count of unread notifications for user"""
        return Notification.objects.filter(user=user, is_read=False).count()
    
    @staticmethod
    def get_notifications(user, unread_only=False, limit=20):
        """Get notifications for user"""
        queryset = Notification.objects.filter(user=user)
        
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        return queryset[:limit]

# Celery tasks for async email sending
@shared_task
def send_notification_email_async(notification_id):
    """Send notification email asynchronously"""
    try:
        notification = Notification.objects.get(id=notification_id)
        NotificationService._send_email(notification)
        notification.mark_email_sent()
    except Notification.DoesNotExist:
        pass

@shared_task
def send_bulk_notifications(user_ids, notification_type, title, message, priority='medium', bid_id=None):
    """Send bulk notifications to multiple users"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    users = User.objects.filter(id__in=user_ids)
    notifications = []
    
    for user in users:
        notification = NotificationService.create_notification(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            bid_id=bid_id
        )
        notifications.append(notification)
    
    return len(notifications)
