from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User
from bids.models import Customer, Bid, BidCategory
import random
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Create demo data for testing'
    
    def handle(self, *args, **options):
        self.stdout.write('Creating demo data...')
        
        # Create users
        users = []
        roles = ['admin', 'bid_manager', 'reviewer', 'analyst', 'sales', 'viewer']
        
        for i in range(1, 11):
            user, created = User.objects.get_or_create(
                email=f'user{i}@demo.com',
                defaults={
                    'username': f'user{i}',
                    'first_name': f'Demo{i}',
                    'last_name': 'User',
                    'role': random.choice(roles),
                    'business_unit': random.choice(['JIS', 'JCS', 'all']),
                    'is_active': True,
                    'is_staff': i == 1,  # First user is staff
                }
            )
            if created:
                user.set_password('Demo@123')
                user.save()
            users.append(user)
        
        self.stdout.write(f'Created {len(users)} users')
        
        # Create customers
        customers = []
        customer_names = [
            'TechCorp Solutions',
            'Global Manufacturing Inc',
            'HealthCare Systems',
            'Financial Services Ltd',
            'Retail Giant Corp',
            'Education Network',
            'Government Agency',
            'Startup Innovators',
            'Energy Solutions',
            'Transport Logistics'
        ]
        
        for name in customer_names:
            customer, created = Customer.objects.get_or_create(
                name=name,
                defaults={
                    'email': f'contact@{name.lower().replace(" ", "")}.com',
                    'customer_type': random.choice(['corporate', 'government', 'sme']),
                    'industry': random.choice(['Technology', 'Manufacturing', 'Healthcare', 'Finance', 'Retail']),
                    'relationship_score': random.randint(30, 90),
                    'annual_revenue': random.randint(1000000, 100000000),
                }
            )
            customers.append(customer)
        
        self.stdout.write(f'Created {len(customers)} customers')
        
        # Create bid categories
        categories = []
        category_names = [
            ('IT Services', 'ITS'),
            ('Consulting', 'CON'),
            ('Infrastructure', 'INF'),
            ('Software Development', 'SFT'),
            ('Maintenance', 'MNT'),
        ]
        
        for name, code in category_names:
            category, created = BidCategory.objects.get_or_create(
                name=name,
                defaults={'code_prefix': code}
            )
            categories.append(category)
        
        # Create bids
        statuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'won', 'lost']
        priorities = ['critical', 'high', 'medium', 'low']
        complexities = ['simple', 'moderate', 'complex', 'highly_complex']
        
        for i in range(1, 51):
            due_date = timezone.now().date() + timedelta(days=random.randint(-30, 60))
            
            bid = Bid.objects.create(
                code=f'BID-2024-{i:04d}',
                title=f'Demo Bid {i}: {random.choice(["Implementation", "Consulting", "Support", "Development"])} Services',
                description=f'This is a demo bid #{i} for testing purposes. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                category=random.choice(categories),
                br_request_date=due_date - timedelta(days=random.randint(10, 30)),
                br_date=due_date - timedelta(days=random.randint(5, 15)),
                bid_due_date=due_date,
                business_unit=random.choice(['JIS', 'JCS']),
                bid_level=random.choice(['A', 'B', 'C', 'D']),
                bid_value=random.randint(10000, 1000000),
                estimated_cost=random.randint(8000, 800000),
                profit_margin=random.randint(10, 40),
                customer=random.choice(customers),
                region=random.choice(['North', 'South', 'East', 'West']),
                requested_by=random.choice(users),
                assigned_to=random.choice(users),
                status=random.choice(statuses),
                priority=random.choice(priorities),
                complexity=random.choice(complexities),
                is_urgent=random.choice([True, False]),
                win_probability=random.randint(0, 100),
                risk_score=random.randint(0, 100),
                created_by=random.choice(users),
            )
            
            # Add team members
            team_members = random.sample(users, random.randint(1, 3))
            bid.team_members.set(team_members)
            
            if i % 10 == 0:
                self.stdout.write(f'Created {i} bids...')
        
        self.stdout.write(self.style.SUCCESS('Demo data created successfully!'))
        self.stdout.write(f'Total bids created: {Bid.objects.count()}')