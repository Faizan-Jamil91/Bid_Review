from django.core.management.base import BaseCommand
from django.utils import timezone
from bids.signals import check_bids_due_soon

class Command(BaseCommand):
    help = 'Check for bids due soon and send notifications'

    def handle(self, *args, **options):
        self.stdout.write('Checking for bids due soon...')
        
        try:
            check_bids_due_soon()
            self.stdout.write(
                self.style.SUCCESS('Successfully checked for due notifications')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error checking notifications: {e}')
            )
