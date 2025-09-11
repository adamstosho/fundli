import React, { useState } from 'react';

const APITestComponent = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const testAPI = async () => {
    setIsLoading(true);
    const results = {};
    
    try {
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Token:', token ? 'Found' : 'Not found');
      
      if (!token) {
        results.error = 'No authentication token found';
        setTestResults(results);
        setIsLoading(false);
        return;
      }

      // Test each endpoint
      const endpoints = [
        { name: 'investment-stats', url: 'http://localhost:5000/api/lender/investment-stats' },
        { name: 'funded-loans', url: 'http://localhost:5000/api/lender/funded-loans' },
        { name: 'my-pools', url: 'http://localhost:5000/api/pools/my-pools' },
        { name: 'dashboard-charts', url: 'http://localhost:5000/api/lender/dashboard-charts' }
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🧪 Testing ${endpoint.name}...`);
          const response = await fetch(endpoint.url, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          results[endpoint.name] = {
            status: response.status,
            ok: response.ok,
            data: null
          };
          
          if (response.ok) {
            const data = await response.json();
            results[endpoint.name].data = data;
            console.log(`✅ ${endpoint.name}:`, data);
          } else {
            const errorText = await response.text();
            results[endpoint.name].error = errorText;
            console.log(`❌ ${endpoint.name}:`, errorText);
          }
        } catch (error) {
          results[endpoint.name] = {
            status: 'ERROR',
            ok: false,
            error: error.message
          };
          console.log(`❌ ${endpoint.name} error:`, error);
        }
      }
      
    } catch (error) {
      results.error = error.message;
      console.error('❌ Test error:', error);
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        API Test Results
      </h3>
      
      <button
        onClick={testAPI}
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isLoading ? 'Testing...' : 'Test API Endpoints'}
      </button>
      
      <div className="space-y-4">
        {Object.entries(testResults).map(([key, result]) => (
          <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {key}
            </h4>
            <div className="text-sm">
              <p className={`mb-1 ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
                Status: {result.status} {result.ok ? '✅' : '❌'}
              </p>
              {result.data && (
                <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
              {result.error && (
                <p className="text-red-600 text-xs">{result.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default APITestComponent;

