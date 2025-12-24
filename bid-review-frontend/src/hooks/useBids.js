import { useState, useEffect, useCallback } from 'react';
import { getBids } from '../services/bidService';

export const useBids = (initialParams = {}) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchBids = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getBids(params);
      const bidsData = response.results || response;
      setBids(Array.isArray(bidsData) ? bidsData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching bids:', err);
      setError('Failed to load bids. Please try again later.');
      setBids([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const refetch = useCallback(() => {
    fetchBids();
  }, [fetchBids]);

  return {
    bids,
    loading,
    error,
    params,
    updateParams,
    refetch
  };
};
