import React, { useState } from 'react';
import {
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency, getInitials } from '../../utils/helpers';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const StaffDetails = ({ staff, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('details');
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Staff Member`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Stunning Gradient Header */}
        <div 
          className="rounded-xl p-6 shadow-lg -mt-2 -mx-2"
          style={{ 
            background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 50%, #fe7f2d 100%)',
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
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
                onClick={() => onEdit(staff)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-lg"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
          
          {/* Employment Type Badge */}
          <div className="mt-4 flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              {getEmploymentTypeLabel(staff.employmentInfo?.employmentType)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              Joined {formatDate(staff.employmentInfo?.hireDate)}
            </span>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1">
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
        <div className="max-h-[500px] overflow-y-auto">
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

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

    </Modal>
  );
};

export default StaffDetails;
