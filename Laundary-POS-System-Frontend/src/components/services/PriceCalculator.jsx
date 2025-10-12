import React, { useState, useEffect } from 'react';
import { CalculatorIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import {
  useCalculateServicePrice,
  useServices,
  formatPrice,
  getPriceTypeLabel,
  getClothingCategoryLabel,
} from '../../services/serviceService';
import { CLOTHING_CATEGORIES } from '../../constants';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';

const PriceCalculator = ({ isOpen, onClose, service, onServiceSelect }) => {
  const [selectedService, setSelectedService] = useState(service);
  const [calculationData, setCalculationData] = useState({
    quantity: 1,
    weight: 0,
    clothingCategory: 'normal_clothes',
  });
  const [calculationResult, setCalculationResult] = useState(null);

  const calculatePriceMutation = useCalculateServicePrice();
  
  // Fetch real services from API
  const { data: servicesData, isLoading: servicesLoading } = useServices({
    page: 1,
    limit: 50,
  });
  
  const services = servicesData?.services || [];

  // Update calculation data when service changes
  useEffect(() => {
    if (selectedService) {
      setCalculationData({
        quantity: 1,
        weight: selectedService.priceType === 'per_kg' ? 1 : 0,
        clothingCategory: 'normal_clothes',
      });
    }
  }, [selectedService]);

  // Calculate price when inputs change
  useEffect(() => {
    if (selectedService && (calculationData.quantity > 0 || calculationData.weight > 0)) {
      handleCalculatePrice();
    }
  }, [selectedService, calculationData]);

  const handleCalculatePrice = async () => {
    if (!selectedService) return;

    try {
      const response = await calculatePriceMutation.mutateAsync({
        id: selectedService._id,
        data: calculationData,
      });
      
      // Handle different response structures
      if (response.data && response.data.data) {
        setCalculationResult(response.data.data);
      } else if (response.data) {
        setCalculationResult(response.data);
      } else {
        setCalculationResult(response);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleInputChange = (field, value) => {
    setCalculationData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    if (onServiceSelect) {
      onServiceSelect(service);
    }
  };

  const resetCalculator = () => {
    setCalculationData({
      quantity: 1,
      weight: selectedService?.priceType === 'per_kg' ? 1 : 0,
    });
    setCalculationResult(null);
  };

  // Show loading state while fetching services
  if (servicesLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Price Calculator" size="lg">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Price Calculator" size="xl">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
          <div 
            className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#fe7f2d' }}
          >
            <CalculatorIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Price Calculator</h2>
            <p className="text-sm text-gray-500 mt-1">
              Calculate pricing for different quantities and weights
            </p>
          </div>
        </div>

        {/* Service Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Select Service</h3>
          {services.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <div className="text-gray-400 text-4xl mb-2">🔧</div>
              <p className="text-sm font-medium text-gray-900">No services available</p>
              <p className="text-xs text-gray-500 mt-1">Please create some services first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {services.map((service) => (
              <button
                key={service._id}
                onClick={() => handleServiceSelect(service)}
                className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedService?._id === service._id
                    ? 'border-orange-500 bg-orange-50 shadow-lg ring-2 ring-orange-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: service.color || '#3B82F6' }}
                  >
                    <span className="text-white text-lg">
                      {service.icon || service.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{service.name}</div>
                  </div>
                </div>
                <div className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                  {formatPrice(service.basePrice, service.priceType)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getPriceTypeLabel(service.priceType)}
                </div>
              </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Fields */}
        {selectedService && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Enter Quantity/Weight</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
              {selectedService.priceType === 'per_kg' && (
                <div>
                  <Input
                    label="Weight (kg)"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={calculationData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                    placeholder="Enter weight in kg"
                  />
                </div>
              )}
              
              {selectedService.priceType === 'per_piece' && (
                <>
                  <div>
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={calculationData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clothing Category
                    </label>
                    <select
                      value={calculationData.clothingCategory}
                      onChange={(e) => setCalculationData(prev => ({ ...prev, clothingCategory: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(CLOTHING_CATEGORIES).map(([key, category]) => (
                        <option key={key} value={category}>
                          {getClothingCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={resetCalculator}
              >
                Reset
              </Button>
              <Button
                onClick={handleCalculatePrice}
                disabled={calculatePriceMutation.isPending}
                className="flex items-center space-x-2"
              >
                {calculatePriceMutation.isPending && <LoadingSpinner size="sm" />}
                <CalculatorIcon className="h-4 w-4" />
                <span>Calculate</span>
              </Button>
            </div>
          </div>
        )}

        {/* Enhanced Calculation Result */}
        {calculationResult && calculationResult.service && calculationResult.calculation && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Calculation Result</h3>
            </div>
            
            <div className="space-y-3 bg-white rounded-lg p-5">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600">Service:</span>
                <span className="text-sm font-bold text-gray-900">{calculationResult.service.name || 'Unknown Service'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600">Price Type:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {getPriceTypeLabel(calculationResult.service.priceType) || 'Unknown'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600">Unit Price:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPrice(calculationResult.calculation.unitPrice || 0, calculationResult.service.priceType || 'per_kg')}
                </span>
              </div>

              {calculationResult.service.priceType === 'per_piece' && (
                <div className="flex justify-between items-center py-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Quantity:</span>
                  <span className="text-sm font-bold text-gray-900">{calculationResult.calculation.quantity || 0} pieces</span>
                </div>
              )}

              {calculationResult.service.priceType === 'per_kg' && (
                <div className="flex justify-between items-center py-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Weight:</span>
                  <span className="text-sm font-bold text-gray-900">{calculationResult.calculation.weight || 0} kg</span>
                </div>
              )}

              <div className="flex justify-between items-center py-4 border-t-2 border-gray-300 mt-3">
                <span className="text-lg font-bold text-gray-900">Total Price:</span>
                <span className="text-3xl font-bold text-green-600">
                  LKR {calculationResult.calculation.totalPrice || 0}
                </span>
              </div>
            </div>

            {/* Enhanced Price Breakdown */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <span className="mr-2">📊</span> Calculation Breakdown
              </h4>
              <div className="text-sm font-medium text-gray-700">
                {calculationResult.service.priceType === 'per_kg' && (
                  <p>
                    {calculationResult.calculation.weight || 0} kg × LKR {calculationResult.calculation.unitPrice || 0} = <span className="text-green-600 font-bold">LKR {calculationResult.calculation.totalPrice || 0}</span>
                  </p>
                )}
                {calculationResult.service.priceType === 'per_piece' && (
                  <p>
                    {calculationResult.calculation.quantity || 0} pieces × LKR {calculationResult.calculation.unitPrice || 0} = <span className="text-green-600 font-bold">LKR {calculationResult.calculation.totalPrice || 0}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Quick Calculations */}
        {selectedService && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span> Quick Reference Prices
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedService.priceType === 'per_piece' && (
                <>
                  <div className="bg-white p-4 rounded-xl text-center border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">1 Piece</p>
                    <p className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                      LKR {selectedService.clothingPrices?.normal_clothes || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">Bed Sheets</p>
                    <p className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                      LKR {selectedService.clothingPrices?.bed_sheets || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">Suits</p>
                    <p className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                      LKR {selectedService.clothingPrices?.suits || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">Jeans</p>
                    <p className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                      LKR {selectedService.clothingPrices?.jeans || 'N/A'}
                    </p>
                  </div>
                </>
              )}
              
              {selectedService.priceType === 'per_kg' && (
                <>
                  <div className="bg-white p-4 rounded-xl text-center border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">1 kg</p>
                    <p className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                      LKR {selectedService.basePrice}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">5 kg</p>
                    <p className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                      LKR {(selectedService.basePrice * 5).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">10 kg</p>
                    <p className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                      LKR {(selectedService.basePrice * 10).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">20 kg</p>
                    <p className="text-lg font-bold" style={{ color: '#fe7f2d' }}>
                      LKR {(selectedService.basePrice * 20).toFixed(2)}
                    </p>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          {calculationResult && calculationResult.service && calculationResult.calculation && (
            <Button
              onClick={() => {
                // Copy to clipboard or export functionality
                const serviceName = calculationResult.service.name || 'Unknown Service';
                const totalPrice = calculationResult.calculation.totalPrice || 0;
                navigator.clipboard?.writeText(`Service: ${serviceName}, Total: LKR ${totalPrice}`);
              }}
            >
              Copy Result
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PriceCalculator;
