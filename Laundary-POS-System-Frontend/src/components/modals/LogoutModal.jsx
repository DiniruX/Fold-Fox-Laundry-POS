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
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-6">
        {/* Icon and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Sign Out</h3>
            <p className="text-base text-gray-600 mt-1">
              Are you sure you want to sign out?
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="text-base text-gray-600 bg-gray-50 rounded-lg p-4">
          You will need to sign in again to access your account.
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t-2 border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-3"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
            className="px-6 py-3"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutModal;
