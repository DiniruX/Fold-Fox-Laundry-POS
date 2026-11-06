import React, { useMemo, useState } from 'react';
import {
  ArchiveBoxIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  TagIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';
import {
  useExtraItems,
  useDeleteExtraItem,
  useToggleExtraItemStatus,
  getExtraItemCategoryLabel,
  getExtraItemCategoryColor,
  EXTRA_ITEM_CATEGORY_OPTIONS,
} from '../services/extraItemService';
import { formatOrderAmount } from '../services/orderService';
import ExtraItemFormModal from '../components/extraItems/ExtraItemFormModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const OtherItems = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data, isLoading, error } = useExtraItems({ includeInactive: true });
  const deleteMutation = useDeleteExtraItem();
  const toggleMutation = useToggleExtraItemStatus();

  const items = data?.items || [];
  const stats = data?.stats || {};

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;
      if (q && !item.name.toLowerCase().includes(q) && !(item.description || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const hangerItems = items.filter((i) => i.category === 'hanger' && i.isActive);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(item._id);
      } catch (e) {
        // handled by mutation toast
      }
    }
  };

  const handleToggle = (item) => {
    toggleMutation.mutate({ id: item._id, isActive: !item.isActive });
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
                <ArchiveBoxIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Other Items</h1>
                <p className="text-white/70 mt-1">
                  Hangers, bags and other add-ons sold alongside laundry services
                </p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{ backgroundColor: '#fe7f2d' }}
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-100">
              <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              <p className="text-xs text-gray-500 mt-1">In catalog</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Available</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Can be added to orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-orange-100">
              <TagIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500">Hanger Price</p>
              {hangerItems.length === 0 ? (
                <>
                  <p className="text-base font-bold text-red-600">Not set</p>
                  <p className="text-xs text-gray-500 mt-1">Add a “Hanger” item to enable hangers on orders</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{formatOrderAmount(hangerItems[0].price)}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {hangerItems.length === 1 ? hangerItems[0].name : `${hangerItems.length} hanger types`}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d]"
          >
            <option value="all">All categories</option>
            {EXTRA_ITEM_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d]"
          >
            <option value="all">All statuses</option>
            <option value="active">Available</option>
            <option value="inactive">Unavailable</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load items</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-semibold text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {items.length === 0 ? 'Start by adding hangers or any other add-on you sell.' : 'Try adjusting your filters.'}
            </p>
            {items.length === 0 && (
              <Button onClick={openCreate} className="mt-5">
                <PlusIcon className="h-4 w-4" />
                Add your first item
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${getExtraItemCategoryColor(item.category)}`}>
                        {getExtraItemCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold" style={{ color: '#fe7f2d' }}>{formatOrderAmount(item.price)}</div>
                      <div className="text-xs text-gray-500">per {item.unit || 'piece'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.isActive ? '✓ Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(item)}
                          disabled={toggleMutation.isPending}
                          className={`p-2 rounded-lg transition-colors ${item.isActive ? 'hover:bg-red-50 text-gray-500 hover:text-red-700' : 'hover:bg-green-50 text-gray-500 hover:text-green-700'}`}
                          title={item.isActive ? 'Mark unavailable' : 'Mark available'}
                        >
                          <PowerIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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

      <ExtraItemFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editingItem}
      />
    </div>
  );
};

export default OtherItems;
