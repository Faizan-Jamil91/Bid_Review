'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getBids } from '../services/bidService';
import { useDebounce } from '../hooks/useDebounce';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import BidRow from './BidRow';
import { testApiConnection } from '../utils/apiTest';
import BidTest from './BidTest';
import AIReviewButton from './reviews/AIReviewButton';
import MilestonesList from './milestones/MilestonesList';

const Bids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMilestones, setShowMilestones] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  // Temporarily disable WebSocket to test API
  // const { isConnected, connectionStatus, bids: realtimeBids } = useWebSocketContext();
  const realtimeBids = [];

  const handleMilestonesClick = (bidId) => {
    setSelectedBidId(bidId);
    setShowMilestones(true);
  };

  const handleBackToBids = () => {
    setShowMilestones(false);
    setSelectedBidId('');
  };

  const handleReviewSuccess = (review) => {
    console.log('AI Review created successfully:', review);
    // Refresh bids to show updated review count
    const fetchBids = async () => {
      try {
        setLoading(true);
        const response = await getBids({ search: debouncedSearchTerm });
        let bidsData = [];
        if (response && response.results && Array.isArray(response.results)) {
          bidsData = response.results;
        } else if (Array.isArray(response)) {
          bidsData = response;
        }
        setBids(bidsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching bids:', err);
        setError('Failed to fetch bids');
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  };

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        console.log('Fetching bids with params:', { search: debouncedSearchTerm });
        
        const response = await getBids({ search: debouncedSearchTerm });
        console.log('API response:', response);
        
        // Handle the correct response format based on the API response
        let bidsData = [];
        if (response && response.results && Array.isArray(response.results)) {
          bidsData = response.results;
        } else if (Array.isArray(response)) {
          bidsData = response;
        } else {
          console.warn('Unexpected response format:', response);
          bidsData = [];
        }
        
        console.log('Bids data extracted:', bidsData);
        console.log('Number of bids:', bidsData.length);
        
        setBids(bidsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching bids:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(`Failed to load bids: ${err.message || 'Unknown error'}`);
        setBids([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [debouncedSearchTerm]);

  // Since we disabled WebSocket, just use the fetched bids
  const displayBids = useMemo(() => {
    if (!debouncedSearchTerm) return bids;
    
    return bids.filter(bid => 
      bid.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      bid.customer_detail?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      bid.code?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [bids, debouncedSearchTerm]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const getStatusBadge = useCallback((status) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      won: 'bg-purple-100 text-purple-800',
      lost: 'bg-gray-200 text-gray-600',
    };
    
    const statusText = status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText}
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {showMilestones && (
                <button
                  onClick={handleBackToBids}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Bids
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {showMilestones ? 'Bid Milestones' : 'Bids Management'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showMilestones ? (
          <MilestonesList bidId={selectedBidId} showStats={true} showFilters={true} />
        ) : (
          <>
            {/* Search and Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full sm:w-96">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search bids by code, title, or customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.location.href = '/bids/new'}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Create New Bid
                  </button>
                  <button 
                    onClick={() => window.location.href = '/reviews/new'}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Create Review
                  </button>
                  <AIReviewButton onSuccess={handleReviewSuccess} />
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <i className="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
                <span className="ml-3 text-gray-600">Loading bids...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <i className="fas fa-exclamation-triangle text-red-600 text-2xl mb-3"></i>
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Bids</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Bids Table */}
            {!loading && !error && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business Unit
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayBids.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <i className="fas fa-briefcase text-gray-400 text-4xl mb-4"></i>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No bids found</h3>
                            <p className="text-gray-500 mb-6">
                              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first bid.'}
                            </p>
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => window.location.href = '/bids/new'}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                              >
                                Create New Bid
                              </button>
                              <button 
                                onClick={() => window.location.href = '/reviews/new'}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                              >
                                Create Review
                              </button>
                              <AIReviewButton onSuccess={handleReviewSuccess} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayBids.map((bid) => (
                        <BidRow 
                          key={bid.id} 
                          bid={bid} 
                          getStatusBadge={getStatusBadge} 
                          formatDate={formatDate}
                          onReviewSuccess={handleReviewSuccess}
                          onMilestonesClick={handleMilestonesClick}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(Bids);
