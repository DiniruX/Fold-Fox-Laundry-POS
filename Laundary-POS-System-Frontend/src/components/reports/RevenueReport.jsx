import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getRevenueReport, exportRevenueToExcel } from '../../services/reportService';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const RevenueReport = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'day',
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.groupBy = filters.groupBy;

      const response = await getRevenueReport(params);
      setData(response.revenueData || []);
    } catch (error) {
      toast.error('Failed to fetch revenue report');
      console.error('Error fetching revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.groupBy = filters.groupBy;

      await exportRevenueToExcel(params);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  const formatPeriod = (item) => {
    if (filters.groupBy === 'day') {
      return `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
    } else if (filters.groupBy === 'week') {
      return `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
    } else {
      return `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    }
  };

  const chartData = data.map((item) => ({
    period: formatPeriod(item),
    revenue: item.totalRevenue,
    orders: item.orderCount,
    avgOrder: item.averageOrderValue,
  }));

  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orderCount, 0);
  const overallAvg = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Filters */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center shadow">
              <span className="text-white text-xl">💰</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue Analytics</h2>
              <p className="text-sm text-gray-600">Track your business income over time</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="border-0 px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 rounded"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border-0 px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 rounded"
              />
            </div>

            {/* Group By */}
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="day">📅 Daily</option>
              <option value="week">📊 Weekly</option>
              <option value="month">📈 Monthly</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={fetchReport}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              style={{ backgroundColor: '#fe7f2d' }}
            >
              {loading ? 'Loading...' : '🔄 Apply'}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || data.length === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-green-100">
              <span className="text-2xl">💰</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">All transactions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-blue-100">
              <span className="text-2xl">📦</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Completed orders</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-purple-100">
              <span className="text-2xl">📊</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-3xl font-bold text-purple-600">${overallAvg.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Per transaction</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No data available for the selected period</p>
        </div>
      ) : (
        <>
          {/* Enhanced Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Line Chart */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <span className="text-white text-sm">📈</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Revenue ($)" dot={{ fill: '#10B981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Bar Chart */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Order Volume</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="orders" fill="#3B82F6" name="Orders" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Data Table */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gray-700 flex items-center justify-center">
                  <span className="text-white text-sm">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Order Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPeriod(item)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.totalRevenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.averageOrderValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueReport;

