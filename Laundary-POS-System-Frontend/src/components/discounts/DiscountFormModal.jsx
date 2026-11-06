import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import {
  useCreateDiscount,
  useUpdateDiscount,
  DISCOUNT_TYPE_OPTIONS,
  DISCOUNT_CUSTOMER_TYPE_OPTIONS,
} from '../../services/discountService';

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const today = () => toDateInput(new Date());

const emptyValues = {
  name: '',
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  startDate: today(),
  endDate: '',
  customerType: 'all',
  isActive: true,
};

const selectClass = 'block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d]';

/**
 * Create / edit a promotion.
 */
const DiscountFormModal = ({ isOpen, onClose, discount = null }) => {
  const isEditing = !!discount;
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues });

  useEffect(() => {
    if (!isOpen) return;
    reset(discount ? {
      name: discount.name || '',
      code: discount.code || '',
      description: discount.description || '',
      type: discount.type || 'percentage',
      value: discount.value ?? '',
      maxDiscountAmount: discount.maxDiscountAmount ?? '',
      minOrderAmount: discount.minOrderAmount || '',
      startDate: toDateInput(discount.startDate) || today(),
      endDate: toDateInput(discount.endDate),
      customerType: discount.customerType || 'all',
      isActive: discount.isActive !== false,
    } : { ...emptyValues, startDate: today() });
  }, [isOpen, discount, reset]);

  const type = watch('type');
  const startDate = watch('startDate');

  const onSubmit = async (values) => {
    const payload = {
      name: values.name.trim(),
      code: values.code?.trim().toUpperCase() || '',
      description: values.description?.trim() || '',
      type: values.type,
      value: parseFloat(values.value),
      maxDiscountAmount: values.type === 'percentage' && values.maxDiscountAmount !== '' ? parseFloat(values.maxDiscountAmount) : '',
      minOrderAmount: values.minOrderAmount !== '' ? parseFloat(values.minOrderAmount) : 0,
      startDate: values.startDate,
      endDate: values.endDate || null,
      customerType: values.customerType,
      isActive: !!values.isActive,
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: discount._id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      // toast handled by mutation
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Discount' : 'New Discount'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Offer Name"
              placeholder="e.g. Avurudu Special"
              required
              {...register('name', {
                required: 'Offer name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 80, message: 'Name cannot exceed 80 characters' },
              })}
              error={errors.name?.message}
            />
          </div>
          <Input
            label="Code (Optional)"
            placeholder="AVURUDU20"
            className="uppercase"
            {...register('code', {
              pattern: { value: /^[A-Za-z0-9_-]{2,20}$/, message: '2-20 letters, numbers, - or _' },
            })}
            error={errors.code?.message}
            helperText="Printed on receipts"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#233d4d] mb-2">
              Discount Type <span className="text-[#fe7f2d]">*</span>
            </label>
            <select {...register('type')} className={selectClass}>
              {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Input
            label={type === 'fixed' ? 'Amount Off (LKR)' : 'Percentage Off (%)'}
            type="number"
            step={type === 'fixed' ? '1' : '0.5'}
            min="0"
            max={type === 'fixed' ? undefined : '100'}
            placeholder={type === 'fixed' ? '150' : '10'}
            required
            {...register('value', {
              required: 'Discount value is required',
              min: { value: 0.01, message: 'Must be greater than 0' },
              ...(type === 'percentage' ? { max: { value: 100, message: 'Cannot exceed 100%' } } : {}),
            })}
            error={errors.value?.message}
          />
          {type === 'percentage' ? (
            <Input
              label="Max Discount (LKR)"
              type="number"
              step="1"
              min="0"
              placeholder="No cap"
              {...register('maxDiscountAmount', { min: { value: 0, message: 'Cannot be negative' } })}
              error={errors.maxDiscountAmount?.message}
              helperText="Optional cap per order"
            />
          ) : (
            <div className="hidden md:block" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Start Date"
            type="date"
            required
            {...register('startDate', { required: 'Start date is required' })}
            error={errors.startDate?.message}
          />
          <Input
            label="End Date"
            type="date"
            min={startDate || undefined}
            {...register('endDate', {
              validate: (v) => !v || !startDate || v >= startDate || 'End date must be after the start date',
            })}
            error={errors.endDate?.message}
            helperText="Leave empty for an open-ended offer"
          />
          <Input
            label="Min Order (LKR)"
            type="number"
            step="1"
            min="0"
            placeholder="0"
            {...register('minOrderAmount', { min: { value: 0, message: 'Cannot be negative' } })}
            error={errors.minOrderAmount?.message}
            helperText="Subtotal needed to qualify"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#233d4d] mb-2">
              Who gets it <span className="text-[#fe7f2d]">*</span>
            </label>
            <select {...register('customerType')} className={selectClass}>
              {DISCOUNT_CUSTOMER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl w-full cursor-pointer hover:border-green-300 transition-colors">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-semibold text-gray-700 block">Enabled</span>
                <span className="text-xs text-gray-500">Turn off to pause the offer without deleting it</span>
              </div>
            </label>
          </div>
        </div>

        <Input
          label="Description (Optional)"
          placeholder="Shown to staff when creating an order"
          {...register('description', { maxLength: { value: 300, message: 'Description cannot exceed 300 characters' } })}
          error={errors.description?.message}
        />

        <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            {isEditing ? 'Save Changes' : 'Create Discount'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DiscountFormModal;
