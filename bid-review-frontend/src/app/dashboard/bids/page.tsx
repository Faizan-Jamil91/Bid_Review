// src/app/dashboard/bids/page.tsx
'use client';

import { useBids, type Bid } from '@/hooks/useBids';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import BidFilters from '@/components/bids/BidFilters';

// Define valid sortable keys from the Bid type
type SortableBidKey = keyof Omit<Bid, 'customer_detail'> | 'customer';

interface SortConfig {
  key: SortableBidKey;
  direction: 'asc' | 'desc';
}

interface FilterState {
  search: string;
  status: string;
  priority: string;
  businessUnit: string;
  bidLevel: string;
  complexity: string;
  startDate: string;
  endDate: string;
  minValue: string;
  maxValue: string;
  isUrgent: string;
  region: string;
}

export default function BidsPage() {
  const router = useRouter();
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    businessUnit: 'all',
    bidLevel: 'all',
    complexity: 'all',
    startDate: '',
    endDate: '',
    minValue: '',
    maxValue: '',
    isUrgent: 'all',
    region: 'all',
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'bid_due_date', 
    direction: 'asc' 
  });

  const { bids, isLoading, error, deleteBid } = useBids({});

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bid?')) {
      try {
        await deleteBid.mutateAsync(id);
        toast.success('Bid deleted successfully');
      } catch (err) {
        console.error('Error deleting bid:', err);
        toast.error('Failed to delete bid');
      }
    }
  };

  const handleSort = (key: SortableBidKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Load filters from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlFilters: Partial<FilterState> = {};
      params.forEach((value, key) => {
        if (key in filters) {
          urlFilters[key as keyof FilterState] = value;
        }
      });
      if (Object.keys(urlFilters).length > 0) {
        setFilters(prev => ({ ...prev, ...urlFilters }));
      }
    }
  }, []);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Update URL with filter parameters
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value.toString());
      }
    });
    const queryString = params.toString();
    router.replace(`/dashboard/bids${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      search: '',
      status: 'all',
      priority: 'all',
      businessUnit: 'all',
      bidLevel: 'all',
      complexity: 'all',
      startDate: '',
      endDate: '',
      minValue: '',
      maxValue: '',
      isUrgent: 'all',
      region: 'all',
    };
    setFilters(resetFilters);
    router.replace('/dashboard/bids', { scroll: false });
  };

  const filteredAndSortedBids = useMemo(() => {
    if (!bids) return [];
    
    let result = [...bids];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(bid => 
        bid.title?.toLowerCase().includes(searchTerm) ||
        bid.code?.toLowerCase().includes(searchTerm) ||
        bid.customer_detail?.name?.toLowerCase().includes(searchTerm) ||
        bid.description?.toLowerCase().includes(searchTerm) ||
        bid.region?.toLowerCase().includes(searchTerm) ||
        bid.country?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply all filters
    if (filters.status !== 'all') {
      result = result.filter(bid => typeof bid.status === 'string' && bid.status === filters.status);
    }
    if (filters.priority !== 'all') {
      result = result.filter(bid => bid.priority === filters.priority);
    }
    if (filters.businessUnit !== 'all') {
      result = result.filter(bid => bid.business_unit === filters.businessUnit);
    }
    if (filters.bidLevel !== 'all') {
      result = result.filter(bid => bid.bid_level === filters.bidLevel);
    }
    if (filters.complexity !== 'all') {
      result = result.filter(bid => bid.complexity === filters.complexity);
    }
    if (filters.region !== 'all') {
      result = result.filter(bid => bid.region === filters.region);
    }
    if (filters.isUrgent !== 'all') {
      const isUrgent = filters.isUrgent === 'true';
      result = result.filter(bid => bid.is_urgent === isUrgent);
    }
    if (filters.startDate) {
      result = result.filter(bid => 
        bid.bid_due_date && new Date(bid.bid_due_date) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      result = result.filter(bid => 
        bid.bid_due_date && new Date(bid.bid_due_date) <= new Date(filters.endDate)
      );
    }
    if (filters.minValue) {
      result = result.filter(bid => bid.bid_value >= Number(filters.minValue));
    }
    if (filters.maxValue) {
      result = result.filter(bid => bid.bid_value <= Number(filters.maxValue));
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: string | number | Date = '';
      let bValue: string | number | Date = '';

      // Handle customer name sorting separately as it's a nested property
      if (sortConfig.key === 'customer') {
        aValue = a.customer_detail?.name || '';
        bValue = b.customer_detail?.name || '';
      } else {
        // Safely access the property using type assertion and provide default empty string
        const key = sortConfig.key as keyof Bid;
        aValue = (a[key] as any) ?? '';
        bValue = (b[key] as any) ?? '';
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [bids, filters, sortConfig]);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'technical_review', label: 'Technical Review' },
    { value: 'commercial_review', label: 'Commercial Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: any }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: ClockIcon },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon },
      under_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon },
      technical_review: { bg: 'bg-purple-100', text: 'text-purple-800', icon: ClockIcon },
      commercial_review: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: ClockIcon },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: ExclamationTriangleIcon },
      won: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      lost: { bg: 'bg-red-100', text: 'text-red-800', icon: ExclamationTriangleIcon },
      cancelled: { bg: 'bg-gray-200', text: 'text-gray-800', icon: ExclamationTriangleIcon },
    };
    return statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: ClockIcon };
  };

  const getPriorityColor = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-800';
  };

  const getDaysRemaining = (dueDate: string) => {
    if (!dueDate) return { text: 'No due date', class: 'text-gray-500' };
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        text: `${Math.abs(diffDays)} days overdue`, 
        class: 'text-red-600 font-medium' 
      };
    } else if (diffDays === 0) {
      return { 
        text: 'Due today', 
        class: 'text-yellow-600 font-medium' 
      };
    } else {
      return { 
        text: `Due in ${diffDays} days`, 
        class: 'text-green-600' 
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading bids
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {error.message || 'Failed to load bids. Please try again later.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Bid Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all bids including their details and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/bids/new"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Bid
          </Link>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="mt-6">
        <BidFilters
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          initialFilters={filters}
        />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Bids</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {bids?.length || 0}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Active Bids</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
            {bids?.filter(b => typeof b.status === 'string' && ['draft', 'submitted', 'under_review', 'technical_review', 'commercial_review'].includes(b.status)).length || 0}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Won Bids</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
            {bids?.filter(b => typeof b.status === 'string' && b.status === 'won').length || 0}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">At Risk</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
            {bids?.filter(b => {
              if (!b.bid_due_date) return false;
              const due = new Date(b.bid_due_date);
              const today = new Date();
              const diffTime = due.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7 && diffDays >= 0;
            }).length || 0}
          </dd>
        </div>
      </div>

      {/* Bids Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center">
                        Title
                        {sortConfig.key === 'title' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('customer')}
                    >
                      <div className="flex items-center">
                        Customer
                        {sortConfig.key === 'customer' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Value
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('bid_due_date')}
                    >
                      <div className="flex items-center">
                        Due Date
                        {sortConfig.key === 'bid_due_date' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Priority
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredAndSortedBids.length > 0 ? (
                    filteredAndSortedBids.map((bid) => {
                      const status = typeof bid.status === 'string' ? getStatusColor(bid.status) : getStatusColor('draft');
                      const daysRemaining = getDaysRemaining(bid.bid_due_date);
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr 
                          key={bid.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/dashboard/bids/${bid.id}`)}
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center">
                                <BuildingOffice2Icon className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{bid.title}</div>
                                <div className="text-gray-500">{bid.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-900">{bid.customer_detail?.name || 'N/A'}</div>
                            <div className="text-gray-500">{bid.region}, {bid.country}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="font-medium text-gray-900">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: bid.currency || 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(bid.bid_value || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {bid.profit_margin}% margin
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className={daysRemaining.class}>
                              {bid.bid_due_date ? format(new Date(bid.bid_due_date), 'MMM d, yyyy') : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {daysRemaining.text}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {typeof bid.status === 'string' ? bid.status.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ') : 'Draft'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(bid.priority)}`}
                            >
                              {bid.priority.charAt(0).toUpperCase() + bid.priority.slice(1)}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                href={`/dashboard/bids/${bid.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                                onClick={(e) => e.stopPropagation()}
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(bid.id);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No bids found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}