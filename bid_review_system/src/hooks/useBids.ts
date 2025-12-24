// src/hooks/useBids.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { handleApiError } from '@/utils/errorHandler';

export function useBids(params = {}) {
  const queryClient = useQueryClient();

  const {
    data: bids,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['bids', params],
    () => api.getBids(params),
    {
      onError: handleApiError,
    }
  );

  const createBid = useMutation(
    (data: any) => api.createBid(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bids');
      },
      onError: handleApiError,
    }
  );

  const updateBid = useMutation(
    ({ id, data }: { id: string; data: any }) => api.updateBid(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bids');
      },
      onError: handleApiError,
    }
  );

  const deleteBid = useMutation(
    (id: string) => api.deleteBid(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bids');
      },
      onError: handleApiError,
    }
  );

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