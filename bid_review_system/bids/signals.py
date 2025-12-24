from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Bid, BidReview, BidMilestone
from users.services import NotificationService

@receiver(post_save, sender=Bid)
def bid_created_notification(sender, instance, created, **kwargs):
    """Send notification when a new bid is created"""
    if created:
        # Notify bid managers and reviewers about new bid
        from users.models import User
        
        # Get users who should be notified
        notified_users = User.objects.filter(
            role__in=['admin', 'bid_manager', 'reviewer']
        )
        
        for user in notified_users:
            NotificationService.create_notification(
                user=user,
                notification_type='bid_assigned',
                title=f'New Bid Assigned: {instance.code}',
                message=f'A new bid "{instance.title}" has been submitted for review and assigned to you.',
                priority='high' if instance.is_urgent else 'medium',
                bid_id=instance.id
            )

@receiver(pre_save, sender=Bid)
def bid_status_change_notification(sender, instance, **kwargs):
    """Send notification when bid status changes"""
    if instance.pk:  # Only for existing bids
        try:
            old_instance = Bid.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Status has changed
                from users.models import User
                
                # Get relevant users
                notified_users = User.objects.filter(
                    role__in=['admin', 'bid_manager', 'reviewer']
                )
                
                # Determine notification type and message based on new status
                if instance.status == Bid.BidStatus.APPROVED:
                    notification_type = 'bid_approved'
                    title = f'Bid Approved: {instance.code}'
                    message = f'Bid "{instance.title}" has been approved and is ready for submission.'
                    priority = 'high'
                elif instance.status == Bid.BidStatus.REJECTED:
                    notification_type = 'bid_rejected'
                    title = f'Bid Rejected: {instance.code}'
                    message = f'Bid "{instance.title}" has been rejected. Please review the feedback.'
                    priority = 'high'
                elif instance.status == Bid.BidStatus.WON:
                    notification_type = 'bid_won'
                    title = f'Bid Won! {instance.code}'
                    message = f'Congratulations! Bid "{instance.title}" has been won!'
                    priority = 'critical'
                elif instance.status == Bid.BidStatus.LOST:
                    notification_type = 'bid_lost'
                    title = f'Bid Lost: {instance.code}'
                    message = f'Bid "{instance.title}" was not successful. Review lessons learned.'
                    priority = 'medium'
                elif instance.status in [Bid.BidStatus.UNDER_REVIEW, Bid.BidStatus.TECHNICAL_REVIEW, Bid.BidStatus.COMMERCIAL_REVIEW]:
                    notification_type = 'bid_review'
                    title = f'Bid Review Required: {instance.code}'
                    message = f'Bid "{instance.title}" requires {instance.get_status_display()}.'
                    priority = 'high'
                else:
                    return  # No notification for other status changes
                
                for user in notified_users:
                    NotificationService.create_notification(
                        user=user,
                        notification_type=notification_type,
                        title=title,
                        message=message,
                        priority=priority,
                        bid_id=instance.id
                    )
                    
        except Bid.DoesNotExist:
            pass  # New bid, handled by post_save signal

@receiver(post_save, sender=BidReview)
def bid_review_notification(sender, instance, created, **kwargs):
    """Send notification when a bid review is created or updated"""
    if created:
        # Notify assigned user about new review assignment
        if instance.assigned_to:
            NotificationService.create_notification(
                user=instance.assigned_to,
                notification_type='bid_review',
                title=f'Review Assigned: {instance.bid.code}',
                message=f'You have been assigned to {instance.get_review_type_display()} for bid "{instance.bid.title}".',
                priority='high',
                bid_id=instance.bid.id
            )
    else:
        # Check if review was completed
        if instance.status == 'completed' and instance.decision:
            from users.models import User
            
            # Notify bid managers about review completion
            notified_users = User.objects.filter(
                role__in=['admin', 'bid_manager']
            )
            
            decision_text = f"({instance.get_decision_display()})" if instance.decision else ""
            
            for user in notified_users:
                NotificationService.create_notification(
                    user=user,
                    notification_type='bid_review',
                    title=f'Review Completed: {instance.bid.code}',
                    message=f'{instance.get_review_type_display()} for bid "{instance.bid.title}" has been completed {decision_text}.',
                    priority='medium',
                    bid_id=instance.bid.id
                )

@receiver(post_save, sender=BidMilestone)
def bid_milestone_notification(sender, instance, created, **kwargs):
    """Send notification when a bid milestone is created or updated"""
    if created:
        # Notify assigned user about new milestone
        if instance.assigned_to:
            NotificationService.create_notification(
                user=instance.assigned_to,
                notification_type='deadline_reminder',
                title=f'Milestone Assigned: {instance.name}',
                message=f'You have been assigned to milestone "{instance.name}" for bid "{instance.bid.title}". Due: {instance.due_date.strftime("%Y-%m-%d")}.',
                priority='medium',
                bid_id=instance.bid.id
            )
    else:
        # Check if milestone was completed
        if instance.completed_date and not instance._state.adding:
            from users.models import User
            
            # Notify bid managers about milestone completion
            notified_users = User.objects.filter(
                role__in=['admin', 'bid_manager']
            )
            
            for user in notified_users:
                NotificationService.create_notification(
                    user=user,
                    notification_type='system_update',
                    title=f'Milestone Completed: {instance.name}',
                    message=f'Milestone "{instance.name}" for bid "{instance.bid.title}" has been completed.',
                    priority='low',
                    bid_id=instance.bid.id
                )

# Check for bids due soon (this would typically be run as a periodic task)
def check_bids_due_soon():
    """Check for bids due in the next 48 hours and send reminders"""
    from users.models import User
    
    # Bids due in next 48 hours
    soon_cutoff = timezone.now() + timedelta(hours=48)
    bids_due_soon = Bid.objects.filter(
        status__in=[Bid.BidStatus.DRAFT, Bid.BidStatus.SUBMITTED, Bid.BidStatus.UNDER_REVIEW],
        bid_due_date__lte=soon_cutoff,
        bid_due_date__gt=timezone.now()
    )
    
    for bid in bids_due_soon:
        # Get assigned users and bid managers
        notified_users = User.objects.filter(
            role__in=['admin', 'bid_manager']
        )
        
        if bid.assigned_to:
            notified_users = notified_users | User.objects.filter(id=bid.assigned_to.id)
        
        # Remove duplicates
        notified_users = notified_users.distinct()
        
        for user in notified_users:
            # Check if user already has a notification for this bid being due soon
            from users.models import Notification
            existing_notification = Notification.objects.filter(
                user=user,
                bid_id=bid.id,
                type='bid_due_soon',
                created_at__gte=timezone.now() - timedelta(hours=24)
            ).exists()
            
            if not existing_notification:
                NotificationService.create_notification(
                    user=user,
                    notification_type='bid_due_soon',
                    title=f'Bid Due Soon: {bid.code}',
                    message=f'Bid "{bid.title}" is due on {bid.bid_due_date.strftime("%Y-%m-%d %H:%M")}.',
                    priority='high' if bid.bid_due_date <= timezone.now() + timedelta(hours=24) else 'medium',
                    bid_id=bid.id
                )
