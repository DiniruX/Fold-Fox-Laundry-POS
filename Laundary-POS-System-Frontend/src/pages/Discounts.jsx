import React, { useState } from 'react';
import {
  ReceiptPercentIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  PauseCircleIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';
import {
  useDiscounts,
  useDeleteDiscount,
  useToggleDiscountStatus,
  getDiscountCustomerTypeLabel,
  getDiscountStatusLabel,
  getDiscountStatusColor,
  formatDiscountValue,
} from '../services/discountService';
import { formatOrderAmount } from '../services/orderService';
import { formatDate } from '../utils/helpers';
import DiscountFormModal from '../components/discounts/DiscountFormModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
  { value: 'inactive', label: 'Inactive' },
];

const Discounts = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const params = {
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  };
  const { data, isLoading, error } = useDiscounts(params);
  const deleteMutation = useDeleteDiscount();
  const toggleMutation = useToggleDiscountStatus();

  const discounts = data?.discounts || [];
  const stats = data?.stats || {};

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (discount) => {
    setEditing(discount);
    setModalOpen(true);
  };

  const handleDelete = async (discount) => {
    if (window.confirm(`Delete "${discount.name}"? This cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(discount._id);
      } catch (e) {
        // handled by mutation toast
      }
    }
  };

  const describeRules = (d) => {
    const parts = [];
    if (d.type === 'percentage' && d.maxDiscountAmount > 0) parts.push(`max ${formatOrderAmount(d.maxDiscountAmount)}`);
    if (d.minOrderAmount > 0) parts.push(`min order ${formatOrderAmount(d.minOrderAmount)}`);
    return parts.join(' · ');
  };

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
                <ReceiptPercentIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Discounts & Offers</h1>
                <p className="text-white/70 mt-1">
                  Promotions staff can apply while creating orders
                </p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{ backgroundColor: '#fe7f2d' }}
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Discount</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Offers', value: stats.total || 0, hint: 'All time', icon: ReceiptPercentIcon, bg: 'bg-blue-100', fg: 'text-blue-600' },
          { label: 'Active Now', value: stats.active || 0, hint: 'Visible on new orders', icon: CheckCircleIcon, bg: 'bg-green-100', fg: 'text-green-600' },
          { label: 'Scheduled', value: stats.scheduled || 0, hint: 'Starting later', icon: CalendarDaysIcon, bg: 'bg-purple-100', fg: 'text-purple-600' },
          { label: 'Paused / Expired', value: (stats.inactive || 0) + (stats.expired || 0), hint: 'Not applicable', icon: PauseCircleIcon, bg: 'bg-gray-100', fg: 'text-gray-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.fg}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.hint}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                  statusFilter === f.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load discounts</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        ) : discounts.length === 0 ? (
          <div className="text-center py-16">
            <ReceiptPercentIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-semibold text-gray-900">No discounts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {stats.total ? 'Try another filter.' : 'Create your first offer to show it on the order screen.'}
            </p>
            {!stats.total && (
              <Button onClick={openCreate} className="mt-5">
                <PlusIcon className="h-4 w-4" />
                New Discount
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Offer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customers</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Used</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discounts.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{d.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {d.code && (
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{d.code}</span>
                        )}
                        {d.description && (
                          <span className="text-xs text-gray-500 truncate max-w-[220px]">{d.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold" style={{ color: '#fe7f2d' }}>{formatDiscountValue(d)}</div>
                      {describeRules(d) && <div className="text-xs text-gray-500">{describeRules(d)}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getDiscountCustomerTypeLabel(d.customerType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>{formatDate(d.startDate)}</div>
                      <div className="text-xs text-gray-500">{d.endDate ? `to ${formatDate(d.endDate)}` : 'No end date'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${getDiscountStatusColor(d.status)}`}>
                        {getDiscountStatusLabel(d.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {d.usageCount || 0} order{d.usageCount === 1 ? '' : 's'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate({ id: d._id, isActive: !d.isActive })}
                          disabled={toggleMutation.isPending}
                          className={`p-2 rounded-lg transition-colors ${d.isActive ? 'hover:bg-red-50 text-gray-500 hover:text-red-700' : 'hover:bg-green-50 text-gray-500 hover:text-green-700'}`}
                          title={d.isActive ? 'Pause offer' : 'Enable offer'}
                        >
                          <PowerIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
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
        )}
      </div>

      <DiscountFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        discount={editing}
      />
    </div>
  );
};

export default Discounts;
