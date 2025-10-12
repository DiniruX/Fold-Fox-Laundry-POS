import React, { useState } from 'react';
import { useStaffService } from '../../hooks/useStaffService';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const BulkOperations = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [operation, setOperation] = useState('');
  const [customData, setCustomData] = useState({});
  
  const { getAllStaff, bulkUpdateStaff } = useStaffService();

  // Mock staff data for selection (in real app, this would come from API)
  const [staff, setStaff] = useState([]);

  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await getAllStaff({ limit: 100 });
        setStaff(response.data?.staff || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      }
    };
    fetchStaff();
  }, [getAllStaff]);

  const handleStaffSelect = (staffId) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStaff.length === staff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(staff.map(s => s._id));
    }
  };

  const handleOperationChange = (op) => {
    setOperation(op);
    setCustomData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedStaff.length === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    if (!operation) {
      toast.error('Please select an operation');
      return;
    }

    setIsLoading(true);
    try {
      let updateData = {};
      
      switch (operation) {
        case 'activate':
          updateData = {
            'status.isActive': true,
            'status.employmentStatus': 'active'
          };
          break;
        case 'deactivate':
          updateData = {
            'status.isActive': false
          };
          break;
        case 'terminate':
          updateData = {
            'status.isActive': false,
            'status.employmentStatus': 'terminated',
            'status.terminationDate': new Date(),
            'status.terminationReason': customData.terminationReason || 'Bulk termination'
          };
          break;
        case 'update_employment_type':
          if (!customData.employmentType) {
            toast.error('Please select an employment type');
            return;
          }
          updateData = {
            'employmentInfo.employmentType': customData.employmentType
          };
          break;
        default:
          toast.error('Invalid operation');
          return;
      }

      await bulkUpdateStaff.mutateAsync({
        staffIds: selectedStaff,
        updateData,
        action: operation
      });

      toast.success(`Successfully updated ${selectedStaff.length} staff member(s)`);
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to perform bulk operation');
    } finally {
      setIsLoading(false);
    }
  };

  const operations = [
    { value: 'activate', label: 'Activate Staff', description: 'Set staff status to active' },
    { value: 'deactivate', label: 'Deactivate Staff', description: 'Set staff status to inactive' },
    { value: 'terminate', label: 'Terminate Staff', description: 'Terminate employment' },
    { value: 'update_employment_type', label: 'Update Employment Type', description: 'Change employment type' },
  ];

  const employmentTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Bulk Staff Operations"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Staff Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Select Staff Members</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {selectedStaff.length} of {staff.length} selected
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedStaff.length === staff.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {staff.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No staff members found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {staff.map((staffMember) => (
                  <label
                    key={staffMember._id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(staffMember._id)}
                      onChange={() => handleStaffSelect(staffMember._id)}
                      className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {staffMember.personalInfo?.firstName?.charAt(0) || 'S'}
                            {staffMember.personalInfo?.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {staffMember.personalInfo?.firstName} {staffMember.personalInfo?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {staffMember.employeeId} • {staffMember.employmentInfo?.position}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Operation Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Operation</h3>
          <div className="grid grid-cols-1 gap-3">
            {operations.map((op) => (
              <label
                key={op.value}
                className={`relative flex items-start p-4 border rounded-lg cursor-pointer ${
                  operation === op.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="operation"
                  value={op.value}
                  checked={operation === op.value}
                  onChange={() => handleOperationChange(op.value)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {op.label}
                  </div>
                  <div className="text-sm text-gray-500">
                    {op.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Data Inputs */}
        {operation === 'terminate' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termination Reason
            </label>
            <textarea
              value={customData.terminationReason || ''}
              onChange={(e) => setCustomData({...customData, terminationReason: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter termination reason..."
            />
          </div>
        )}

        {operation === 'update_employment_type' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Employment Type
            </label>
            <select
              value={customData.employmentType || ''}
              onChange={(e) => setCustomData({...customData, employmentType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Employment Type</option>
              {employmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Summary */}
        {selectedStaff.length > 0 && operation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Operation Summary</h4>
            <p className="text-sm text-blue-700">
              <strong>{operations.find(op => op.value === operation)?.label}</strong> will be applied to{' '}
              <strong>{selectedStaff.length}</strong> staff member(s).
            </p>
            {operation === 'terminate' && (
              <p className="text-sm text-blue-700 mt-1">
                <strong>Warning:</strong> This action will terminate the employment of selected staff members.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || selectedStaff.length === 0 || !operation}
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            Execute Operation
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkOperations;
