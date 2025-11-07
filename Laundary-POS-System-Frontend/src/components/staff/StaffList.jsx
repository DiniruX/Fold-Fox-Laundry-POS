import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  Squares2X2Icon,
  TableCellsIcon,
  PhoneIcon,
  EnvelopeIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { formatDate, getInitials } from '../../utils/helpers';
import { useStaffService } from '../../hooks/useStaffService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const StaffList = ({ staff, onStaffSelect, onEditStaff, selectedStaff, onRefresh }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { deleteStaff } = useStaffService();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  const handleDelete = async (staffId) => {
    try {
      await deleteStaff.mutateAsync(staffId);
      toast.success('Staff member deleted successfully');
      setDeleteConfirm(null);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Failed to delete staff member');
    }
  };

  // Filter and sort staff
  const filteredStaff = useMemo(() => {
    let filtered = Array.isArray(staff?.data?.staff) ? [...staff.data.staff] : [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(staffMember => 
        staffMember.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.personalInfo?.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.personalInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.personalInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.personalInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.personalInfo?.phoneNumber?.includes(searchTerm) ||
        staffMember.employmentInfo?.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.personalInfo?.firstName || ''} ${a.personalInfo?.lastName || ''}`.toLowerCase();
          bValue = `${b.personalInfo?.firstName || ''} ${b.personalInfo?.lastName || ''}`.toLowerCase();
          break;
        case 'employeeId':
          aValue = a.employeeId || '';
          bValue = b.employeeId || '';
          break;
        case 'hireDate':
          aValue = new Date(a.employmentInfo?.hireDate || 0);
          bValue = new Date(b.employmentInfo?.hireDate || 0);
          break;
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [staff, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + pageSize);

  const getEmploymentTypeLabel = (type) => {
    const labels = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      intern: 'Intern',
    };
    return labels[type] || type;
  };

  if (!staff) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Staff Directory</h2>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {filteredStaff.length} Members
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage your team members and their information
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List View"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Sort */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Search */}
          <div className="md:col-span-7">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Quick Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, ID, position, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="createdAt-desc">⬇️ Newest First</option>
              <option value="createdAt-asc">⬆️ Oldest First</option>
              <option value="name-asc">🔤 Name A-Z</option>
              <option value="name-desc">🔤 Name Z-A</option>
              <option value="employeeId-asc">🆔 Employee ID</option>
              <option value="hireDate-desc">📅 Recent Hires</option>
              <option value="hireDate-asc">📅 Oldest Hires</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff - Grid or Table View */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        {paginatedStaff.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? 'Try adjusting your search to see more results.'
                : 'Get started by adding a new staff member.'
              }
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedStaff.map((staffMember) => (
                <div
                  key={staffMember._id}
                  className="relative bg-white border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg cursor-pointer border-gray-200 hover:border-gray-300"
                >
                  {/* Staff Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fe7f2d20' }}>
                      <span className="text-xl font-bold" style={{ color: '#fe7f2d' }}>
                        {getInitials(`${staffMember.personalInfo?.firstName || ''} ${staffMember.personalInfo?.lastName || ''}`)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {staffMember.personalInfo?.firstName} {staffMember.personalInfo?.lastName}
                      </h3>
                      <p className="text-xs text-gray-500">Employee ID: {staffMember.employeeId}</p>
                      <p className="text-xs text-gray-500">ID Number: {staffMember.personalInfo?.idNumber || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Position & Type */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900">{staffMember.employmentInfo?.position}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {getEmploymentTypeLabel(staffMember.employmentInfo?.employmentType)}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center text-xs text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{staffMember.personalInfo?.phoneNumber}</span>
                    </div>
                    {staffMember.personalInfo?.email && (
                      <div className="flex items-center text-xs text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{staffMember.personalInfo.email}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-600">
                      <BriefcaseIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Hired: {formatDate(staffMember.employmentInfo?.hireDate)}</span>
                    </div>
                  </div>

                  {/* Priority Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onStaffSelect(staffMember)}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => onEditStaff(staffMember)}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>

                  {/* Delete Button (top right) */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setDeleteConfirm(staffMember)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Enhanced List View */
          <ul className="divide-y divide-gray-200">
            {paginatedStaff.map((staffMember) => (
              <li key={staffMember._id} className="hover:bg-gray-50 transition-colors duration-150">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fe7f2d20' }}>
                          <span className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                            {getInitials(`${staffMember.personalInfo?.firstName || ''} ${staffMember.personalInfo?.lastName || ''}`)}
                          </span>
                        </div>
                      </div>

                      {/* Staff Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-base font-semibold text-gray-900 truncate">
                            {staffMember.personalInfo?.firstName} {staffMember.personalInfo?.lastName}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                          <span className="font-medium">Employee ID: {staffMember.employeeId}</span>
                          <span>•</span>
                          <span>{staffMember.employmentInfo?.position}</span>
                          <span>•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            {getEmploymentTypeLabel(staffMember.employmentInfo?.employmentType)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span>ID Number: {staffMember.personalInfo?.idNumber || 'N/A'}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <PhoneIcon className="h-3.5 w-3.5 mr-1" />
                            {staffMember.personalInfo?.phoneNumber}
                          </span>
                          {staffMember.personalInfo?.email && (
                            <>
                              <span>•</span>
                              <span className="flex items-center truncate">
                                <EnvelopeIcon className="h-3.5 w-3.5 mr-1" />
                                {staffMember.personalInfo.email}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>Hired: {formatDate(staffMember.employmentInfo?.hireDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Priority Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onStaffSelect(staffMember)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => onEditStaff(staffMember)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(staffMember)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-700 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{startIndex + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + pageSize, filteredStaff.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredStaff.length}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Delete Staff Member</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to permanently delete{' '}
              <strong>{deleteConfirm.personalInfo?.firstName} {deleteConfirm.personalInfo?.lastName}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;
