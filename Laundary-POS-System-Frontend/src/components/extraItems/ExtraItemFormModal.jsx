import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import {
  useCreateExtraItem,
  useUpdateExtraItem,
  EXTRA_ITEM_CATEGORY_OPTIONS,
} from '../../services/extraItemService';

const emptyValues = {
  name: '',
  category: 'other',
  price: '',
  unit: 'piece',
  description: '',
  isActive: true,
};

/**
 * Add / edit an "Other Item" (hangers, bags, ...).
 */
const ExtraItemFormModal = ({ isOpen, onClose, item = null }) => {
  const isEditing = !!item;
  const createMutation = useCreateExtraItem();
  const updateMutation = useUpdateExtraItem();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues });

  useEffect(() => {
    if (!isOpen) return;
    reset(item ? {
      name: item.name || '',
      category: item.category || 'other',
      price: item.price ?? '',
      unit: item.unit || 'piece',
      description: item.description || '',
      isActive: item.isActive !== false,
    } : emptyValues);
  }, [isOpen, item, reset]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name.trim(),
      category: values.category,
      price: parseFloat(values.price),
      unit: values.unit?.trim() || 'piece',
      description: values.description?.trim() || '',
      isActive: !!values.isActive,
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: item._id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      // toast handled by mutation
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const category = watch('category');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Item' : 'Add Item'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Item Name"
          placeholder="e.g. Hanger (Plastic)"
          required
          {...register('name', {
            required: 'Item name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
            maxLength: { value: 60, message: 'Name cannot exceed 60 characters' },
          })}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#233d4d] mb-2">
              Category <span className="text-[#fe7f2d]">*</span>
            </label>
            <select
              {...register('category', { required: true })}
              className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d]"
            >
              {EXTRA_ITEM_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {category === 'hanger' && (
              <p className="mt-2 text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                Hanger items power the “Hangers” counter on the order form.
              </p>
            )}
          </div>

          <Input
            label="Price (LKR)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            {...register('price', {
              required: 'Price is required',
              min: { value: 0, message: 'Price cannot be negative' },
            })}
            error={errors.price?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Unit"
            placeholder="piece"
            {...register('unit', { maxLength: { value: 20, message: 'Unit cannot exceed 20 characters' } })}
            error={errors.unit?.message}
            helperText="How the item is sold, e.g. piece, pack, bottle"
          />
          <div className="flex items-end">
            <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl w-full cursor-pointer hover:border-green-300 transition-colors">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">Available for sale</span>
            </label>
          </div>
        </div>

        <Input
          label="Description (Optional)"
          placeholder="Short note shown to staff"
          {...register('description', { maxLength: { value: 200, message: 'Description cannot exceed 200 characters' } })}
          error={errors.description?.message}
        />

        <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            {isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExtraItemFormModal;
