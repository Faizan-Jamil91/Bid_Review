// src/app/dashboard/customers/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface CustomerFormData {
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  customer_type: 'government' | 'corporate' | 'sme' | 'individual';
  industry?: string;
  annual_revenue?: number | null;
  credit_rating?: string;
  relationship_score?: number;
  tags?: string[];
}

export default function NewCustomerPage() {
  const { createCustomer } = useCustomers();
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({
    defaultValues: {
      customer_type: 'corporate',
      relationship_score: 50,
      tags: [],
    },
  });
  const router = useRouter();

  const onSubmit = async (formData: CustomerFormData) => {
    try {
      // Prepare the data with proper validation and type conversion
      const customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name.trim(),
        customer_type: formData.customer_type || 'corporate',
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        website: formData.website?.trim() ? formData.website.trim() : undefined,
        industry: formData.industry?.trim() || undefined,
        annual_revenue: formData.annual_revenue ? Number(formData.annual_revenue) : undefined,
        credit_rating: formData.credit_rating?.trim() || undefined,
        relationship_score: formData.relationship_score ? Number(formData.relationship_score) : 50,
        tags: formData.tags && formData.tags.length > 0 ? 
          (Array.isArray(formData.tags) ? formData.tags : String(formData.tags).split(',').map(tag => tag.trim())) : 
          undefined,
        is_active: true,
      };

      // Validate required fields
      if (!customerData.name) {
        throw new Error('Customer name is required');
      }

      if (!['government', 'corporate', 'sme', 'individual'].includes(customerData.customer_type)) {
        throw new Error('Invalid customer type');
      }

      // Submit the data
      await createCustomer.mutateAsync(customerData);
      
      // Show success message and redirect
      toast.success('Customer created successfully');
      router.push('/dashboard/customers');
    } catch (err: any) {
      console.error('Error creating customer:', err);
      
      // Show a more descriptive error message
      const errorMessage = err.message || 'Failed to create customer. Please check the form and try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create New Customer</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Customer name is required' })}
                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                {...register('code')}
                placeholder="e.g., CUST-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                {...register('website')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Classification & Financial Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Classification & Financials</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('customer_type', { required: 'Customer type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="corporate">Corporate</option>
                <option value="government">Government</option>
                <option value="sme">SME</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                {...register('industry')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Revenue</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  {...register('annual_revenue')}
                  className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Rating</label>
              <input
                {...register('credit_rating')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., AAA, AA+, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                {...register('relationship_score')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                {...register('tags')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Comma-separated tags (e.g., vip, strategic, government)"
              />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Address</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Customer
          </button>
        </div>
      </form>
    </div>
  );
}