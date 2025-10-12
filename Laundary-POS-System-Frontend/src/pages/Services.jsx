import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CogIcon,
  ChartBarIcon,
  CalculatorIcon,
  PlusIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import ServiceList from '../components/services/ServiceList';
import ServiceAnalytics from '../components/services/ServiceAnalytics';
import PriceCalculator from '../components/services/PriceCalculator';
import BulkOperations from '../components/services/BulkOperations';
import { useServices } from '../services/serviceService';
import Button from '../components/ui/Button';

const Services = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);

  // Fetch service statistics
  const { data: servicesData } = useServices({
    page: 1,
    limit: 10,
  });

  const stats = servicesData?.stats || {};

  const tabs = [
    { id: 'list', name: 'Service List', icon: Squares2X2Icon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  const handleEdit = (service) => {
    navigate(`/services/edit/${service._id}`);
  };

  const handleView = (service) => {
    navigate(`/services/${service._id}`);
  };

  const handleBulkSelect = (selectedIds, allServices) => {
    setSelectedServices(selectedIds);
    setServices(allServices);
  };

  const handleCalculatorClose = () => {
    setShowCalculatorModal(false);
  };

  const handleBulkClose = () => {
    setShowBulkModal(false);
    setSelectedServices([]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <ServiceList
            onEdit={handleEdit}
            onView={handleView}
            onBulkSelect={handleBulkSelect}
          />
        );
      case 'analytics':
        return <ServiceAnalytics />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header Card */}
      <div 
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 100%)',
        }}
      >
        <div className="px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div 
                className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Service Management</h1>
                <p className="text-white/70 mt-1">
                  Manage service catalog, pricing models, and performance analytics
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCalculatorModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <CalculatorIcon className="h-5 w-5" />
                <span>Price Calculator</span>
              </button>
              {selectedServices.length > 0 && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                  <span>Bulk Actions ({selectedServices.length})</span>
                </button>
              )}
              <button
                onClick={() => navigate('/services/new')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Service</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Service Overview - Priority Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Services */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-100">
              <Squares2X2Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalServices || 0}</p>
              <p className="text-xs text-gray-500 mt-1">In catalog</p>
            </div>
          </div>
        </div>

        {/* Active Services */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Active Services</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeServices || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Available for orders</p>
            </div>
          </div>
        </div>

        {/* Most Popular */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-100">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Most Popular</p>
              <p className="text-base font-bold text-gray-900 truncate">{stats.mostPopular?.name || 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.mostPopular?.orders || 0} orders</p>
            </div>
          </div>
        </div>

        {/* Avg Processing Time */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-orange-100">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgTime || 0}<span className="text-lg">min</span></p>
              <p className="text-xs text-gray-500 mt-1">Per service</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="border-b border-gray-100" style={{ backgroundColor: '#fafbfc' }}>
          <nav className="flex px-6 space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-5 border-b-3 font-semibold text-sm transition-all duration-200 relative ${
                    isActive
                      ? 'text-white border-b-3'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                  style={
                    isActive
                      ? { 
                          borderBottomWidth: '3px',
                          borderBottomColor: '#fe7f2d',
                          color: '#233d4d',
                          backgroundColor: 'white'
                        }
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

        {/* Tab Content with Animation */}
        <div className="p-6 min-h-[400px]">
          <div className="animate-fadeIn">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PriceCalculator
        isOpen={showCalculatorModal}
        onClose={handleCalculatorClose}
      />

      <BulkOperations
        isOpen={showBulkModal}
        onClose={handleBulkClose}
        selectedServices={selectedServices}
        services={services}
        onSelectionChange={setSelectedServices}
      />
    </div>
  );
};

export default Services;
