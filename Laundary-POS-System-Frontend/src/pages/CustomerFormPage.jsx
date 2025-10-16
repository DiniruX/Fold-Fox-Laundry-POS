import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  StarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { customerService } from '../services/customerService';

// Validation schema - Matches backend requirements
const schema = yup.object({
  fullName: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .required('Full name is required'),
  email: yup
    .string()
    .email('Invalid email address')
    .optional() // Email is OPTIONAL in backend
    .transform((value) => value === '' ? undefined : value), // Convert empty string to undefined
  phoneNumber: yup
    .string()
    .matches(/^[0-9]{10,15}$/, 'Please enter a valid phone number (10-15 digits)')
    .required('Phone number is required'),
  isStudent: yup.boolean(),
  campusId: yup
    .string()
    .when('isStudent', {
      is: true,
      then: (schema) => schema.required('Campus ID is required for students'),
      otherwise: (schema) => schema.optional(),
    }),
  address: yup.object({
    street: yup.string().optional(), // Address fields are OPTIONAL in backend
    city: yup.string().optional(),
    state: yup.string().optional(),
    zipCode: yup
      .string()
      .matches(/^[0-9]{5,6}$/, 'Please enter a valid zip code (5-6 digits)')
      .optional()
      .transform((value) => value === '' ? undefined : value), // Convert empty string to undefined
  }),
  loyaltyPoints: yup
    .number()
    .min(0, 'Loyalty points cannot be negative')
    .optional(),
});

const CustomerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isStudent, setIsStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditing = !!id;

  // Fetch customer data if editing
  const { data: customerData, isLoading: isFetchingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id),
    enabled: isEditing,
  });

  const customer = customerData?.customer;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      isStudent: false,
      campusId: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      loyaltyPoints: 0,
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return customerService.updateCustomer(id, data);
      }
      return customerService.createCustomer(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          navigate('/customers');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    },
  });

  // Watch isStudent field
  const watchedIsStudent = watch('isStudent');

  useEffect(() => {
    setIsStudent(watchedIsStudent);
  }, [watchedIsStudent]);

  // Reset form when customer data is loaded
  useEffect(() => {
    if (customer) {
      reset({
        fullName: customer.fullName || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        isStudent: customer.isStudent || false,
        campusId: customer.campusId || '',
        address: {
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          zipCode: customer.address?.zipCode || '',
        },
        loyaltyPoints: customer.loyaltyPoints || 0,
      });
      setIsStudent(customer.isStudent || false);
    }
  }, [customer, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Prepare data for submission
    const submitData = {
      ...data,
      loyaltyPoints: parseInt(data.loyaltyPoints) || 0,
    };

    mutation.mutate(submitData);
    setIsLoading(false);
  };

  if (isFetchingCustomer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading customer..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Customers
        </button>

        {/* Enhanced Header with Icon */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div 
              className="h-16 w-16 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#fe7f2d' }}
            >
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing
                  ? 'Update customer information below'
                  : 'Fill in the details to add a new customer to your database'
                }
              </p>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`rounded-md p-4 mb-6 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center">
                <p
                  className={`text-sm ${
                    message.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Form with Step Indicators */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b-2 border-orange-200">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#fe7f2d' }}>
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <p className="text-xs text-gray-500">Essential customer details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                <div>
                  <Input
                    {...register('fullName')}
                    label="Full Name"
                    type="text"
                    placeholder="e.g., John Doe"
                    error={errors.fullName?.message}
                    leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
                  />
                  <p className="mt-1 text-xs text-gray-500">Customer's complete name</p>
                </div>

                <div>
                  <Input
                    {...register('phoneNumber')}
                    label="Phone Number"
                    type="tel"
                    placeholder="e.g., 1234567890"
                    error={errors.phoneNumber?.message}
                    leftIcon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                  />
                  <p className="mt-1 text-xs text-gray-500">10-15 digits, no spaces</p>
                </div>

                <div className="md:col-span-2">
                  <Input
                    {...register('email')}
                    label="Email Address (Optional)"
                    type="email"
                    placeholder="e.g., customer@example.com"
                    error={errors.email?.message}
                    leftIcon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                  />
                  <p className="mt-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                    💡 Optional but recommended for order confirmations and receipts via email
                  </p>
                </div>

                {isEditing && (
                  <div>
                    <Input
                      {...register('loyaltyPoints')}
                      label="Loyalty Points"
                      type="number"
                      placeholder="0"
                      error={errors.loyaltyPoints?.message}
                      leftIcon={<StarIcon className="h-5 w-5 text-gray-400" />}
                    />
                    <p className="mt-1 text-xs text-gray-500">Adjust customer loyalty points</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Student Information (Optional) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b-2 border-blue-200">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-500">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                  <p className="text-xs text-gray-500">Optional - For student discounts and benefits</p>
                </div>
              </div>

              <div className="pl-11 space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <input
                    {...register('isStudent')}
                    id="isStudent"
                    type="checkbox"
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="isStudent" className="text-sm font-semibold text-gray-900 cursor-pointer">
                      This customer is a student
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Students may be eligible for special discounts and promotions
                    </p>
                  </div>
                </div>

                {isStudent && (
                  <div className="animate-fadeIn">
                    <Input
                      {...register('campusId')}
                      label="Campus/Student ID"
                      type="text"
                      placeholder="e.g., STU123456"
                      error={errors.campusId?.message}
                      leftIcon={<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />}
                    />
                    <p className="mt-1 text-xs text-gray-500">Required for student verification</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Address Information (Optional) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b-2 border-green-200">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-green-500">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Address Information (Optional)</h3>
                  <p className="text-xs text-gray-500">Helpful for pickup & delivery orders</p>
                </div>
              </div>

              <div className="pl-11 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Note:</strong> Address is optional. Customers can provide it when placing orders if needed for pickup/delivery.
                  </p>
                </div>
                
                <Input
                  {...register('address.street')}
                  label="Street Address (Optional)"
                  type="text"
                  placeholder="e.g., 123 Main Street, Malabe"
                  error={errors.address?.street?.message}
                  leftIcon={<MapPinIcon className="h-5 w-5 text-gray-400" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    {...register('address.city')}
                    label="City (Optional)"
                    type="text"
                    placeholder="e.g., Colombo"
                    error={errors.address?.city?.message}
                  />

                  <Input
                    {...register('address.state')}
                    label="State/Province (Optional)"
                    type="text"
                    placeholder="e.g., Western"
                    error={errors.address?.state?.message}
                  />

                  <Input
                    {...register('address.zipCode')}
                    label="Zip/Postal Code (Optional)"
                    type="text"
                    placeholder="e.g., 10001"
                    error={errors.address?.zipCode?.message}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
              <p className="text-xs text-gray-500">
                All fields marked with <span className="text-red-500">*</span> are required
              </p>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/customers')}
                  disabled={isLoading}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  className="px-8 shadow-lg"
                  style={{ backgroundColor: '#fe7f2d' }}
                >
                  {isEditing ? '✓ Update Customer' : '+ Create Customer'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormPage;

