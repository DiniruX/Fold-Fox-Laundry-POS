import React, { useState } from 'react';
import {
  BanknotesIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  useExpenses,
  useExpenseSummary,
  useDeleteExpense,
  getExpenseCategoryLabel,
  getExpenseCategoryColor,
  getExpenseCategoryIcon,
  getExpensePaymentMethodLabel,
  EXPENSE_CATEGORY_OPTIONS,
} from '../services/expenseService';
import { formatOrderAmount } from '../services/orderService';
import { formatDate } from '../utils/helpers';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const monthBounds = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: fmt(start), endDate: fmt(end) };
};

const PERIOD_PRESETS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

const selectClass = 'px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d]';

const Expenses = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [period, setPeriod] = useState('this_month');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preset, setPreset] = useState(null);

  const range =
    period === 'this_month' ? monthBounds(0)
      : period === 'last_month' ? monthBounds(-1)
        : period === 'custom' ? customRange
          : {};

  const params = {
    page,
    limit: 20,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(category !== 'all' ? { category } : {}),
    ...(range.startDate ? { startDate: range.startDate } : {}),
    ...(range.endDate ? { endDate: range.endDate } : {}),
  };

  const { data, isLoading, error, isFetching } = useExpenses(params);
  const { data: summary } = useExpenseSummary();
  const deleteMutation = useDeleteExpense();

  const expenses = data?.expenses || [];
  const pagination = data?.pagination || {};
  const filteredSummary = data?.summary || { totalAmount: 0, count: 0, byCategory: [] };

  const openCreate = (presetCategory = null) => {
    setEditing(null);
    setPreset(presetCategory);
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setPreset(null);
    setModalOpen(true);
  };

  const handleDelete = async (expense) => {
    if (window.confirm(`Delete expense ${expense.expenseNumber} (${formatOrderAmount(expense.amount)})? This cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(expense._id);
      } catch (e) {
        // handled by mutation toast
      }
    }
  };

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const monthDelta = summary ? summary.thisMonth - summary.lastMonth : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 100%)' }}
      >
        <div className="px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#fe7f2d' }}>
                <BanknotesIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Expenses</h1>
                <p className="text-white/70 mt-1">
                  Staff salaries and day-to-day running costs
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => openCreate('salary')}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <UserGroupIcon className="h-5 w-5" />
                <span>Pay Salary</span>
              </button>
              <button
                onClick={() => openCreate()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Record Expense</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-orange-100">
              <BanknotesIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{formatOrderAmount(summary?.thisMonth || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary?.thisMonthCount || 0} entries</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-indigo-100">
              <UserGroupIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Salaries</p>
              <p className="text-2xl font-bold text-gray-900">{formatOrderAmount(summary?.thisMonthSalaries || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Paid this month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-100">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatOrderAmount(summary?.today || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary?.todayCount || 0} entries</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${monthDelta > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              {monthDelta > 0
                ? <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />
                : <ArrowTrendingDownIcon className="h-6 w-6 text-green-600" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">vs Last Month</p>
              <p className={`text-2xl font-bold ${monthDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monthDelta > 0 ? '+' : monthDelta < 0 ? '-' : ''}{formatOrderAmount(Math.abs(monthDelta))}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last month {formatOrderAmount(summary?.lastMonth || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search description, staff, reference or number..."
                value={search}
                onChange={(e) => changeFilter(setSearch)(e.target.value)}
              />
            </div>
            <select value={category} onChange={(e) => changeFilter(setCategory)(e.target.value)} className={selectClass}>
              <option value="all">All categories</option>
              {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex items-center bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => changeFilter(setPeriod)(p.value)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                    period === p.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {period === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <Input
                label="From"
                type="date"
                value={customRange.startDate}
                onChange={(e) => changeFilter((v) => setCustomRange((r) => ({ ...r, startDate: v })))(e.target.value)}
              />
              <Input
                label="To"
                type="date"
                value={customRange.endDate}
                onChange={(e) => changeFilter((v) => setCustomRange((r) => ({ ...r, endDate: v })))(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-gray-700">
              {filteredSummary.count} entr{filteredSummary.count === 1 ? 'y' : 'ies'} · {formatOrderAmount(filteredSummary.totalAmount)}
            </span>
            {filteredSummary.byCategory.slice(0, 4).map((c) => (
              <span key={c.category} className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${getExpenseCategoryColor(c.category)}`}>
                {getExpenseCategoryLabel(c.category)} {formatOrderAmount(c.amount)}
              </span>
            ))}
            {isFetching && !isLoading && <LoadingSpinner size="sm" className="ml-2" />}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load expenses</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16">
            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-semibold text-gray-900">No expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">Nothing recorded for this period and filter.</p>
            <Button onClick={() => openCreate()} className="mt-5">
              <PlusIcon className="h-4 w-4" />
              Record Expense
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expense</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid By</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>{formatDate(exp.date)}</div>
                        <div className="text-xs text-gray-400 font-mono">{exp.expenseNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{exp.description}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-2">
                          {exp.category === 'salary' && exp.staffName && <span>👤 {exp.staffName}</span>}
                          {exp.salaryPeriod && <span>Period {exp.salaryPeriod}</span>}
                          {exp.reference && <span>Ref {exp.reference}</span>}
                          {exp.recordedBy?.name && <span>by {exp.recordedBy.name}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ${getExpenseCategoryColor(exp.category)}`}>
                          <span>{getExpenseCategoryIcon(exp.category)}</span>
                          {getExpenseCategoryLabel(exp.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getExpensePaymentMethodLabel(exp.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-red-600">-{formatOrderAmount(exp.amount)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => openEdit(exp)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp)}
                            disabled={deleteMutation.isPending}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 text-sm text-gray-600">
                <span>
                  Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalExpenses} total
                </span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeftIcon className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ExpenseFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        expense={editing}
        preset={preset}
      />
    </div>
  );
};

export default Expenses;
