import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

const LogoutModal = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-4">
        {/* Icon and Title */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Sign Out</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to sign out?
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="text-sm text-gray-600">
          You will need to sign in again to access your account.
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutModal;
