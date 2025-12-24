from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
import json

from bids.models import Bid, BidReview, Customer
from users.models import User
from users.permissions import IsAdminUser, IsManagerOrAdmin

class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
    
    def get(self, request):
        user = request.user
        
        # Date ranges
        today = timezone.now().date()
        last_week = today - timedelta(days=7)
        last_month = today - timedelta(days=30)
        last_quarter = today - timedelta(days=90)
        
        # Get base queryset
        bids = Bid.objects.all()
        if user.role != 'admin' and user.business_unit != 'all':
            bids = bids.filter(business_unit=user.business_unit)
        
        # Overview metrics
        total_bids = bids.count()
        active_bids = bids.exclude(status__in=['won', 'lost', 'cancelled']).count()
        won_bids = bids.filter(status='won').count()
        lost_bids = bids.filter(status='lost').count()
        
        # Financial metrics
        total_value = bids.aggregate(total=Sum('bid_value'))['total'] or 0
        won_value = bids.filter(status='won').aggregate(total=Sum('bid_value'))['total'] or 0
        avg_win_probability = bids.aggregate(avg=Avg('win_probability'))['avg'] or 0
        
        # Win rate
        win_rate = (won_bids / total_bids * 100) if total_bids > 0 else 0
        
        # Time-based metrics
        recent_bids = bids.filter(created_at__gte=last_month)
        bids_by_status = dict(bids.values_list('status').annotate(count=Count('id')))
        
        # Business unit distribution
        bids_by_business_unit = dict(bids.values_list('business_unit').annotate(count=Count('id')))
        
        # Priority distribution
        bids_by_priority = dict(bids.values_list('priority').annotate(count=Count('id')))
        
        # Urgent bids
        urgent_bids = bids.filter(is_urgent=True).count()
        
        # Overdue bids
        overdue_bids = bids.filter(bid_due_date__lt=today).exclude(status__in=['won', 'lost', 'cancelled']).count()
        
        # Upcoming deadlines (next 7 days)
        upcoming_deadlines = bids.filter(
            bid_due_date__gte=today,
            bid_due_date__lte=today + timedelta(days=7)
        ).exclude(status__in=['won', 'lost', 'cancelled']).count()
        
        # Customer analytics
        top_customers = Customer.objects.annotate(
            total_bids=Count('bids'),
            total_value=Sum('bids__bid_value'),
            win_rate=Avg('bids__win_probability')
        ).order_by('-total_value')[:5]
        
        # Team performance
        team_performance = User.objects.filter(
            bids_requested__isnull=False
        ).annotate(
            total_bids=Count('bids_requested'),
            won_bids=Count('bids_requested', filter=Q(bids_requested__status='won')),
            total_value=Sum('bids_requested__bid_value'),
            avg_win_probability=Avg('bids_requested__win_probability')
        ).filter(total_bids__gt=0).order_by('-avg_win_probability')[:10]
        
        # Response data
        response_data = {
            'overview': {
                'total_bids': total_bids,
                'active_bids': active_bids,
                'won_bids': won_bids,
                'lost_bids': lost_bids,
                'win_rate': win_rate,
                'total_value': float(total_value),
                'won_value': float(won_value),
                'avg_win_probability': float(avg_win_probability),
                'urgent_bids': urgent_bids,
                'overdue_bids': overdue_bids,
                'upcoming_deadlines': upcoming_deadlines,
            },
            'distributions': {
                'by_status': bids_by_status,
                'by_business_unit': bids_by_business_unit,
                'by_priority': bids_by_priority,
            },
            'top_customers': [
                {
                    'name': customer.name,
                    'total_bids': customer.total_bids,
                    'total_value': float(customer.total_value or 0),
                    'win_rate': float(customer.win_rate or 0),
                    'relationship_score': customer.relationship_score
                }
                for customer in top_customers
            ],
            'team_performance': [
                {
                    'user': {
                        'id': str(user.id),
                        'name': user.full_name,
                        'email': user.email,
                        'role': user.role
                    },
                    'total_bids': user.total_bids,
                    'won_bids': user.won_bids,
                    'win_rate': (user.won_bids / user.total_bids * 100) if user.total_bids > 0 else 0,
                    'total_value': float(user.total_value or 0),
                    'avg_win_probability': float(user.avg_win_probability or 0)
                }
                for user in team_performance
            ],
            'time_periods': {
                'last_week': last_week.isoformat(),
                'last_month': last_month.isoformat(),
                'last_quarter': last_quarter.isoformat(),
                'today': today.isoformat()
            }
        }
        
        return Response(response_data)