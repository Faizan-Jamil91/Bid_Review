"use client";

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const defaultStats = [
  { name: 'Total Bids', stat: '—', previousStat: '—', change: null, changeType: null },
  { name: 'Win Rate', stat: '—', previousStat: '—', change: null, changeType: null },
  { name: 'Total Value', stat: '—', previousStat: '—', change: null, changeType: null },
  { name: 'Avg. Time to Win', stat: '—', previousStat: '—', change: null, changeType: null },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

const lineChartData = {
  labels: months,
  datasets: [
    {
      label: 'Bids Submitted',
      data: [12, 19, 3, 5, 2, 3, 8],
      borderColor: 'rgb(79, 70, 229)',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.3,
      fill: true,
    },
    {
      label: 'Bids Won',
      data: [8, 15, 5, 8, 3, 5, 10],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.3,
      fill: true,
    },
  ],
};

const barChartData = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    {
      label: 'Bid Value ($)',
      data: [400000, 300000, 200000, 300000],
      backgroundColor: 'rgba(79, 70, 229, 0.7)',
    },
  ],
};

const pieChartData = {
  labels: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Other'],
  datasets: [
    {
      data: [35, 25, 20, 15, 5],
      backgroundColor: [
        'rgba(79, 70, 229, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(156, 163, 175, 0.8)',
      ],
      borderWidth: 1,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  maintainAspectRatio: false,
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState(defaultStats);
  const [charts, setCharts] = useState({ line: lineChartData, bar: barChartData, pie: pieChartData });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getBidAnalytics();
        console.log('Analytics data from backend:', data);
        
        if (!mounted) return;

        // Update stats with real data
        setStats([
          { name: 'Total Bids', stat: data.overview?.total_bids || 0, previousStat: '-', change: null, changeType: null },
          { name: 'Win Rate', stat: `${Math.round(data.overview?.win_rate || 0)}%`, previousStat: '-', change: null, changeType: null },
          { name: 'Total Value', stat: `$${(data.overview?.total_value || 0).toLocaleString()}`, previousStat: '-', change: null, changeType: null },
          { name: 'Avg. Win Probability', stat: `${Math.round(data.overview?.avg_win_probability || 0)}%`, previousStat: '-', change: null, changeType: null },
        ]);

        // Update line chart with time series data
        if (data.time_series) {
          const months = Object.keys(data.time_series);
          const bidsSubmitted = Object.values(data.time_series).map((v: any) => v.submitted || 0);
          const bidsWon = Object.values(data.time_series).map((v: any) => v.won || 0);
          
          setCharts(prev => ({
            ...prev,
            line: {
              ...prev.line,
              labels: months.length ? months : months,
              datasets: [
                { ...prev.line.datasets[0], data: bidsSubmitted },
                { ...prev.line.datasets[1], data: bidsWon }
              ]
            }
          }));
        }

        // Update pie chart with business unit data
        if (data.distributions?.by_business_unit) {
          const businessUnits = Object.keys(data.distributions.by_business_unit);
          const values = Object.values(data.distributions.by_business_unit) as number[];
          
          setCharts(prev => ({
            ...prev,
            pie: {
              ...prev.pie,
              labels: businessUnits.length ? businessUnits : prev.pie.labels,
              datasets: [{
                ...prev.pie.datasets[0],
                data: values.length ? values : prev.pie.datasets[0].data
              }]
            }
          }));
        }

        // Update bar chart with priority distribution
        if (data.distributions?.by_priority) {
          const priorities = Object.keys(data.distributions.by_priority);
          const values = Object.values(data.distributions.by_priority) as number[];
          
          setCharts(prev => ({
            ...prev,
            bar: {
              ...prev.bar,
              labels: priorities.length ? priorities : prev.bar.labels,
              datasets: [{
                label: 'Bids by Priority',
                data: values.length ? values : prev.bar.datasets[0].data,
                backgroundColor: 'rgba(79, 70, 229, 0.7)',
              }]
            }
          }));
        }

      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Track and analyze your bid performance and win rates.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
            <dt>
              <p className="text-sm font-medium text-gray-500 truncate">{item.name}</p>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                {item.change && (
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">{item.changeType === 'increase' ? <ArrowUpIcon className="self-center h-4 w-4 text-green-500" /> : <ArrowDownIcon className="self-center h-4 w-4 text-red-500" />}{item.change}</p>
                )}
              </div>
            </dt>
            <dd className="mt-2 text-sm text-gray-500"><span>vs {item.previousStat} previous period</span></dd>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bids Overview</h3>
          <div className="h-80"><Line data={charts.line} options={chartOptions} /></div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bids by Business Unit</h3>
          <div className="h-80"><Pie data={charts.pie} options={chartOptions} /></div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bids by Priority</h3>
          <div className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <Bar data={charts.bar} options={chartOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}