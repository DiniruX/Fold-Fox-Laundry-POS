import React, { useState } from 'react';
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import RevenueReport from '../components/reports/RevenueReport';
import OrderStatusReport from '../components/reports/OrderStatusReport';
import CustomerReport from '../components/reports/CustomerReport';
import ServiceReport from '../components/reports/ServiceReport';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('revenue');

  const tabs = [
    {
      id: 'revenue',
      name: 'Revenue',
      icon: ChartBarIcon,
      component: RevenueReport,
    },
    {
      id: 'orders',
      name: 'Order Status',
      icon: ClipboardDocumentCheckIcon,
      component: OrderStatusReport,
    },
    {
      id: 'customers',
      name: 'Customers',
      icon: UsersIcon,
      component: CustomerReport,
    },
    {
      id: 'services',
      name: 'Services',
      icon: WrenchScrewdriverIcon,
      component: ServiceReport,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div 
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 100%)',
        }}
      >
        <div className="px-8 py-6">
          <div className="flex items-center space-x-4">
            <div 
              className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#fe7f2d' }}
            >
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
              <p className="text-white/70 mt-1">
                View comprehensive reports and analytics for your laundry business
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="border-b border-gray-100" style={{ backgroundColor: '#fafbfc' }}>
          <nav className="flex flex-wrap px-6 space-x-1" aria-label="Tabs">
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
                  <Icon className={`h-5 w-5 ${isActive ? 'text-orange-500' : ''}`} aria-hidden="true" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Report Component with Animation */}
        <div className="p-6 min-h-[500px]">
          <div className="animate-fadeIn">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

