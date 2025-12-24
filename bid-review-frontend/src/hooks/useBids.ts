// src/hooks/useBids.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AxiosError } from 'axios';

export interface Bid {
  id: string;
  code: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'technical_review' | 'commercial_review' | 'approved' | 'rejected' | 'won' | 'lost' | 'cancelled';
  bid_value: number;
  estimated_cost?: number;
  profit_margin?: number;
  currency: string;
  customer: string;
  customer_detail?: {
    id: string;
    name: string;
    code?: string;
  };
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
  created_at: string;
  updated_at: string;
}

export interface BidFormData extends Omit<Bid, 'id' | 'code' | 'status' | 'created_at' | 'updated_at' | 'customer_detail'> {
  customer: string;
}

export function useBids(params: any = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{ data: Bid[] }, AxiosError>({
    queryKey: ['bids', params],
    queryFn: () => api.getBids(params),
    select: (response: any) => {
      console.log('useBids API response:', response);
      
      // Handle the correct response format based on the API response
      let bidsData = [];
      if (response && response.results && Array.isArray(response.results)) {
        bidsData = response.results;
      } else if (response && Array.isArray(response.data)) {
        bidsData = response.data;
      } else if (Array.isArray(response)) {
        bidsData = response;
      } else {
        console.warn('Unexpected response format:', response);
        bidsData = [];
      }
      
      console.log('useBids extracted bids:', bidsData);
      console.log('useBids number of bids:', bidsData.length);
      
      return { data: bidsData };
    },
  });

  // Extract bids from the response, defaulting to an empty array
  const bids = data?.data || [];

  const createBidMutation = useMutation<Bid, AxiosError, Omit<BidFormData, 'id' | 'code' | 'status' | 'created_at' | 'updated_at'>>({
    mutationFn: (data) => api.createBid(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    },
    onError: (error) => {
      console.error('Error creating bid:', error);
    }
  });

  const updateBidMutation = useMutation<Bid, AxiosError, { id: string; data: Partial<Bid> }>({
    mutationFn: ({ id, data }) => api.updateBid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    }
  });

  const deleteBidMutation = useMutation<void, AxiosError, string>({
    mutationFn: (id) => api.deleteBid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    }
  });

  // Wrapper functions with proper error handling
  const createBid = {
    mutateAsync: async (data: BidFormData) => {
      try {
        return await createBidMutation.mutateAsync(data);
      } catch (error) {
        console.error('Error in createBid:', error);
        throw error;
      }
    },
    isLoading: createBidMutation.isPending,
    error: createBidMutation.error,
  };

  const updateBid = {
    mutateAsync: async (id: string, data: Partial<Bid>) => {
      try {
        return await updateBidMutation.mutateAsync({ id, data });
      } catch (error) {
        console.error('Error in updateBid:', error);
        throw error;
      }
    },
    isLoading: updateBidMutation.isPending,
    error: updateBidMutation.error,
  };

  const deleteBid = {
    mutateAsync: async (id: string) => {
      try {
        await deleteBidMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error in deleteBid:', error);
        throw error;
      }
    },
    isLoading: deleteBidMutation.isPending,
    error: deleteBidMutation.error,
  };

  return {
    bids,
    isLoading,
    error,
    refetch,
    createBid,
    updateBid,
    deleteBid,
  };
}