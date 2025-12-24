'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShareIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { BuildingOffice2Icon as BuildingOfficeIcon } from '@heroicons/react/24/outline';
import BidWorkflow from '@/components/bids/BidWorkflow';
import BidAnalysis from '@/components/bids/BidAnalysis';
import BidDocuments from '@/components/bids/BidDocuments';
const DocumentDownloadIcon = ArrowDownTrayIcon;

type StatusType = 'draft' | 'submitted' | 'under_review' | 'technical_review' | 'commercial_review' | 'approved' | 'rejected' | 'won' | 'lost' | 'cancelled';

const statusConfig: Record<StatusType, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: DocumentTextIcon },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: ClipboardDocumentCheckIcon },
  technical_review: { label: 'Technical Review', color: 'bg-purple-100 text-purple-800', icon: ClipboardDocumentCheckIcon },
  commercial_review: { label: 'Commercial Review', color: 'bg-indigo-100 text-indigo-800', icon: ChartBarIcon },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
  won: { label: 'Won', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
  cancelled: { label: 'Cancelled', color: 'bg-gray-200 text-gray-800', icon: ExclamationTriangleIcon },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'High', color: 'bg-yellow-100 text-yellow-800' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};

export default function BidDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [bid, setBid] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflow'); // Default to workflow tab

  const fetchBid = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getBidById(id);
      setBid(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bid');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBid();
  }, [id]);

  const handleStatusChange = async (newStatus: StatusType) => {
    if (!bid) return;
    
    try {
      await api.updateBid(id, { 
        status: newStatus,
        // Add any additional fields needed for the status update
        updated_at: new Date().toISOString()
      });
      toast.success(`Bid status updated to ${statusConfig[newStatus].label}`);
      fetchBid(); // Refresh bid data
    } catch (err) {
      console.error(err);
      toast.error('Failed to update bid status');
      throw err; // Re-throw to allow the workflow component to handle the error
    }
  };

  // Check if the current user can edit the bid
  const canEditBid = true; // Replace with actual permission check

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this bid? This action cannot be undone.')) {
      try {
        await api.deleteBid(id);
        toast.success('Bid deleted successfully');
        router.push('/dashboard/bids');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete bid');
      }
    }
  };

  const handlePredict = async () => {
    try {
      await api.predictBid(id);
      toast.success('Prediction complete');
      fetchBid(); // Refresh bid data to show prediction results
    } catch (err) {
      console.error(err);
      toast.error('Prediction failed');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: bid?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!bid) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">Bid not found</h2>
        <p className="mt-2 text-gray-500">The bid you're looking for doesn't exist or has been deleted.</p>
        <Link href="/dashboard/bids" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Bids
        </Link>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: StatusType }) => {
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: DocumentTextIcon };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const PriorityBadge = ({ priority }: { priority: keyof typeof priorityConfig }) => {
    const config = priorityConfig[priority] || { label: priority, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {priority === 'high' || priority === 'critical' ? (
          <ArrowUpIcon className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDownIcon className="h-3 w-3 mr-1" />
        )}
        {config.label}
      </span>
    );
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        {/* Bid Details Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Bid Details</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Title</dt>
                <dd className="mt-1 text-sm text-gray-900">{bid.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Bid Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{bid.code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={typeof bid.status === 'string' ? bid.status : 'draft'} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1">
                  <PriorityBadge priority={bid.priority} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Business Unit</dt>
                <dd className="mt-1 text-sm text-gray-900">{bid.business_unit}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Bid Level</dt>
                <dd className="mt-1 text-sm text-gray-900">{bid.bid_level} Level</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Complexity</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{bid.complexity?.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Urgent</dt>
                <dd className="mt-1 text-sm text-gray-900">{bid.is_urgent ? 'Yes' : 'No'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{bid.description || 'No description provided'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Financials Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Financial Information</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Bid Value</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatCurrency(bid.bid_value)}
                </dd>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Estimated Cost</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatCurrency(bid.estimated_cost || 0)}
                </dd>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Profit Margin</dt>
                <dd className={`mt-1 text-2xl font-semibold ${
                  (Number(bid.profit_margin) || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {bid.profit_margin && typeof bid.profit_margin === 'number' ? `${bid.profit_margin.toFixed(2)}%` : bid.profit_margin && !isNaN(Number(bid.profit_margin)) ? `${Number(bid.profit_margin).toFixed(2)}%` : 'N/A'}
                </dd>
              </div>
            </dl>
            {bid.requirements && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500">Special Requirements</h4>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {typeof bid.requirements === 'string' 
                    ? bid.requirements 
                    : typeof bid.requirements === 'object' && bid.requirements !== null
                    ? JSON.stringify(bid.requirements, null, 2)
                    : String(bid.requirements || 'N/A')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dates Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Timeline</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">BR Request Date</p>
                  <p className="text-sm text-gray-900">
                    {bid.br_request_date ? format(new Date(bid.br_request_date), 'PP') : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">BR Date</p>
                  <p className="text-sm text-gray-900">
                    {bid.br_date ? format(new Date(bid.br_date), 'PP') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bid Due Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {bid.bid_due_date ? format(new Date(bid.bid_due_date), 'PP') : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">Days Remaining</p>
                    <p className={`text-sm font-medium ${
                      new Date(bid.bid_due_date) < new Date() 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {bid.bid_due_date 
                        ? Math.ceil((new Date(bid.bid_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Customer Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Customer</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">{bid.customer_detail?.name}</h4>
                {bid.customer_detail?.code && (
                  <p className="text-sm text-gray-500">Code: {bid.customer_detail.code}</p>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500">Region</p>
                <p className="text-sm text-gray-900">{bid.region || 'N/A'}</p>
              </div>
              {bid.country && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Country</p>
                  <p className="text-sm text-gray-900">{bid.country}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Actions</h3>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={() => router.push(`/dashboard/bids/${id}/edit`)}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Bid
            </button>
            
            <button
              onClick={handlePredict}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Run Prediction
            </button>
            
            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <DocumentDownloadIcon className="h-4 w-4 mr-2" />
              Export as PDF
            </button>
            
            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </button>
            
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Bid
            </button>
          </div>
        </div>

        {/* Workflow Component */}
        <BidWorkflow 
          currentStatus={typeof bid.status === 'string' ? bid.status : 'draft'} 
          bidId={id} 
          onStatusChange={handleStatusChange}
          canEdit={canEditBid}
          lastUpdated={bid.updated_at}
          updatedBy={bid.updated_by}
        />
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <BidDocuments bidId={id} />
  );

  const renderHistoryTab = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Activity History</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            <li>
              <div className="relative pb-8">
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                      <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Bid created by <span className="font-medium text-gray-900">You</span>
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={bid.created_at}>
                        {format(new Date(bid.created_at), 'MMM d, yyyy h:mm a')}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <div>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Dashboard
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Link href="/dashboard/bids" className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Bids
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-2 text-sm font-medium text-gray-500">{bid.code || bid.id}</span>
                </div>
              </li>
            </ol>
          </nav>
          <div className="mt-2 flex items-center">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {bid.title}
            </h2>
            <div className="ml-4">
              <StatusBadge status={typeof bid.status === 'string' ? bid.status : 'draft'} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            View Report
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/bids/${id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="-ml-1 mr-2 h-5 w-5" />
            Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`${activeTab === 'workflow' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Workflow
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`${activeTab === 'analysis' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            AI Analysis
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`${activeTab === 'documents' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${activeTab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <BidWorkflow 
              currentStatus={typeof bid.status === 'string' ? bid.status : 'draft'} 
              bidId={id} 
              onStatusChange={handleStatusChange}
              canEdit={canEditBid}
              lastUpdated={bid.updated_at}
              updatedBy={bid.updated_by}
            />
          </div>
        )}
        {activeTab === 'analysis' && (
          <BidAnalysis 
            bid={bid} 
            onAnalysisComplete={(updatedBid) => setBid(updatedBid)}
          />
        )}
        {activeTab === 'documents' && renderDocumentsTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
}
