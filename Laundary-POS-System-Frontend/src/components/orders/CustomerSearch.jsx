import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { default as customerService } from '../../services/customerService';
import { formatPhoneNumber } from '../../utils/helpers';
import Input from '../ui/Input';

const MIN_SEARCH_LENGTH = 2;

const DEFAULT_CUSTOMERS = [
  {
    _id: 'demo-admin',
    fullName: 'Admin Account',
    phoneNumber: '0771234567',
    email: 'admin@laundry.com',
    loyaltyPoints: 0,
    totalOrders: 0,
    isStudent: false,
  },
  {
    _id: 'demo-cashier',
    fullName: 'Cashier Account',
    phoneNumber: '0779876543',
    email: 'cashier@laundry.com',
    loyaltyPoints: 0,
    totalOrders: 0,
    isStudent: false,
  },
];

const CustomerSearch = ({ onSelectCustomer, selectedCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async () => {
    const trimmedTerm = searchTerm.trim();

    if (trimmedTerm.length < MIN_SEARCH_LENGTH) {
      setErrorMessage(`Type at least ${MIN_SEARCH_LENGTH} characters to search`);
      setCustomers([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await customerService.searchCustomers({
        q: trimmedTerm,
        limit: 10,
      });
      if (response.success === false) {
        setCustomers([]);
        setErrorMessage(response.error || 'Failed to fetch customers. Please try again.');
      } else {
        const data = response.customers || [];
        setCustomers(data.length > 0 ? data : DEFAULT_CUSTOMERS);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error.response?.status === 429) {
        setErrorMessage('Too many requests. Please wait a moment and try again.');
      } else {
        setErrorMessage('Failed to fetch customers. Please try again.');
      }
      setCustomers([]);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleCustomerSelect = (customer) => {
    onSelectCustomer(customer);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      onSelectCustomer(null);
    }
  };


  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => {
            if (customers.length > 0 || errorMessage) {
              setShowResults(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 text-base"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm font-medium text-white rounded-lg"
          style={{ backgroundColor: '#fe7f2d' }}
          disabled={isLoading}
        >
          Search
        </button>
      </div>

      {/* Enhanced Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Searching customers...</p>
            </div>
          ) : errorMessage ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-red-600">{errorMessage}</p>
            </div>
          ) : customers.length > 0 ? (
            <>
              <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  {customers.length} Customer{customers.length !== 1 ? 's' : ''} Found
                </p>
              </div>
              {customers.map((customer) => (
                <div
                  key={customer._id}
                  onClick={() => handleCustomerSelect(customer)}
                  className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ backgroundColor: '#fe7f2d' }}>
                      {customer.fullName?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    
                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {customer.fullName || 'Unknown'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-600">
                          📞 {formatPhoneNumber(customer.phoneNumber || '')}
                        </p>
                        {customer.email && (
                          <p className="text-xs text-gray-500 truncate">
                            ✉️ {customer.email}
                          </p>
                        )}
                      </div>
                      {customer.isStudent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          🎓 Student
                        </span>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <span className="text-sm font-bold">⭐ {customer.loyaltyPoints || 0}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {customer.totalOrders || 0} orders
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-400 text-4xl mb-2">🔍</div>
              <p className="text-sm font-medium text-gray-900">No customers found</p>
              <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Selected Customer Display */}
      {selectedCustomer && !showResults && (
        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#fe7f2d' }}>
                {selectedCustomer.fullName?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <p className="text-sm font-bold text-green-900">
                  ✓ {selectedCustomer.fullName}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {formatPhoneNumber(selectedCustomer.phoneNumber || '')}
                </p>
                {selectedCustomer.loyaltyPoints > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ⭐ {selectedCustomer.loyaltyPoints} loyalty points • {selectedCustomer.totalOrders || 0} orders
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onSelectCustomer(null)}
              className="px-3 py-1.5 text-xs font-medium text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
