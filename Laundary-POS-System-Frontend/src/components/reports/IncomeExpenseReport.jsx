import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getIncomeExpenseReport, exportIncomeExpenseToExcel } from '../../services/reportService';
import { formatOrderAmount, getPaymentMethodLabel } from '../../services/orderService';
import {
  getExpenseCategoryLabel,
  getExpenseCategoryColor,
  getExpensePaymentMethodLabel,
} from '../../services/expenseService';
import { formatDateTime } from '../../utils/helpers';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const COLORS = ['#6366F1', '#F59E0B', '#EC4899', '#3B82F6', '#F97316', '#14B8A6', '#8B5CF6', '#6B7280'];

const toDateInput = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const PRESETS = [
  { id: 'this_month', label: 'This month', range: () => { const n = new Date(); return [new Date(n.getFullYear(), n.getMonth(), 1), n]; } },
  { id: 'last_month', label: 'Last month', range: () => { const n = new Date(); return [new Date(n.getFullYear(), n.getMonth() - 1, 1), new Date(n.getFullYear(), n.getMonth(), 0)]; } },
  { id: 'last_30', label: 'Last 30 days', range: () => { const n = new Date(); const s = new Date(n); s.setDate(n.getDate() - 29); return [s, n]; } },
  { id: 'this_year', label: 'This year', range: () => { const n = new Date(); return [new Date(n.getFullYear(), 0, 1), n]; } },
];

const emptyReport = {
  summary: { totalIncome: 0, totalExpenses: 0, net: 0, margin: 0, paymentCount: 0, expenseCount: 0 },
  periods: [],
  incomeByMethod: [],
  expensesByCategory: [],
  ledger: [],
};

/**
 * Income (payments received) vs expenses (salaries + running costs).
 */
