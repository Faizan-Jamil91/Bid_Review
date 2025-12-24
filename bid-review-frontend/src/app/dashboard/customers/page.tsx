// src/app/dashboard/customers/page.tsx
'use client';

import { useCustomers } from '@/hooks/useCustomers';
import Link from 'next/link';
import { format } from 'date-fns';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import CustomerFilters from '@/components/customers/CustomerFilters';

export default function CustomersPage() {
  const [filters, setFilters] = useState({
    search: '',
    customer_type: 'all',
    industry: 'all',
    is_active: 'all',
  });
  const { customers, isLoading, error, deleteCustomer } = useCustomers({});

  // Filter customers based on all filter criteria
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    let result = [...customers];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(customer => 
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.code?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.industry?.toLowerCase().includes(searchLower) ||
        customer.customer_type?.toLowerCase().includes(searchLower) ||
        customer.address?.toLowerCase().includes(searchLower)
      );
    }

    // Apply customer type filter
    if (filters.customer_type !== 'all') {
      result = result.filter(customer => customer.customer_type === filters.customer_type);
    }

    // Apply industry filter
    if (filters.industry !== 'all') {
      result = result.filter(customer => customer.industry === filters.industry);
    }

    // Apply status filter
    if (filters.is_active !== 'all') {
      const isActive = filters.is_active === 'true';
      result = result.filter(customer => customer.is_active === isActive);
    }

    return result;
  }, [customers, filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      customer_type: 'all',
      industry: 'all',
      is_active: 'all',
    };
    setFilters(resetFilters);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer.mutateAsync(id);
        toast.success('Customer deleted successfully');
      } catch (err) {
        console.error('Error deleting customer:', err);
        toast.error('Failed to delete customer');
      }
    }
  };

  if (isLoading) {
    return <div>Loading customers...</div>;
  }

  if (error) {
    return <div>Error loading customers: {error.message}</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all customers in the system.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add customer
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <CustomerFilters
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          initialFilters={filters}
        />

        <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Name
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Type
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Industry
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Phone
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Relationship
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-500 mb-4">{filters.search || filters.customer_type !== 'all' || filters.industry !== 'all' || filters.is_active !== 'all' ? 'No customers match your search criteria.' : 'Get started by adding your first customer.'}</p>
                    {!filters.search && filters.customer_type === 'all' && filters.industry === 'all' && filters.is_active === 'all' && (
                      <Link
                        href="/dashboard/customers/new"
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Add Customer
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCustomers?.map((customer) => (
                <tr key={customer.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {customer.name}
                    {customer.code && (
                      <span className="ml-2 text-xs text-gray-500">({customer.code})</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                    {customer.customer_type}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {customer.industry || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {customer.email || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {customer.phone || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${customer.relationship_score}%` }}
                        ></div>
                      </div>
                      <span>{customer.relationship_score}%</span>
                    </div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex space-x-2 justify-end">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
