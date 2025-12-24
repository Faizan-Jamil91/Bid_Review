// src/hooks/useApiQuery.ts
import { useQuery, useMutation, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useApiQuery<TData = any, TError = Error>(
  key: string | any[],
  url: string,
  params?: any,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  const queryKey = Array.isArray(key) ? key : [key, params];

  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      // Use a public method instead of accessing private client
      const response = await fetch(url + (params ? '?' + new URLSearchParams(params).toString() : ''));
      return response.json();
    },
    ...options,
  });
}

export function useApiMutation<TData = any, TVariables = any, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: any
) {
  const { mutate, isPending, error, data } = useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  });

  return {
    mutate,
    isLoading: isPending,
    error,
    data,
  };
}