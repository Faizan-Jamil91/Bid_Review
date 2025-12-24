import React, { useState, useEffect } from 'react';
import { getBids } from '../services/bidService';

const BidTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Basic API call
      console.log('Test 1: Basic API call');
      const response = await getBids();
      results.apiCall = {
        success: true,
        data: response,
        dataType: typeof response,
        isArray: Array.isArray(response),
        keys: response ? Object.keys(response) : null
      };
      console.log('API Call Result:', results.apiCall);

      // Test 2: Check for different response formats
      if (response) {
        if (response.results) {
          results.hasResults = {
            success: true,
            isArray: Array.isArray(response.results),
            length: response.results.length,
            sample: response.results[0]
          };
        }
        if (response.data) {
          results.hasData = {
            success: true,
            isArray: Array.isArray(response.data),
            length: response.data.length,
            sample: response.data[0]
          };
        }
      }

    } catch (error) {
      results.error = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      };
      console.error('Test Error:', results.error);
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-4">API Test Results</h3>
      
      <button 
        onClick={runTests}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Run API Tests'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-semibold mb-2">Test Results:</h4>
            <pre className="text-sm overflow-auto bg-white p-2 rounded">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidTest;
