from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailBackend(ModelBackend):
    """
    Custom authentication backend that allows users to login with their email address.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user using email as username.
        """
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        
        try:
            # Try to get user by email (since USERNAME_FIELD is 'email')
            user = User.objects.get(**{User.USERNAME_FIELD: username})
        except User.DoesNotExist:
            # Run the default password hasher once to reduce timing
            # differences between existing and non-existing users.
            User().set_password(password)
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
    
    def get_user(self, user_id):
        """
        Retrieve user by user_id.
        """
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
        
        return user if self.user_can_authenticate(user) else None
