from rest_framework import permissions
from users.models import User

class BidPermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        
        # Everyone can view bids
        if request.method in permissions.SAFE_METHODS:
            return user.is_authenticated
        
        # Only specific roles can create/edit bids
        if user.role in [User.Role.ADMIN, User.Role.BID_MANAGER, User.Role.REVIEWER, User.Role.SALES]:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admin can do everything
        if user.role == User.Role.ADMIN:
            return True
        
        # Everyone can view bids
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Managers and reviewers can edit bids in their business unit
        if user.role in [User.Role.BID_MANAGER, User.Role.REVIEWER]:
            if user.business_unit == User.BusinessUnit.ALL:
                return True
            return obj.business_unit == user.business_unit
        
        # Sales can only edit their own bids
        if user.role == User.Role.SALES:
            return obj.requested_by == user
        
        return False

class ReviewPermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        
        # All authenticated users can view reviews
        if view.action in ['list', 'retrieve']:
            return user.is_authenticated
        
        # Only specific roles can create reviews
        if view.action == 'create':
            return user.is_authenticated and user.role in [
                User.Role.ADMIN, 
                User.Role.BID_MANAGER, 
                User.Role.REVIEWER,
                User.Role.ANALYST  # Allow analysts to create reviews too
            ]
        
        # Only admin and bid_manager can update/delete reviews
        if view.action in ['update', 'partial_update', 'destroy']:
            return user.is_authenticated and user.role in [
                User.Role.ADMIN, 
                User.Role.BID_MANAGER
            ]
        
        return user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role == User.Role.ADMIN:
            return True
        
        # Users can view reviews assigned to them or for bids in their business unit
        if view.action in ['retrieve', 'list']:
            if obj.assigned_to == user:
                return True
            
            if user.role in [User.Role.BID_MANAGER, User.Role.REVIEWER, User.Role.ANALYST]:
                if user.business_unit == User.BusinessUnit.ALL:
                    return True
                return obj.bid.business_unit == user.business_unit
        
        # Users can update reviews assigned to them
        if view.action in ['update', 'partial_update'] and obj.assigned_to == user:
            return True
        
        # Only admin and bid_manager can delete reviews
        if view.action == 'destroy' and user.role in [User.Role.ADMIN, User.Role.BID_MANAGER]:
            return True
        
        return False