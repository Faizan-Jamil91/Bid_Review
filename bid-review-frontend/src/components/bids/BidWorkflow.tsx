import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  XCircleIcon,
  TrophyIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

// Alias for backward compatibility
const BanIcon = NoSymbolIcon;

type StatusType = 'draft' | 'submitted' | 'under_review' | 'technical_review' | 'commercial_review' | 'approved' | 'rejected' | 'won' | 'lost' | 'cancelled';

type WorkflowStep = {
  id: StatusType;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  canTransitionTo: StatusType[];
  requiredFields?: string[];
  canEdit: boolean;
};

const workflowSteps: WorkflowStep[] = [
  {
    id: 'draft',
    name: 'Draft',
    description: 'Bid is being prepared',
    icon: DocumentTextIcon,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    canTransitionTo: ['submitted', 'cancelled'],
    requiredFields: ['title', 'customer', 'bid_value'],
    canEdit: true,
  },
  {
    id: 'submitted',
    name: 'Submitted',
    description: 'Bid has been submitted',
    icon: CheckCircleIcon,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    canTransitionTo: ['under_review', 'technical_review', 'cancelled'],
    canEdit: false,
  },
  {
    id: 'under_review',
    name: 'Under Review',
    description: 'Bid is under initial review',
    icon: ClipboardDocumentCheckIcon,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    canTransitionTo: ['technical_review', 'commercial_review', 'rejected'],
    canEdit: false,
  },
  {
    id: 'technical_review',
    name: 'Technical Review',
    description: 'Technical aspects are being reviewed',
    icon: ClipboardDocumentCheckIcon,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    canTransitionTo: ['commercial_review', 'approved', 'rejected'],
    canEdit: false,
  },
  {
    id: 'commercial_review',
    name: 'Commercial Review',
    description: 'Financial aspects are being reviewed',
    icon: ChartBarIcon,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    canTransitionTo: ['approved', 'rejected'],
    canEdit: false,
  },
  {
    id: 'approved',
    name: 'Approved',
    description: 'Bid has been approved',
    icon: CheckBadgeIcon,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    canTransitionTo: ['won', 'lost'],
    canEdit: false,
  },
  {
    id: 'rejected',
    name: 'Rejected',
    description: 'Bid has been rejected',
    icon: XCircleIcon,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    canTransitionTo: ['draft', 'cancelled'],
    canEdit: false,
  },
  {
    id: 'won',
    name: 'Won',
    description: 'Bid was successful',
    icon: TrophyIcon,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    canTransitionTo: [],
    canEdit: false,
  },
  {
    id: 'lost',
    name: 'Lost',
    description: 'Bid was not successful',
    icon: BanIcon,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    canTransitionTo: [],
    canEdit: false,
  },
  {
    id: 'cancelled',
    name: 'Cancelled',
    description: 'Bid has been cancelled',
    icon: XCircleIcon,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    canTransitionTo: ['draft'],
    canEdit: false,
  },
];

interface BidWorkflowProps {
  currentStatus: StatusType;
  bidId: string;
  onStatusChange: (newStatus: StatusType) => Promise<void>;
  canEdit: boolean;
  lastUpdated?: string;
  updatedBy?: string;
}

export default function BidWorkflow({
  currentStatus,
  bidId,
  onStatusChange,
  canEdit,
  lastUpdated,
  updatedBy,
}: BidWorkflowProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showConfirmation, setShowConfirmation] = useState<StatusType | null>(null);
  const [notes, setNotes] = useState('');
  const router = useRouter();

  const currentStep = workflowSteps.find(step => step.id === currentStatus);
  const nextSteps = workflowSteps.filter(step => 
    currentStep?.canTransitionTo.includes(step.id)
  );

  const handleStatusChange = async (newStatus: StatusType) => {
    if (!canEdit) {
      toast.error('You do not have permission to update this bid status');
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, [newStatus]: true }));
      await onStatusChange(newStatus);
      toast.success(`Bid status updated to ${getStatusName(newStatus)}`);
      setShowConfirmation(null);
      setNotes('');
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update bid status');
    } finally {
      setIsLoading(prev => ({ ...prev, [newStatus]: false }));
    }
  };

  const getStatusName = (status: StatusType) => {
    return workflowSteps.find(step => step.id === status)?.name || status;
  };

  const getStatusIndex = (status: StatusType) => {
    return workflowSteps.findIndex(step => step.id === status);
  };

  const isActive = (status: StatusType) => {
    return getStatusIndex(currentStatus) >= getStatusIndex(status);
  };

  const getStatusIcon = (status: StatusType) => {
    const step = workflowSteps.find(s => s.id === status);
    if (!step) return null;
    
    const Icon = step.icon;
    return (
      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isActive(status) ? step.bgColor : 'bg-gray-100'} ${isActive(status) ? step.color : 'text-gray-400'}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Bid Workflow</h3>
        <p className="mt-1 text-sm text-gray-500">
          Current status: <span className="font-medium">{currentStep?.name}</span>
          {lastUpdated && (
            <span className="text-gray-400 ml-2">
              (Last updated: {new Date(lastUpdated).toLocaleString()}{updatedBy ? ` by ${updatedBy}` : ''})
            </span>
          )}
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {/* Workflow Visualization */}
        <div className="flow-root">
          <ul className="-mb-8">
            {workflowSteps.map((step, stepIdx) => {
              const isCurrent = step.id === currentStatus;
              const isCompleted = getStatusIndex(step.id) < getStatusIndex(currentStatus);
              const isUpcoming = getStatusIndex(step.id) > getStatusIndex(currentStatus);
              
              return (
                <li key={step.id} className="relative pb-8">
                  {stepIdx !== workflowSteps.length - 1 ? (
                    <div className="-ml-px absolute mt-0.5 top-10 left-4 w-0.5 h-full bg-gray-200" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        isCurrent ? 'bg-blue-600 text-white' : 
                        isCompleted ? 'bg-green-500 text-white' : 
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {isCurrent ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>
                          {step.name}
                          {isCurrent && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Current
                          </span>}
                        </p>
                        <p className="text-sm text-gray-500">{step.description}</p>
                        {isCurrent && nextSteps.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {showConfirmation === step.id ? (
                              <div className="mt-2 space-y-2">
                                <div className="mt-1">
                                  <textarea
                                    rows={3}
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                                    placeholder="Add notes (optional)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmation(null)}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(showConfirmation)}
                                    disabled={isLoading[showConfirmation]}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                  >
                                    {isLoading[showConfirmation] ? 'Updating...' : 'Confirm'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {nextSteps.map((nextStep) => (
                                  <button
                                    key={nextStep.id}
                                    type="button"
                                    onClick={() => setShowConfirmation(nextStep.id as StatusType)}
                                    className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Mark as {nextStep.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {isCompleted && lastUpdated && (
                          <time dateTime={lastUpdated}>
                            {new Date(lastUpdated).toLocaleDateString()}
                          </time>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
