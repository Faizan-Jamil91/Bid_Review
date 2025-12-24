from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'username', 'first_name', 'last_name',
        'role', 'business_unit', 'is_active', 'is_staff',
        'date_joined', 'last_login'
    ]
    list_filter = [
        'role', 'business_unit', 'is_active', 'is_staff', 'date_joined'
    ]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login', 'last_activity']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'first_name', 'last_name', 'title', 'department', 'phone_number')}),
        ('Permissions', {'fields': (
            'role', 'business_unit',
            'is_active', 'is_staff', 'is_superuser',
            'is_verified', 'requires_password_change',
            'groups', 'user_permissions'
        )}),
        ('Important Dates', {'fields': ('date_joined', 'last_login', 'last_activity', 'last_password_change')}),
        ('Analytics', {'fields': ('login_count', 'failed_login_attempts')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )