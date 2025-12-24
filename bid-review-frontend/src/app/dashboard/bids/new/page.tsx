// src/app/dashboard/bids/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useBids } from '@/hooks/useBids';
import { useCustomers } from '@/hooks/useCustomers';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface BidFormData {
  code: string;
  title: string;
  description: string;
  bid_value: number;
  estimated_cost?: number;
  profit_margin?: number;
  currency: string;
  customer: string;
  bid_due_date: string;
  br_request_date: string;
  br_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex' | 'highly_complex';
  business_unit: 'JIS' | 'JCS';
  bid_level: 'A' | 'B' | 'C' | 'D';
  region: string;
  country?: string;
  requirements?: string;
  comments?: string;
  category?: string;
  is_urgent: boolean;
}

export default function NewBidPage() {
  const { createBid } = useBids();
  const { customers, isLoading: customersLoading } = useCustomers();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BidFormData>({
    defaultValues: {
      code: `BID-${Date.now().toString(36).toUpperCase()}`,
      currency: 'USD',
      priority: 'medium',
      complexity: 'moderate',
      business_unit: 'JIS',
      bid_level: 'C',
      is_urgent: false,
      region: 'Middle East', // Default region
      br_request_date: new Date().toISOString().split('T')[0],
      br_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bid_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const watchBidValue = watch('bid_value');
  const watchEstimatedCost = watch('estimated_cost');

  // Calculate profit margin when bid value or estimated cost changes
  useEffect(() => {
    const bidValue = parseFloat(String(watchBidValue)) || 0;
    const estimatedCost = parseFloat(String(watchEstimatedCost)) || 0;

    if (bidValue > 0 && estimatedCost > 0) {
      const margin = ((bidValue - estimatedCost) / bidValue) * 100;
      setValue('profit_margin', parseFloat(margin.toFixed(2)));
    } else {
      setValue('profit_margin', 0);
    }
  }, [watchBidValue, watchEstimatedCost, setValue]);

  const onSubmit = async (data: BidFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await createBid.mutateAsync({
        ...data,
        // Keep dates in YYYY-MM-DD format
        bid_due_date: data.bid_due_date,
        br_request_date: data.br_request_date,
        br_date: data.br_date,
        // Ensure numeric values are numbers
        bid_value: Number(data.bid_value) || 0,
        estimated_cost: Number(data.estimated_cost) || 0,
        profit_margin: Number(data.profit_margin) || 0,
      });

      toast.success('Bid created successfully');
      router.push('/dashboard/bids');
    } catch (error) {
      console.error('Error creating bid:', error);
      toast.error('Failed to create bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Bid</h1>
        <p className="mt-1 text-sm text-gray-600">Fill in the details below to create a new bid</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bid Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className={`w-full px-3 py-2 border ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } rounded-md`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Unit <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('business_unit', { required: 'Business unit is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="JIS">JIS</option>
                  <option value="JCS">JCS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bid Level <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('bid_level', { required: 'Bid level is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="A">A Level - Strategic</option>
                  <option value="B">B Level - Major</option>
                  <option value="C">C Level - Standard</option>
                  <option value="D">D Level - Minor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                {...register('customer', { required: 'Customer is required' })}
                className={`w-full px-3 py-2 border ${
                  errors.customer ? 'border-red-500' : 'border-gray-300'
                } rounded-md`}
                disabled={customersLoading}
              >
                <option value="">Select a customer</option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.code ? `(${customer.code})` : ''}
                  </option>
                ))}
              </select>
              {customersLoading && <p className="mt-1 text-sm text-gray-500">Loading customers...</p>}
              {errors.customer && <p className="mt-1 text-sm text-red-600">{errors.customer.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                {...register('region', { required: 'Region is required' })}
                className={`w-full px-3 py-2 border ${
                  errors.region ? 'border-red-500' : 'border-gray-300'
                } rounded-md`}
              >
                <option value="Middle East">Middle East</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
                <option value="Asia">Asia</option>
                <option value="Africa">Africa</option>
                <option value="South America">South America</option>
                <option value="Oceania">Oceania</option>
              </select>
              {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Dates</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BR Request Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('br_request_date', { required: 'BR Request Date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BR Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('br_date', { required: 'BR Date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bid Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('bid_due_date', { required: 'Bid Due Date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Financial Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('currency', { required: 'Currency is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                  <option value="PKR">PKR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bid Value <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('bid_value', { required: 'Bid value is required', min: 0 })}
                    className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('estimated_cost')}
                    className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profit Margin (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  readOnly
                  {...register('profit_margin')}
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <div className="space-y-8">
              <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Classification</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('priority', { required: 'Priority is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complexity <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('complexity', { required: 'Complexity is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="simple">Simple</option>
                      <option value="moderate">Moderate</option>
                      <option value="complex">Complex</option>
                      <option value="highly_complex">Highly Complex</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_urgent"
                    {...register('is_urgent')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_urgent" className="ml-2 block text-sm text-gray-700">
                    Mark as Urgent
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Location</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                {...register('country')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 md:col-span-2">
            <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                {...register('requirements')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter detailed requirements here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
              <textarea
                {...register('comments')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Any additional comments..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 flex justify-end space-x-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white ${
              isSubmitting 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 flex items-center`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : 'Create Bid'}
          </button>
        </div>
      </form>
    </div>
  );
}