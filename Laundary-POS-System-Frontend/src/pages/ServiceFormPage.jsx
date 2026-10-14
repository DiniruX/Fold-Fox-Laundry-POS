import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  useService,
  useCreateService,
  useUpdateService,
  useClothingCategories,
  useCreateClothingCategory,
  useDeleteClothingCategory,
  getStatusLabel,
  serviceValidation,
} from '../services/serviceService';
import { SERVICE_STATUSES } from '../constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ServiceFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [clothingPrices, setClothingPrices] = useState({});
  const [clothingPriceTypes, setClothingPriceTypes] = useState({}); // New: priceType per category
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { categories: clothingCategories } = useClothingCategories();
  const createCategoryMutation = useCreateClothingCategory();
  const deleteCategoryMutation = useDeleteClothingCategory();

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
      statuses: ['wash', 'dry'],
      clothingPrices: {},
      estimatedTime: 60,
      icon: '',
      color: '#3B82F6',
      isActive: true,
    },
  });

  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();

  // Reset form when service or duplicate data changes
  useEffect(() => {
    const dataToLoad = service || duplicateFrom;
    // Price types only matter for categories that get a price; untouched ones fall back to per_piece in the UI
    const defaultPriceTypes = {};

    if (dataToLoad) {
      const formData = {
        name: duplicateFrom ? `${dataToLoad.name} (Copy)` : (dataToLoad.name || ''),
        description: dataToLoad.description || '',
        statuses: dataToLoad.statuses || ['wash', 'dry'],
        clothingPrices: dataToLoad.clothingPrices || {},
        estimatedTime: dataToLoad.estimatedTime || 60,
        icon: dataToLoad.icon || '',
        color: dataToLoad.color || '#3B82F6',
        isActive: dataToLoad.isActive !== undefined ? dataToLoad.isActive : true,
      };
      reset(formData);
      setClothingPrices(dataToLoad.clothingPrices || {});
      // Convert Map to Object if necessary
      let priceTypesObj = dataToLoad.clothingPriceTypes;
      if (dataToLoad.clothingPriceTypes instanceof Map) {
        priceTypesObj = Object.fromEntries(dataToLoad.clothingPriceTypes);
      }
      setClothingPriceTypes({ ...defaultPriceTypes, ...(priceTypesObj || {}) });
    } else {
      reset({
        name: '',
        description: '',
        statuses: ['wash', 'dry'],
        clothingPrices: {},
        estimatedTime: 60,
        icon: '',
        color: '#3B82F6',
        isActive: true,
      });
      setClothingPrices({});
      setClothingPriceTypes(defaultPriceTypes);
    }
  }, [service, duplicateFrom, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const priceValues = Object.values(clothingPrices || {});
      const basePrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;

      // Every priced category needs a priceType; the select shows per_piece when none was chosen
      const pricedCategoryTypes = Object.keys(clothingPrices || {}).reduce((acc, category) => {
        acc[category] = clothingPriceTypes[category] || 'per_piece';
        return acc;
      }, {});
      const legacyPriceType = Object.values(pricedCategoryTypes)[0] || 'per_piece';

      const submitData = {
        ...data,
        priceType: legacyPriceType,
        basePrice,
        clothingPrices: clothingPrices,
        clothingPriceTypes: pricedCategoryTypes, // Include category-specific priceTypes
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
    const parsedPrice = price === '' ? NaN : parseFloat(price);
    if (!Number.isNaN(parsedPrice) && parsedPrice >= 0) {
      newPrices[category] = parsedPrice;
    } else {
      delete newPrices[category];
      // Also remove priceType if price is removed
      const newPriceTypes = { ...clothingPriceTypes };
      delete newPriceTypes[category];
      setClothingPriceTypes(newPriceTypes);
    }
    setClothingPrices(newPrices);
  };

  // Handle clothing priceType updates
  const handleClothingPriceTypeUpdate = (category, priceType) => {
    const newPriceTypes = { ...clothingPriceTypes };
    if (priceType) {
      newPriceTypes[category] = priceType;
    } else {
      delete newPriceTypes[category];
    }
    setClothingPriceTypes(newPriceTypes);
  };

  // Add a custom clothing category (shared across all services)
  const handleAddCategory = async () => {
    const label = newCategoryName.trim();
    if (label.length < 2) return;
    try {
      await createCategoryMutation.mutateAsync(label);
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      // Error toast shown by mutation
    }
  };

  const handleDeleteCategory = (category) => {
    // The backend refuses if any saved service still has a price for this category
    if (!window.confirm(`Delete the "${category.label}" category? This removes it for all services.`)) return;
    deleteCategoryMutation.mutate(category.key);
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

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Clothing Category Pricing</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Set different prices and price types (per kg or per piece) for each clothing category. At least one category must have pricing before continuing.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clothingCategories.map(({ key: category, label, isCustom }) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            {label}
                            {isCustom && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-100 text-orange-700 align-middle">
                                CUSTOM
                              </span>
                            )}
                          </label>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory({ key: category, label })}
                              disabled={deleteCategoryMutation.isPending}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title={`Delete "${label}" category`}
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {/* Price Type Selector */}
                        <select
                          value={clothingPriceTypes[category] || 'per_piece'}
                          onChange={(e) => handleClothingPriceTypeUpdate(category, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="per_piece">Per Piece</option>
                          <option value="per_kg">Per Kilogram</option>
                        </select>
                        {/* Price Input */}
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={clothingPrices[category] ?? ''}
                          onChange={(e) => handleClothingPriceUpdate(category, e.target.value)}
                          placeholder={`Enter price (${(clothingPriceTypes[category] || 'per_piece') === 'per_kg' ? 'per kg' : 'per piece'})`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Add custom category */}
                  <div className="mt-4">
                    {showAddCategory ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={newCategoryName}
                          maxLength={40}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCategory();
                            } else if (e.key === 'Escape') {
                              setShowAddCategory(false);
                              setNewCategoryName('');
                            }
                          }}
                          placeholder="New category name, e.g. Wedding Dress"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={newCategoryName.trim().length < 2 || createCategoryMutation.isPending}
                            className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: '#fe7f2d' }}
                          >
                            {createCategoryMutation.isPending ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCategory(false);
                              setNewCategoryName('');
                            }}
                            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddCategory(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Add custom category
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Select price type (per kg or per piece) and enter the price for each clothing category you offer.
                    Custom categories are shared across all services.
                  </p>
                </div>
                
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
                    disabled={Object.keys(clothingPrices).length === 0}
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
                    disabled={isLoading || Object.keys(clothingPrices).length === 0}
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

