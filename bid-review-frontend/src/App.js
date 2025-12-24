import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Bids from './components/Bids';
import Customers from './components/Customers';

// Dashboard Component
const Dashboard = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Welcome to Your Dashboard
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Manage your bids and reviews from one place
        </p>
      </div>
      
      <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Quick Stats */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h3 className="text-lg font-medium text-indigo-800">Active Bids</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-900">12</p>
              <p className="mt-1 text-sm text-indigo-600">+2 from last week</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-lg font-medium text-green-800">Reviews Pending</h3>
              <p className="mt-2 text-3xl font-bold text-green-900">5</p>
              <p className="mt-1 text-sm text-green-600">+1 new today</p>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600">✓</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Bid #1234 submitted successfully</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600">!</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">New review received for Bid #1201</p>
                    <p className="text-sm text-gray-500">1 day ago</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Bid
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View All Bids
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Profile = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
    <p className="text-gray-600">This is your profile page.</p>
  </div>
);

const Settings = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
    <p className="text-gray-600">Application settings will appear here.</p>
  </div>
);

function App() {
  return (
    <WebSocketProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bids"
              element={
                <ProtectedRoute>
                  <Bids />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect any unknown paths to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </WebSocketProvider>
  );
}

export default App;
