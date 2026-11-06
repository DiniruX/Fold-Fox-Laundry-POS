import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { staffAPI } from '../../services/api';
import {
  useCreateExpense,
  useUpdateExpense,
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
} from '../../services/expenseService';
import { formatOrderAmount } from '../../services/orderService';

const toDateInput = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const emptyValues = {
  category: 'other',
  staff: '',
  salaryPeriod: currentMonth(),
  description: '',
  amount: '',
  date: toDateInput(),
  paymentMethod: 'cash',
  reference: '',
  notes: '',
};

const selectClass = 'block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d]';

/**
 * Record / edit an expense. Pass `preset="salary"` to open the modal in
 * salary mode straight away.
 */
const ExpenseFormModal = ({ isOpen, onClose, expense = null, preset = null }) => {
  const isEditing = !!expense;
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues });

  const category = watch('category');
  const selectedStaffId = watch('staff');
  const isSalary = category === 'salary';

  // Staff list for salary payments (admin-only endpoint)
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff', 'forExpenses'],
    queryFn: () => staffAPI.getAll({ limit: 100, sortBy: 'personalInfo.firstName', sortOrder: 'asc' }),
    select: (response) => response.data.data?.staff || [],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const staffList = staffData || [];

  const selectedStaff = useMemo(
    () => staffList.find((s) => s._id === selectedStaffId),
    [staffList, selectedStaffId]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      reset({
        category: expense.category || 'other',
        staff: expense.staff?._id || expense.staff || '',
        salaryPeriod: expense.salaryPeriod || currentMonth(),
        description: expense.description || '',
        amount: expense.amount ?? '',
        date: toDateInput(expense.date),
        paymentMethod: expense.paymentMethod || 'cash',
        reference: expense.reference || '',
        notes: expense.notes || '',
      });
    } else {
      reset({ ...emptyValues, date: toDateInput(), salaryPeriod: currentMonth(), category: preset || 'other' });
    }
  }, [isOpen, expense, preset, reset]);

  // Suggest the staff member's configured salary when picking them
  const handleStaffChange = (e) => {
    const staff = staffList.find((s) => s._id === e.target.value);
    const salary = staff?.employmentInfo?.salary?.amount;
    if (salary && !isEditing) {
      setValue('amount', salary);
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      category: values.category,
      description: values.description?.trim() || '',
      amount: parseFloat(values.amount),
      date: values.date,
      paymentMethod: values.paymentMethod,
      reference: values.reference?.trim() || '',
      notes: values.notes?.trim() || '',
    };
    if (values.category === 'salary') {
      payload.staff = values.staff;
      payload.salaryPeriod = values.salaryPeriod || '';
    }
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: expense._id, data: payload });
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Expense' : isSalary ? 'Record Salary Payment' : 'Record Expense'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#233d4d] mb-2">
              Category <span className="text-[#fe7f2d]">*</span>
            </label>
            <select {...register('category', { required: true })} className={selectClass}>
              {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Date"
            type="date"
            required
            {...register('date', { required: 'Date is required' })}
            error={errors.date?.message}
          />
        </div>

        {isSalary && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                  Staff Member <span className="text-[#fe7f2d]">*</span>
                </label>
                <select
                  {...register('staff', {
                    required: isSalary ? 'Select the staff member being paid' : false,
                    onChange: handleStaffChange,
                  })}
                  className={selectClass}
                  disabled={isLoadingStaff}
                >
                  <option value="">{isLoadingStaff ? 'Loading staff...' : 'Select staff member'}</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.personalInfo?.firstName} {s.personalInfo?.lastName}
                      {s.employmentInfo?.position ? ` · ${s.employmentInfo.position}` : ''}
                    </option>
                  ))}
                </select>
                {errors.staff && <p className="mt-2 text-sm text-red-600 font-medium">{errors.staff.message}</p>}
                {selectedStaff?.employmentInfo?.salary?.amount > 0 && (
                  <p className="mt-2 text-xs text-indigo-700">
                    Configured salary: {formatOrderAmount(selectedStaff.employmentInfo.salary.amount)}
                    {selectedStaff.employmentInfo.salary.paymentFrequency ? ` / ${selectedStaff.employmentInfo.salary.paymentFrequency}` : ''}
                  </p>
                )}
              </div>
              <Input
                label="Pay Period"
                type="month"
                {...register('salaryPeriod', {
                  pattern: { value: /^\d{4}-(0[1-9]|1[0-2])$/, message: 'Use YYYY-MM' },
                })}
                error={errors.salaryPeriod?.message}
                helperText="Month this salary covers"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Amount (LKR)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
            })}
            error={errors.amount?.message}
          />
          <div>
            <label className="block text-sm font-semibold text-[#233d4d] mb-2">Paid By</label>
            <select {...register('paymentMethod')} className={selectClass}>
              {EXPENSE_PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label={isSalary ? 'Description (Optional)' : 'Description'}
          placeholder={isSalary ? 'Defaults to "Salary - <name> (period)"' : 'e.g. Electricity bill - October'}
          required={!isSalary}
          {...register('description', {
            required: !isSalary ? 'Description is required' : false,
            maxLength: { value: 200, message: 'Description cannot exceed 200 characters' },
          })}
          error={errors.description?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Reference (Optional)"
            placeholder="Receipt / invoice / slip no."
            {...register('reference', { maxLength: { value: 60, message: 'Reference cannot exceed 60 characters' } })}
            error={errors.reference?.message}
          />
          <Input
            label="Notes (Optional)"
            placeholder="Anything worth remembering"
            {...register('notes', { maxLength: { value: 500, message: 'Notes cannot exceed 500 characters' } })}
            error={errors.notes?.message}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            {isEditing ? 'Save Changes' : isSalary ? 'Record Payment' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseFormModal;
