// src/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AxiosError } from 'axios';

export interface Customer {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  customer_type: 'government' | 'corporate' | 'sme' | 'individual';
  industry?: string;
  annual_revenue?: number;
  credit_rating?: string;
  relationship_score: number;
  is_active: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData extends Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'is_active'> {
  // Additional form-specific fields if needed
}

export function useCustomers(params = {}) {
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ['customers', params];

  const { 
    data: customers = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Customer[], AxiosError>({
    queryKey,
    queryFn: () => api.getCustomers(params),
  });

  const createCustomerMutation = useMutation<Customer, AxiosError, Omit<Customer, 'id' | 'created_at' | 'updated_at'>>({
    mutationFn: (data) => api.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
    }
  });

  const updateCustomerMutation = useMutation<Customer, AxiosError, { id: string; data: Partial<Customer> }>({
    mutationFn: ({ id, data }) => api.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const deleteCustomerMutation = useMutation<void, AxiosError, string>({
    mutationFn: (id) => api.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  // Wrapper functions with proper error handling
  const createCustomer = {
    mutateAsync: async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        return await createCustomerMutation.mutateAsync(data);
      } catch (error) {
        console.error('Error in createCustomer:', error);
        throw error;
      }
    },
    isLoading: createCustomerMutation.isPending,
    error: createCustomerMutation.error,
  };

  const updateCustomer = {
    mutateAsync: async (id: string, data: Partial<Customer>) => {
      try {
        return await updateCustomerMutation.mutateAsync({ id, data });
      } catch (error) {
        console.error('Error in updateCustomer:', error);
        throw error;
      }
    },
    isLoading: updateCustomerMutation.isPending,
    error: updateCustomerMutation.error,
  };

  const deleteCustomer = {
    mutateAsync: async (id: string) => {
      try {
        await deleteCustomerMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error in deleteCustomer:', error);
        throw error;
      }
    },
    isLoading: deleteCustomerMutation.isPending,
    error: deleteCustomerMutation.error,
  };

  return {
    customers,
    isLoading,
    error,
    refetch,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}