const IncomeExpenseReport = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState(emptyReport);
  const [ledgerFilter, setLedgerFilter] = useState('all');
  const [filters, setFilters] = useState(() => {
    const [start, end] = PRESETS[0].range();
    return { startDate: toDateInput(start), endDate: toDateInput(end), groupBy: 'day' };
  });

  const buildParams = () => {
    const params = { groupBy: filters.groupBy, tz: new Date().getTimezoneOffset() };
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  };

  const fetchReport = async (override) => {
    try {
      setLoading(true);
      const params = override || buildParams();
      const response = await getIncomeExpenseReport(params);
      setReport({ ...emptyReport, ...response });
    } catch (error) {
      toast.error(error?.message || 'Failed to fetch income & expense report');
      console.error('Error fetching income & expense report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (preset) => {
    const [start, end] = preset.range();
    const next = { ...filters, startDate: toDateInput(start), endDate: toDateInput(end) };
    setFilters(next);
    fetchReport({ groupBy: next.groupBy, startDate: next.startDate, endDate: next.endDate });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportIncomeExpenseToExcel(buildParams());
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const { summary, periods, expensesByCategory, incomeByMethod, ledger } = report;
  const dateError = filters.startDate && filters.endDate && filters.endDate < filters.startDate;

  const categoryChart = expensesByCategory.map((c) => ({ name: getExpenseCategoryLabel(c.category), value: c.amount }));
  const filteredLedger = useMemo(
    () => (ledgerFilter === 'all' ? ledger : ledger.filter((l) => l.type === ledgerFilter)),
    [ledger, ledgerFilter]
  );

  const netPositive = summary.net >= 0;

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="bg-gradient-to-br from-indigo-50 to-sky-50 rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center shadow">
              <span className="text-white text-xl">⚖️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Income & Expenses</h2>
              <p className="text-sm text-gray-600">Payments received vs money spent, and what's left</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
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
                min={filters.startDate || undefined}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border-0 px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 rounded"
              />
            </div>

            <select
              value={filters.groupBy}
              onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="day">📅 Daily</option>
              <option value="week">📊 Weekly</option>
              <option value="month">📈 Monthly</option>
            </select>

            <button
              onClick={() => fetchReport()}
              disabled={loading || dateError}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              style={{ backgroundColor: '#fe7f2d' }}
            >
              {loading ? 'Loading...' : '🔄 Apply'}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || loading || (periods.length === 0 && ledger.length === 0)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              {p.label}
            </button>
          ))}
          {dateError && <span className="text-xs font-semibold text-red-600 ml-2">End date must be after the start date</span>}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-green-100"><span className="text-2xl">💰</span></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Income</p>
              <p className="text-2xl font-bold text-green-600">{formatOrderAmount(summary.totalIncome)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.paymentCount} payment{summary.paymentCount === 1 ? '' : 's'} received</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-red-100"><span className="text-2xl">💸</span></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatOrderAmount(summary.totalExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.expenseCount} entr{summary.expenseCount === 1 ? 'y' : 'ies'}</p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl shadow-md border p-6 ${netPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center space-x-4">
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${netPositive ? 'bg-emerald-200' : 'bg-red-200'}`}><span className="text-2xl">{netPositive ? '📈' : '📉'}</span></div>
            <div>
              <p className="text-sm font-medium text-gray-600">Net {netPositive ? 'Profit' : 'Loss'}</p>
              <p className={`text-2xl font-bold ${netPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                {summary.net < 0 ? '-' : ''}{formatOrderAmount(Math.abs(summary.net))}
              </p>
              <p className="text-xs text-gray-600 mt-1">Income minus expenses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-indigo-100"><span className="text-2xl">🎯</span></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Margin</p>
              <p className={`text-2xl font-bold ${netPositive ? 'text-indigo-600' : 'text-red-600'}`}>{summary.margin}%</p>
              <p className="text-xs text-gray-500 mt-1">Net as % of income</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12"><LoadingSpinner /></div>
      ) : periods.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No income or expenses recorded for the selected period</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income vs expenses over time */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={periods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value, name) => [formatOrderAmount(value), name]}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="#6366F1" strokeWidth={3} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Expense categories */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Where the money went</h3>
              {categoryChart.length === 0 ? (
                <p className="text-sm text-gray-500 py-12 text-center">No expenses in this period</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryChart} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={2}>
                        {categoryChart.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatOrderAmount(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {expensesByCategory.map((c, index) => (
                      <div key={c.category} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getExpenseCategoryColor(c.category)}`}>
                            {getExpenseCategoryLabel(c.category)}
                          </span>
                        </span>
                        <span className="font-semibold text-gray-900">{formatOrderAmount(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {incomeByMethod.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Income by payment method</p>
                  {incomeByMethod.map((m) => (
                    <div key={m.method} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-700">{getPaymentMethodLabel(m.method)} <span className="text-gray-400">({m.count})</span></span>
                      <span className="font-semibold text-green-700">{formatOrderAmount(m.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Period table */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Breakdown by Period</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {periods.map((p) => (
                    <tr key={p.period} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{p.period}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-green-700 font-medium">{formatOrderAmount(p.income)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-red-700 font-medium">{formatOrderAmount(p.expenses)}</td>
                      <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-bold ${p.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {p.net < 0 ? '-' : ''}{formatOrderAmount(Math.abs(p.net))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-green-700">{formatOrderAmount(summary.totalIncome)}</td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-red-700">{formatOrderAmount(summary.totalExpenses)}</td>
                    <td className={`px-6 py-3 text-sm text-right font-bold ${netPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                      {summary.net < 0 ? '-' : ''}{formatOrderAmount(Math.abs(summary.net))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Ledger */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {[
                  { value: 'all', label: `All (${ledger.length})` },
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expenses' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setLedgerFilter(f.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      ledgerFilter === f.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLedger.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Nothing to show</td></tr>
                  ) : filteredLedger.map((entry, index) => (
                    <tr key={`${entry.type}-${entry.reference}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{formatDateTime(entry.date)}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md ${entry.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {entry.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-600">{entry.reference}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {entry.description}
                        {entry.staffName && entry.description && !entry.description.includes(entry.staffName) && (
                          <span className="text-xs text-gray-500"> · {entry.staffName}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {entry.type === 'income'
                          ? getPaymentMethodLabel(entry.category)
                          : (
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md ${getExpenseCategoryColor(entry.category)}`}>
                              {getExpenseCategoryLabel(entry.category)}
                              {entry.paymentMethod ? ` · ${getExpensePaymentMethodLabel(entry.paymentMethod)}` : ''}
                            </span>
                          )}
                      </td>
                      <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-bold ${entry.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        {entry.type === 'income' ? '+' : '-'}{formatOrderAmount(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ledger.length >= 500 && (
              <p className="px-6 py-3 text-xs text-gray-500 border-t border-gray-100">Showing the latest 500 transactions. Narrow the date range or export to Excel for the full list.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default IncomeExpenseReport;
