'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, DocumentTextIcon, ChartBarIcon, UserGroupIcon, ArrowUpIcon, ArrowDownIcon, SparklesIcon } from '@heroicons/react/24/solid';
import AITools from '@/components/ai/AITools';
import MLTraining from '@/components/ml/MLTraining';
import { api } from '@/lib/api/client';

interface DashboardData {
  overview: {
    total_bids: number;
    active_bids: number;
    urgent_bids: number;
    overdue_bids: number;
    total_value: number;
    avg_win_probability: number;
  };
  distributions: {
    status: Record<string, number>;
    priority: Record<string, number>;
  };
  insights: {
    top_customers: Array<{
      customer__name: string;
      total_value: number;
      bid_count: number;
    }>;
    upcoming_deadlines: Array<any>;
  };
}

const quickActions = [
  {
    title: 'Create New Bid',
    description: 'Start a new bid proposal',
    icon: DocumentTextIcon,
    href: '/dashboard/bids/new',
  },
  {
    title: 'View Analytics',
    description: 'Check bid performance metrics',
    icon: ChartBarIcon,
    href: '/dashboard/analytics',
  },
  {
    title: 'Team Members',
    description: 'Manage your team',
    icon: UserGroupIcon,
    href: '/dashboard/team',
  },
  {
    title: 'Customers',
    description: 'Manage customers',
    icon: UserGroupIcon,
    href: '/dashboard/customers',
  },
];

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await api.getDashboardData();
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = dashboardData ? [
    { name: 'Total Bids', value: dashboardData.overview.total_bids.toString(), change: '+0%', changeType: 'positive' as const },
    { name: 'Active Bids', value: dashboardData.overview.active_bids.toString(), change: '+0%', changeType: 'positive' as const },
    { name: 'Urgent Bids', value: dashboardData.overview.urgent_bids.toString(), change: '+0%', changeType: 'positive' as const },
    { name: 'Overdue Bids', value: dashboardData.overview.overdue_bids.toString(), change: dashboardData.overview.overdue_bids > 0 ? '-1' : '+0', changeType: dashboardData.overview.overdue_bids > 0 ? 'negative' as const : 'positive' as const },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Welcome back! Here's what's happening with your bids today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden rounded-2xl border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-3">
                    {stat.value}
                  </p>
                  <div className="flex items-center">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      stat.changeType === 'positive' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {stat.changeType === 'positive' ? (
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                      )}
                      {stat.change}
                    </div>
                    <p className="text-xs text-gray-500 ml-2">vs last month</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DocumentTextIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Customers */}
        <div className="bg-white shadow-lg overflow-hidden rounded-2xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Top Customers
              </h3>
              <Link
                href="/dashboard/customers"
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-150"
              >
                View all
                <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="bg-white overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {dashboardData?.insights.top_customers.map((customer, index) => (
                <li key={index} className="px-6 py-5 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                        {customer.customer__name}
                      </p>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="font-medium text-gray-600">{customer.bid_count} bids</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="font-bold text-blue-600">${customer.total_value.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group bg-white overflow-hidden rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                      {action.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0 self-center text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200">
                    <ArrowRightIcon className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* AI Tools Section */}
      <div className="mt-8">
        <AITools />
      </div>

      {/* ML Training Section */}
      <div className="mt-8">
        <MLTraining />
      </div>
    </div>
  );
}