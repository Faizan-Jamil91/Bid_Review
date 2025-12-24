import os
import sys
from django.core.wsgi import get_wsgi_application

# Add the bid_review_system directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bid_review_system'))

# Set Django settings module for production
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bid_review_system.settings_production')

# Get Django WSGI application
application = get_wsgi_application()
