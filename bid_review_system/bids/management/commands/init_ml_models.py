from django.core.management.base import BaseCommand
from bids.ml.bid_predictor import BidPredictor
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Initialize and train ML models'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--retrain',
            action='store_true',
            help='Force retraining of models'
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Initializing ML models...')
        
        try:
            # Initialize and train bid predictor
            self.stdout.write('Training bid predictor...')
            predictor = BidPredictor()
            predictor.train_models(retrain=options['retrain'])
            
            self.stdout.write(self.style.SUCCESS('Successfully initialized ML models'))
            
        except Exception as e:
            logger.error(f'Error initializing ML models: {e}')
            self.stdout.write(self.style.ERROR(f'Error: {e}'))