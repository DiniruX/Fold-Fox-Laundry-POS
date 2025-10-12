import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useStaffService, useStaffMember } from '../hooks/useStaffService';
import { EMPLOYMENT_TYPES } from '../constants';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const StaffFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const { createStaff, updateStaff } = useStaffService();

  const isEditing = !!id;
  const title = isEditing ? 'Edit Staff Member' : 'Add New Staff Member';

  // Fetch staff if editing
  const { data: staffData, isLoading: isLoadingStaff } = useStaffMember(id);
  const staff = staffData?.data?.staff || null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      personalInfo: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        phoneNumber: '',
        email: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phoneNumber: ''
        }
      },
      employmentInfo: {
        position: '',
        employmentType: 'full_time',
        hireDate: new Date().toISOString().split('T')[0],
        workSchedule: {
          startTime: '09:00',
          endTime: '18:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          shiftType: 'morning'
        },
        salary: {
          amount: 0,
          currency: 'LKR',
          paymentFrequency: 'monthly'
        }
      }
    }
  });

  // Load staff data if editing
  useEffect(() => {
    if (staff) {
      const formData = {
        personalInfo: {
          firstName: staff.personalInfo?.firstName || '',
          lastName: staff.personalInfo?.lastName || '',
          dateOfBirth: staff.personalInfo?.dateOfBirth ? new Date(staff.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
          gender: staff.personalInfo?.gender || 'male',
          phoneNumber: staff.personalInfo?.phoneNumber || '',
          email: staff.personalInfo?.email || '',
          address: {
            street: staff.personalInfo?.address?.street || '',
            city: staff.personalInfo?.address?.city || '',
            state: staff.personalInfo?.address?.state || '',
            zipCode: staff.personalInfo?.address?.zipCode || '',
            country: staff.personalInfo?.address?.country || 'India'
          },
          emergencyContact: {
            name: staff.personalInfo?.emergencyContact?.name || '',
            relationship: staff.personalInfo?.emergencyContact?.relationship || '',
            phoneNumber: staff.personalInfo?.emergencyContact?.phoneNumber || ''
          }
        },
        employmentInfo: {
          position: staff.employmentInfo?.position || '',
          employmentType: staff.employmentInfo?.employmentType || 'full_time',
          hireDate: staff.employmentInfo?.hireDate ? new Date(staff.employmentInfo.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          workSchedule: {
            startTime: staff.employmentInfo?.workSchedule?.startTime || '09:00',
            endTime: staff.employmentInfo?.workSchedule?.endTime || '18:00',
            workingDays: staff.employmentInfo?.workSchedule?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            shiftType: staff.employmentInfo?.workSchedule?.shiftType || 'morning'
          },
          salary: {
            amount: staff.employmentInfo?.salary?.amount || 0,
            currency: staff.employmentInfo?.salary?.currency || 'LKR',
            paymentFrequency: staff.employmentInfo?.salary?.paymentFrequency || 'monthly'
          }
        }
      };
      reset(formData);
    }
  }, [staff, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (staff) {
        await updateStaff.mutateAsync({ id: staff._id, staffData: data });
        toast.success('Staff member updated successfully');
      } else {
        await createStaff.mutateAsync(data);
        toast.success('Staff member created successfully');
      }
      navigate('/staff');
    } catch (error) {
      toast.error(error.message || 'Failed to save staff member');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'employment', name: 'Employment', icon: '💼' },
  ];

  const workingDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  if (isLoadingStaff) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div 
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 100%)',
        }}
      >
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/staff')}
                className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-white/70 mt-1">
                  {isEditing ? 'Update staff information' : 'Fill in the details below to add a new team member'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-8">
          {/* Enhanced Header */}
          <div 
            className="rounded-xl p-6 mb-6 -mx-2"
            style={{ 
              background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 50%, #fe7f2d 100%)',
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white shadow-lg">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {title}
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  {isEditing ? 'Update staff information' : 'Fill in the details below to add a new team member'}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="border-b border-gray-200 mb-6" style={{ backgroundColor: '#fafbfc' }}>
            <nav className="flex space-x-1 px-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-3 px-4 border-b-3 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                    }`}
                    style={
                      isActive
                        ? { 
                            borderBottomWidth: '3px',
                            borderBottomColor: '#fe7f2d',
                            backgroundColor: 'white'
                          }
                        : { borderBottomWidth: '3px' }
                    }
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tab Content */}
            <div className="max-h-[500px] overflow-y-auto pr-2">
              {/* Personal Information */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <Input
                        {...register('personalInfo.firstName', { required: 'First name is required' })}
                        error={errors.personalInfo?.firstName?.message}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <Input
                        {...register('personalInfo.lastName', { required: 'Last name is required' })}
                        error={errors.personalInfo?.lastName?.message}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth *
                      </label>
                      <Input
                        type="date"
                        {...register('personalInfo.dateOfBirth', { required: 'Date of birth is required' })}
                        error={errors.personalInfo?.dateOfBirth?.message}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender *
                      </label>
                      <select
                        {...register('personalInfo.gender', { required: 'Gender is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <Input
                        {...register('personalInfo.phoneNumber', { 
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[0-9]{10,15}$/,
                            message: 'Please enter a valid phone number'
                          }
                        })}
                        error={errors.personalInfo?.phoneNumber?.message}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        {...register('personalInfo.email', {
                          pattern: {
                            value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                            message: 'Please enter a valid email'
                          }
                        })}
                        error={errors.personalInfo?.email?.message}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Address</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street
                        </label>
                        <Input
                          {...register('personalInfo.address.street')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <Input
                          {...register('personalInfo.address.city')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <Input
                          {...register('personalInfo.address.state')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code
                        </label>
                        <Input
                          {...register('personalInfo.address.zipCode')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <Input
                          {...register('personalInfo.address.country')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Emergency Contact</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <Input
                          {...register('personalInfo.emergencyContact.name')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relationship
                        </label>
                        <Input
                          {...register('personalInfo.emergencyContact.relationship')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <Input
                          {...register('personalInfo.emergencyContact.phoneNumber')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employment Information */}
              {activeTab === 'employment' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position *
                    </label>
                    <Input
                      {...register('employmentInfo.position', { required: 'Position is required' })}
                      error={errors.employmentInfo?.position?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employment Type
                      </label>
                      <select
                        {...register('employmentInfo.employmentType')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.entries(EMPLOYMENT_TYPES).map(([key, value]) => (
                          <option key={key} value={value}>
                            {value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hire Date *
                      </label>
                      <Input
                        type="date"
                        {...register('employmentInfo.hireDate', { required: 'Hire date is required' })}
                        error={errors.employmentInfo?.hireDate?.message}
                      />
                    </div>
                  </div>

                  {/* Work Schedule */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Work Schedule</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <Input
                          type="time"
                          {...register('employmentInfo.workSchedule.startTime')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <Input
                          type="time"
                          {...register('employmentInfo.workSchedule.endTime')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Working Days
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {workingDays.map((day) => (
                          <label key={day.value} className="flex items-center">
                            <input
                              type="checkbox"
                              value={day.value}
                              {...register('employmentInfo.workSchedule.workingDays')}
                              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shift Type
                      </label>
                      <select
                        {...register('employmentInfo.workSchedule.shiftType')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="night">Night</option>
                      </select>
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Salary Information</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <Input
                          type="number"
                          min="0"
                          {...register('employmentInfo.salary.amount', { 
                            valueAsNumber: true,
                            min: { value: 0, message: 'Amount cannot be negative' }
                          })}
                          error={errors.employmentInfo?.salary?.amount?.message}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Currency
                        </label>
                        <select
                          {...register('employmentInfo.salary.currency')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="LKR">LKR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Frequency
                        </label>
                        <select
                          {...register('employmentInfo.salary.paymentFrequency')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                          <option value="daily">Daily</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/staff')}
                disabled={isLoading}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEditing ? '✓ Update Staff Member' : '+ Add Staff Member'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffFormPage;

