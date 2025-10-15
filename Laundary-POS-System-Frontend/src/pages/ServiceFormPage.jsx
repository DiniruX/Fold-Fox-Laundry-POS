import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  useService,
  useCreateService,
  useUpdateService,
  useCalculateServicePrice,
  getPriceTypeLabel,
  getStatusLabel,
  getClothingCategoryLabel,
  serviceValidation,
} from '../services/serviceService';
import { SERVICE_PRICE_TYPES, SERVICE_STATUSES, CLOTHING_CATEGORIES } from '../constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ServiceFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    quantity: 1,
    weight: 0,
    clothingCategory: 'normal_clothes',
  });
  const [clothingPrices, setClothingPrices] = useState({});
  const [priceCalculation, setPriceCalculation] = useState(null);

  const isEditing = !!id;
  const title = isEditing ? 'Edit Service' : 'Create New Service';
  
  // Get duplicate data from navigation state
  const duplicateFrom = location.state?.duplicateFrom || null;

  // Fetch service if editing
  const { data: service, isLoading: isLoadingService } = useService(id);
  
  const steps = [
    { number: 1, title: 'Basic Info', description: 'Name & description' },
    { number: 2, title: 'Pricing', description: 'Set prices' },
    { number: 3, title: 'Configuration', description: 'Steps & settings' },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      priceType: 'per_piece',
      basePrice: 0,
      statuses: ['wash', 'dry'],
      clothingPrices: {},
      estimatedTime: 60,
      icon: '',
      color: '#3B82F6',
      isActive: true,
    },
  });

  const watchedPriceType = watch('priceType');
  const watchedBasePrice = watch('basePrice');

  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const calculatePriceMutation = useCalculateServicePrice();

  // Reset form when service or duplicate data changes
  useEffect(() => {
    const dataToLoad = service || duplicateFrom;
    if (dataToLoad) {
      const formData = {
        name: duplicateFrom ? `${dataToLoad.name} (Copy)` : (dataToLoad.name || ''),
        description: dataToLoad.description || '',
        priceType: dataToLoad.priceType || 'per_piece',
        basePrice: dataToLoad.basePrice || 0,
        statuses: dataToLoad.statuses || ['wash', 'dry'],
        clothingPrices: dataToLoad.clothingPrices || {},
        estimatedTime: dataToLoad.estimatedTime || 60,
        icon: dataToLoad.icon || '',
        color: dataToLoad.color || '#3B82F6',
        isActive: dataToLoad.isActive !== undefined ? dataToLoad.isActive : true,
      };
      reset(formData);
      setClothingPrices(dataToLoad.clothingPrices || {});
    } else {
      reset({
        name: '',
        description: '',
        priceType: 'per_piece',
        basePrice: 0,
        statuses: ['wash', 'dry'],
        clothingPrices: {},
        estimatedTime: 60,
        icon: '',
        color: '#3B82F6',
        isActive: true,
      });
      setClothingPrices({});
    }
  }, [service, duplicateFrom, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        clothingPrices: clothingPrices,
      };
      
      if (isEditing) {
        await updateServiceMutation.mutateAsync({
          id: service._id,
          data: submitData,
        });
      } else {
        await createServiceMutation.mutateAsync(submitData);
      }
      
      // Navigate back to services page on success
      navigate('/services');
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle price calculation
  const handleCalculatePrice = async () => {
    if (!watchedBasePrice || watchedBasePrice <= 0) {
      return;
    }

    try {
      const response = await calculatePriceMutation.mutateAsync({
        id: service?._id || 'temp', // For preview, we can use a temp ID
        data: calculatorData,
      });
      setPriceCalculation(response.data);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Update calculator when price type or base price changes
  useEffect(() => {
    if (showCalculator && watchedBasePrice && watchedBasePrice > 0) {
      handleCalculatePrice();
    }
  }, [watchedPriceType, watchedBasePrice, calculatorData]);

  // Handle status selection
  const handleStatusToggle = (status) => {
    const currentStatuses = watch('statuses') || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    setValue('statuses', newStatuses);
  };

  // Handle clothing price updates
  const handleClothingPriceUpdate = (category, price) => {
    const newPrices = { ...clothingPrices };
    if (price && price > 0) {
      newPrices[category] = parseFloat(price);
    } else {
      delete newPrices[category];
    }
    setClothingPrices(newPrices);
  };

  const isLoading = createServiceMutation.isPending || updateServiceMutation.isPending || isLoadingService;

  // Color options for service icons
  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', color: 'bg-blue-500' },
    { value: '#10B981', label: 'Green', color: 'bg-green-500' },
    { value: '#F59E0B', label: 'Orange', color: 'bg-orange-500' },
    { value: '#EF4444', label: 'Red', color: 'bg-red-500' },
    { value: '#8B5CF6', label: 'Purple', color: 'bg-purple-500' },
    { value: '#06B6D4', label: 'Cyan', color: 'bg-cyan-500' },
    { value: '#84CC16', label: 'Lime', color: 'bg-lime-500' },
    { value: '#F97316', label: 'Orange-600', color: 'bg-orange-600' },
  ];

  if (isLoadingService) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div 
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 100%)',
        }}
      >
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/services')}
                className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-white/70 mt-1">
                  {isEditing ? 'Update service details' : duplicateFrom ? 'Creating duplicate service' : 'Fill in the details to create a new service'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-8">
          {/* Step Progress Indicator */}
          <div className="border-b border-gray-200 pb-6 mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div 
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                        currentStep === step.number
                          ? 'text-white shadow-lg'
                          : currentStep > step.number
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      style={currentStep === step.number ? { backgroundColor: '#fe7f2d' } : {}}
                    >
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-xs font-semibold ${
                        currentStep === step.number ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded ${
                      currentStep > step.number ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-orange-200">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#fe7f2d' }}>
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    <p className="text-xs text-gray-500">Service name and description</p>
                  </div>
                </div>
                
                <div>
                  <Input
                    label="Service Name"
                    {...register('name', serviceValidation.name)}
                    error={errors.name?.message}
                    placeholder="e.g., Wash & Iron, Dry Cleaning"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Clear, descriptive name for your service</p>
                </div>

                <div>
                  <Input
                    label="Description"
                    {...register('description', serviceValidation.description)}
                    error={errors.description?.message}
                    placeholder="Describe what this service includes..."
                    type="textarea"
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-gray-500">Help customers understand what's included</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!watch('name')}
                    style={{ backgroundColor: '#fe7f2d', color: 'white' }}
                  >
                    Continue to Pricing →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Pricing Information */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-500">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pricing Configuration</h3>
                      <p className="text-xs text-gray-500">Set pricing model and rates</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ← Back
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Type
                    </label>
                    <select
                      {...register('priceType', serviceValidation.priceType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(SERVICE_PRICE_TYPES).map(([key, value]) => (
                        <option key={key} value={value}>
                          {getPriceTypeLabel(value)}
                        </option>
                      ))}
                    </select>
                    {errors.priceType && (
                      <p className="mt-1 text-sm text-red-600">{errors.priceType.message}</p>
                    )}
                  </div>
                </div>

                {/* Clothing Category Pricing (for both per_kg and per_piece pricing) */}
                {(watchedPriceType === 'per_piece' || watchedPriceType === 'per_kg') && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Clothing Category Pricing</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {watchedPriceType === 'per_kg' 
                        ? 'Set different prices per kilogram for different types of clothing items:'
                        : 'Set different prices per piece for different types of clothing items:'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(CLOTHING_CATEGORIES).map(([key, category]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getClothingCategoryLabel(category)} {watchedPriceType === 'per_kg' ? '(per kg)' : '(per piece)'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={clothingPrices[category] || ''}
                            onChange={(e) => handleClothingPriceUpdate(category, e.target.value)}
                            placeholder="Enter price"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the price for each clothing category. All categories must have a price set.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    style={{ backgroundColor: '#fe7f2d', color: 'white' }}
                  >
                    Continue to Configuration →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Service Configuration */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b-2 border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-purple-500">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Service Configuration</h3>
                      <p className="text-xs text-gray-500">Process steps and settings</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ← Back
                  </button>
                </div>

                {/* Service Statuses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Process Steps (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(SERVICE_STATUSES).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watch('statuses')?.includes(value) || false}
                          onChange={() => handleStatusToggle(value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{getStatusLabel(value)}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select the steps that are included in this service
                  </p>
                </div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Estimated Time (minutes)"
                      type="number"
                      min="1"
                      max="1440"
                      {...register('estimatedTime', serviceValidation.estimatedTime)}
                      error={errors.estimatedTime?.message}
                      placeholder="e.g., 60"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">How long does this service take?</p>
                  </div>

                  <div>
                    <Input
                      label="Icon (emoji or character)"
                      {...register('icon')}
                      placeholder="e.g., 🧺, 📦, ⚡"
                      maxLength={2}
                    />
                    <p className="mt-1 text-xs text-gray-500">Visual icon for this service</p>
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((colorOption) => (
                      <button
                        key={colorOption.value}
                        type="button"
                        onClick={() => setValue('color', colorOption.value)}
                        className={`w-10 h-10 rounded-xl ${colorOption.color} border-2 ${
                          watch('color') === colorOption.value ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-300'
                        } transition-all duration-200`}
                        title={colorOption.label}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Choose a color to identify this service</p>
                </div>

                {/* Active Status */}
                <div className="flex items-center p-4 border-2 border-gray-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-3 block text-sm font-semibold text-gray-900">
                    ✓ Service is active and available for orders
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-between pt-6 border-t-2 border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    ← Back to Pricing
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center space-x-2 shadow-lg"
                    style={{ backgroundColor: '#fe7f2d', color: 'white' }}
                  >
                    {isLoading && <LoadingSpinner size="sm" />}
                    <span>{isEditing ? '✓ Update Service' : '+ Create Service'}</span>
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceFormPage;

