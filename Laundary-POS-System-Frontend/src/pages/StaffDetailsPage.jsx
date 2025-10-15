import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useStaffMember } from '../hooks/useStaffService';
import { formatDate, formatCurrency, getInitials } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const StaffDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('details');

  // Fetch staff data
  const { staffMember, isLoading } = useStaffMember(id);
  const staff = staffMember?.data || null;

  const getEmploymentTypeLabel = (type) => {
    const labels = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      intern: 'Intern',
    };
    return labels[type] || type;
  };

  const tabs = [
    { id: 'details', name: 'Staff Details', icon: UserIcon },
    { id: 'schedule', name: 'Schedule & Salary', icon: ClockIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Staff member not found</h2>
        <button
          onClick={() => navigate('/staff')}
          className="mt-4 text-orange-600 hover:text-orange-700"
        >
          ← Back to Staff
        </button>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/staff/edit/${staff._id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stunning Gradient Header */}
      <div 
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 50%, #fe7f2d 100%)',
        }}
      >
        <div className="px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/staff')}
                className="h-12 w-12 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <ArrowLeftIcon className="h-5 w-5 text-white" />
              </button>
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white shadow-lg">
                <span className="text-3xl font-bold" style={{ color: '#fe7f2d' }}>
                  {getInitials(`${staff.personalInfo?.firstName || ''} ${staff.personalInfo?.lastName || ''}`)}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-white">
                    {staff.personalInfo?.firstName} {staff.personalInfo?.lastName}
                  </h2>
                </div>
                <div className="mt-1 space-y-1">
                  <p className="text-white/90 text-sm font-medium">
                    {staff.employmentInfo?.position}
                  </p>
                  <p className="text-white/70 text-xs">
                    Employee ID: {staff.employeeId}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Priority Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEdit}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-lg"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
          
          {/* Employment Type Badge */}
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              {getEmploymentTypeLabel(staff.employmentInfo?.employmentType)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              Joined {formatDate(staff.employmentInfo?.hireDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-4 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'border-b-3 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  style={
                    isActive
                      ? { borderBottomWidth: '3px', borderBottomColor: '#fe7f2d' }
                      : { borderBottomWidth: '3px' }
                  }
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-orange-500' : ''}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div 
                className="rounded-xl p-6 shadow-sm border-l-4"
                style={{ 
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  borderLeftColor: '#3b82f6'
                }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-500">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
                    <p className="text-sm font-medium text-gray-900">
                      {staff.personalInfo?.dateOfBirth ? formatDate(staff.personalInfo.dateOfBirth) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {staff.personalInfo?.gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                    <p className="text-sm font-medium text-gray-900 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2 text-blue-500" />
                      {staff.personalInfo?.phoneNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-sm font-medium text-gray-900 flex items-center truncate">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-blue-500" />
                      {staff.personalInfo?.email || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {staff.personalInfo?.address && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                    <p className="text-sm font-medium text-gray-900 flex items-start">
                      <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span>
                        {[
                          staff.personalInfo.address.street,
                          staff.personalInfo.address.city,
                          staff.personalInfo.address.state,
                          staff.personalInfo.address.zipCode,
                          staff.personalInfo.address.country
                        ].filter(Boolean).join(', ') || 'N/A'}
                      </span>
                    </p>
                  </div>
                )}

                {staff.personalInfo?.emergencyContact && staff.personalInfo.emergencyContact.name && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Emergency Contact</label>
                    <p className="text-sm font-medium text-gray-900">
                      {staff.personalInfo.emergencyContact.name} ({staff.personalInfo.emergencyContact.relationship})
                      <br />
                      <PhoneIcon className="h-4 w-4 inline mr-1 text-blue-500" />
                      {staff.personalInfo.emergencyContact.phoneNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Employment Information Card */}
              <div 
                className="rounded-xl p-6 shadow-sm border-l-4"
                style={{ 
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderLeftColor: '#f59e0b'
                }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-yellow-500">
                    <BriefcaseIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Position</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {staff.employmentInfo?.position || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Employment Type</label>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-yellow-200 text-yellow-900">
                      {getEmploymentTypeLabel(staff.employmentInfo?.employmentType)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hire Date</label>
                    <p className="text-sm font-medium text-gray-900 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-yellow-600" />
                      {staff.employmentInfo?.hireDate ? formatDate(staff.employmentInfo.hireDate) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* Work Schedule Card */}
              {staff.employmentInfo?.workSchedule && (
                <div 
                  className="rounded-xl p-6 shadow-sm border-l-4"
                  style={{ 
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderLeftColor: '#10b981'
                  }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-500">
                      <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Work Schedule</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Working Hours</label>
                      <p className="text-sm font-semibold text-gray-900">
                        {staff.employmentInfo.workSchedule.startTime} - {staff.employmentInfo.workSchedule.endTime}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Shift Type</label>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-200 text-green-900 capitalize">
                        {staff.employmentInfo.workSchedule.shiftType}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Working Days</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {staff.employmentInfo.workSchedule.workingDays?.map((day) => (
                          <span key={day} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-800 capitalize">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary Information Card */}
              {staff.employmentInfo?.salary && (
                <div 
                  className="rounded-xl p-6 shadow-sm border-l-4"
                  style={{ 
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    borderLeftColor: '#ef4444'
                  }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-red-500">
                      <CurrencyDollarIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Salary Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Compensation</label>
                      <p className="text-2xl font-bold" style={{ color: '#fe7f2d' }}>
                        {formatCurrency(staff.employmentInfo.salary.amount)} {staff.employmentInfo.salary.currency}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Payment Frequency</label>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-200 text-red-900 capitalize">
                        {staff.employmentInfo.salary.paymentFrequency}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetailsPage;

