import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useCreateOrder, useUpdateOrder, useOrder, usePricingConfig, calculateMinimumOrderAdjustment } from '../services/orderService';
import customerService from '../services/customerService';
import { toDateKey, addDays } from '../services/deliveryService';
import {
  getClothingCategoryLabel,
  useClothingCategories,
  useServices,
  getServicePricingLabel,
  getServiceMinPrice,
} from '../services/serviceService';
import { useExtraItems } from '../services/extraItemService';
import { useActiveDiscounts, calculateDiscountAmount } from '../services/discountService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CustomerSearch from '../components/orders/CustomerSearch';
import SearchSelect from '../components/ui/SearchSelect';
import CustomerRecentOrders from '../components/orders/CustomerRecentOrders';
import OrderExtrasSelector from '../components/orders/OrderExtrasSelector';
import OrderDiscountSelector from '../components/orders/OrderDiscountSelector';
import OrderSummaryPanel from '../components/orders/OrderSummaryPanel';

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

const OrderFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isExpressService, setIsExpressService] = useState(false);
  // Extras (hangers, bags, ...) keyed by catalog item id → quantity
  const [extraQuantities, setExtraQuantities] = useState({});
  // 'auto' = customer's own discount, 'none' = explicitly none, or a promotion id
  const [discountChoice, setDiscountChoice] = useState('auto');
  const { categories: clothingCategories } = useClothingCategories();

  // Server pricing rules (minimum order amount, express fee)
  const { pricing } = usePricingConfig();

  // Add-on catalog and live offers for the selected customer
  const { data: extraItemsData } = useExtraItems();
  const extraItems = extraItemsData?.items || [];
  const { data: offersData, isLoading: isLoadingOffers } = useActiveDiscounts(selectedCustomer?._id);
  const liveDiscounts = offersData?.discounts || [];
  const customerDiscount = offersData?.customerDiscount || null;

  // Ref to track if we just loaded an order to prevent overwriting order-specific addresses
  const isSettingUpOrderRef = useRef(false);
  // Discount choice the order was loaded with (edit mode) so an untouched
  // choice is left to the server to re-price, even if the offer has since ended
  const loadedDiscountChoiceRef = useRef(null);

  const isEditing = !!id;
  const title = isEditing ? 'Edit Order' : 'Create New Order';
  
  // Get pre-selected customer (and optionally an order to repeat) from navigation state
  const preSelectedCustomer = location.state?.preSelectedCustomer || null;
  const reorderFrom = location.state?.reorderFrom || null;

  // Fetch order if editing
  const { data: orderData, isLoading: isLoadingOrder, error: orderError } = useOrder(id);
  const order = orderData?.order || null;
  
  const steps = [
    { number: 1, title: 'Customer', description: 'Select customer' },
    { number: 2, title: 'Services', description: 'Add order items' },
    { number: 3, title: 'Delivery', description: 'Pickup & delivery options' },
  ];

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerId: '',
      items: [
        {
          serviceId: '',
          quantity: 1,
          weight: 0,
          clothingCategory: 'normal_clothes',
          notes: '',
        },
      ],
      pickupRequired: false,
      pickupAddress: {
        street: '',
        city: '',
        notes: '',
      },
      pickupPriceType: 'free',
      pickupCharges: 0,
      deliveryRequired: false,
      deliveryAddress: {
        street: '',
        city: '',
        notes: '',
      },
      deliveryPriceType: 'free',
      deliveryCharges: 0,
      deliveryDistance: 0,
      expectedDeliveryDate: '',
      specialInstructions: '',
      tags: [],
      isExpressService: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedPickupRequired = watch('pickupRequired');
  const watchedDeliveryRequired = watch('deliveryRequired');

  // Suggest tomorrow as the delivery date the moment delivery is switched on
  useEffect(() => {
    if (watchedDeliveryRequired && !watch('expectedDeliveryDate')) {
      setValue('expectedDeliveryDate', toDateKey(addDays(new Date(), 1)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedDeliveryRequired]);

  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();

  // Fetch services for dropdown (only active ones can be ordered)
  const { data: servicesResponse } = useServices({ isActive: 'true', limit: 100 });
  const services = (servicesResponse?.services || []).filter((s) => s.isActive !== false);

  // Options for the searchable service picker
  const serviceOptions = useMemo(() => services.map((service) => {
    let pricesObj = service.clothingPrices;
    if (pricesObj instanceof Map) pricesObj = Object.fromEntries(pricesObj);
    const categoryCount = Object.values(pricesObj || {}).filter((p) => Number(p) > 0).length;
    return {
      value: service._id,
      label: service.name,
      description: categoryCount > 0
        ? `From LKR ${getServiceMinPrice(service)} · ${getServicePricingLabel(service)} · ${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'}`
        : 'No prices set',
      keywords: service.description || '',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [services]);

  // Services loaded after the form (edit mode): make sure every line's
  // category is one its service actually prices
  useEffect(() => {
    if (services.length === 0) return;
    fields.forEach((_, index) => {
      const service = services.find((s) => s._id === watch(`items.${index}.serviceId`));
      if (service) ensureValidCategory(index, service);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.length, fields.length]);

  // Handle pre-selected customer
  useEffect(() => {
    if (preSelectedCustomer && !order) {
      setSelectedCustomer(preSelectedCustomer);
      setValue('customerId', preSelectedCustomer._id);
      if (reorderFrom) applyReorder(reorderFrom);
      // Auto-advance to step 2 since customer is pre-selected
      setCurrentStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedCustomer, order, setValue]);

  // Copy the items (and hangers/extras) of a previous order into this form
  const applyReorder = (source) => {
    const items = (source.items || [])
      .filter((item) => item.service)
      .map((item) => ({
        serviceId: item.service?._id || item.service,
        quantity: item.quantity || 1,
        weight: item.weight || 0,
        clothingCategory: item.clothingCategory || 'normal_clothes',
        notes: item.notes || '',
      }));
    if (items.length > 0) setValue('items', items);
    const extras = {};
    (source.extraCharges?.items || []).forEach((line) => {
      if (line.id && isObjectId(line.id)) extras[line.id] = (extras[line.id] || 0) + (Number(line.quantity) || 0);
    });
    setExtraQuantities(extras);
    setValue('specialInstructions', source.specialInstructions || '');
    setDiscountChoice('auto');
  };

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      // Set flag to prevent address overwriting during order setup
      isSettingUpOrderRef.current = true;
      
      reset({
        customerId: order.customer?._id || '',
        items: order.items?.map(item => ({
          serviceId: item.service?._id || '',
          quantity: item.quantity || 1,
          weight: item.weight || 0,
          clothingCategory: item.clothingCategory || 'normal_clothes',
          notes: item.notes || '',
        })) || [],
        pickupRequired: order.pickupRequired || false,
        pickupAddress: order.pickupAddress ? {
          street: order.pickupAddress.street || '',
          city: order.pickupAddress.city || '',
          notes: order.pickupAddress.notes || '',
        } : {
          street: '',
          city: '',
          notes: '',
        },
        pickupPriceType: order.pickupCharges > 0 ? 'price' : 'free',
        pickupCharges: order.pickupCharges || 0,
        deliveryRequired: order.deliveryRequired || false,
        deliveryAddress: order.deliveryAddress ? {
          street: order.deliveryAddress.street || '',
          city: order.deliveryAddress.city || '',
          notes: order.deliveryAddress.notes || '',
        } : {
          street: '',
          city: '',
          notes: '',
        },
        deliveryPriceType: order.deliveryCharges > 0 ? 'price' : 'free',
        deliveryCharges: order.deliveryCharges || 0,
        deliveryDistance: order.deliveryDistance || 0,
        expectedDeliveryDate: order.expectedDeliveryDate ? toDateKey(order.expectedDeliveryDate) : '',
        specialInstructions: order.specialInstructions || '',
        tags: order.tags || [],
        isExpressService: order.isExpressService || false,
      });
      setSelectedCustomer(order.customer);
      setIsExpressService(order.isExpressService || false);

      // Restore extras and the discount choice the order was saved with
      const savedExtras = {};
      (order.extraCharges?.items || []).forEach((line) => {
        if (line.id && isObjectId(line.id)) {
          savedExtras[line.id] = (savedExtras[line.id] || 0) + (Number(line.quantity) || 0);
        }
      });
      setExtraQuantities(savedExtras);
      let loadedChoice = 'auto';
      if (order.discount?.source === 'promotion' && order.discount?.promotion) {
        loadedChoice = String(order.discount.promotion?._id || order.discount.promotion);
      } else if (order.discount?.source === 'manual_none') {
        loadedChoice = 'none';
      }
      loadedDiscountChoiceRef.current = loadedChoice;
      setDiscountChoice(loadedChoice);

      // Reset flag after a short delay to allow form to settle
      setTimeout(() => {
        isSettingUpOrderRef.current = false;
      }, 100);
    } else if (!preSelectedCustomer) {
      reset({
        customerId: '',
        items: [
          {
            serviceId: '',
            quantity: 1,
            weight: 0,
            clothingCategory: 'normal_clothes',
            notes: '',
          },
        ],
        pickupRequired: false,
        pickupAddress: {
          street: '',
          city: '',
          notes: '',
        },
        pickupPriceType: 'free',
        pickupCharges: 0,
        deliveryRequired: false,
        deliveryAddress: {
          street: '',
          city: '',
          notes: '',
        },
        deliveryPriceType: 'free',
        deliveryCharges: 0,
        deliveryDistance: 0,
        expectedDeliveryDate: '',
        specialInstructions: '',
        tags: [],
        isExpressService: false,
      });
      setSelectedCustomer(null);
      setIsExpressService(false);
      setExtraQuantities({});
      setDiscountChoice('auto');
      loadedDiscountChoiceRef.current = null;
      setCurrentStep(1);
    }
  }, [order, preSelectedCustomer, reset, setValue]);

  // A promotion picked for one customer may not apply to another
  useEffect(() => {
    if (!isObjectId(discountChoice) || !offersData || isLoadingOffers) return;
    if (discountChoice === loadedDiscountChoiceRef.current) return; // untouched on edit
    const stillValid = liveDiscounts.some((d) => d._id === discountChoice && d.eligible !== false);
    if (!stillValid) setDiscountChoice('auto');
  }, [discountChoice, offersData, isLoadingOffers, liveDiscounts]);

  // Auto-populate address when customer is selected
  useEffect(() => {
    if (!selectedCustomer || !selectedCustomer._id) {
      return;
    }

    // Bug 2 Fix: Don't overwrite addresses when setting up an order for editing
    if (isSettingUpOrderRef.current) {
      return;
    }

    // Bug 2 Fix: Check if addresses are already populated (from order) before overwriting
    const currentPickupStreet = watch('pickupAddress.street');
    const currentDeliveryStreet = watch('deliveryAddress.street');
    
    // If editing and addresses are already populated, don't overwrite with customer address
    if (isEditing && (currentPickupStreet || currentDeliveryStreet)) {
      return;
    }

    // Helper function to map customer address to form structure
    const mapAddressToForm = (address) => ({
      street: address.street || '',
      city: address.city || '',
      notes: '', // Customer address doesn't have notes, so default to empty string
    });

    // Bug 1 Fix: If customer has address, use it directly
    if (selectedCustomer.address) {
      const address = selectedCustomer.address;
      const pickupAddress = mapAddressToForm(address);
      const deliveryAddress = mapAddressToForm(address);
      setValue('pickupAddress', pickupAddress);
      setValue('deliveryAddress', deliveryAddress);
      return;
    }

    // Bug 1 Fix: Fetch full customer details if address is missing
    const fetchCustomerAddress = async () => {
      try {
        const response = await customerService.getCustomerById(selectedCustomer._id);
        if (response.success && response.customer) {
          const fullCustomer = response.customer;
          
          // Update selectedCustomer with full details
          setSelectedCustomer(fullCustomer);
          
          // Populate address if available
          if (fullCustomer.address) {
            const address = fullCustomer.address;
            const pickupAddress = mapAddressToForm(address);
            const deliveryAddress = mapAddressToForm(address);
            setValue('pickupAddress', pickupAddress);
            setValue('deliveryAddress', deliveryAddress);
          }
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
        // Continue without address if fetch fails
      }
    };

    fetchCustomerAddress();
  }, [selectedCustomer?._id, isEditing, setValue]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        items: data.items.map(item => ({
          serviceId: item.serviceId,
          quantity: item.quantity ? parseInt(item.quantity) : 1,
          weight: item.weight ? parseFloat(item.weight) : 0,
          clothingCategory: item.clothingCategory,
          notes: item.notes,
        })),
        // Explicitly convert to boolean to ensure proper type
        pickupRequired: Boolean(data.pickupRequired),
        // Explicitly handle 0 values (free pickup) - parseFloat allows 0 to pass through
        pickupCharges: (data.pickupCharges !== undefined && data.pickupCharges !== null) 
          ? parseFloat(data.pickupCharges) 
          : 0,
        deliveryRequired: Boolean(data.deliveryRequired),
        // Explicitly handle 0 values (free delivery) - parseFloat allows 0 to pass through
        deliveryCharges: (data.deliveryCharges !== undefined && data.deliveryCharges !== null)
          ? parseFloat(data.deliveryCharges)
          : 0,
        deliveryDistance: (data.deliveryDistance !== undefined && data.deliveryDistance !== null)
          ? parseFloat(data.deliveryDistance)
          : 0,
        isExpressService: Boolean(isExpressService),
        expectedDeliveryDate: data.deliveryRequired && data.expectedDeliveryDate ? data.expectedDeliveryDate : null,
        // Extras are priced server-side from the catalog; only ids + counts are sent
        extraItems: Object.entries(extraQuantities)
          .filter(([, qty]) => Number(qty) > 0)
          .map(([itemId, quantity]) => ({ itemId, quantity: parseInt(quantity, 10) })),
        // On edit, an untouched discount choice is omitted so the server keeps
        // re-pricing whatever the order already had
        ...(isEditing && discountChoice === loadedDiscountChoiceRef.current
          ? {}
          : {
            ...(isObjectId(discountChoice) ? { discountId: discountChoice } : {}),
            noDiscount: discountChoice === 'none',
          }),
      };

      console.log('[OrderForm] Submitting order with:', {
        pickupRequired: submitData.pickupRequired,
        deliveryRequired: submitData.deliveryRequired,
        pickupRequiredType: typeof submitData.pickupRequired,
      });

      // Only use existing customer - customerId is required
      if (!data.customerId) {
        throw new Error('Please select a customer');
      }

      if (isEditing) {
        await updateOrderMutation.mutateAsync({
          id: order._id,
          data: submitData,
        });
      } else {
        await createOrderMutation.mutateAsync(submitData);
      }
      
      // Navigate back to orders page on success
      navigate('/orders');
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Add new item
  const addItem = () => {
    append({
      serviceId: '',
      quantity: 1,
      weight: 0,
      clothingCategory: 'normal_clothes',
      notes: '',
    });
  };

  // Remove item
  const removeItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Get service details for pricing calculation
  const getServiceDetails = (serviceId) => {
    return services.find(service => service._id === serviceId);
  };

  // Clothing categories a service actually has a price for (Map or plain object)
  const getServiceCategoryKeys = (service) => {
    if (!service) return [];
    let pricesObj = service.clothingPrices;
    if (pricesObj instanceof Map) pricesObj = Object.fromEntries(pricesObj);
    return Object.entries(pricesObj || {})
      .filter(([, price]) => Number(price) > 0)
      .map(([key]) => key);
  };

  // Dropdown options for one item: only categories priced on that service,
  // in catalog order, with a readable label even for keys not in the catalog
  const getCategoryOptionsForService = (service) => {
    const keys = getServiceCategoryKeys(service);
    if (keys.length === 0) return [];
    const known = clothingCategories.filter((c) => keys.includes(c.key));
    const knownKeys = new Set(known.map((c) => c.key));
    const extra = keys.filter((k) => !knownKeys.has(k)).map((key) => ({ key, label: getClothingCategoryLabel(key) }));
    return [...known, ...extra];
  };

  // Keep the selected category valid for the chosen service
  const ensureValidCategory = (index, service) => {
    const keys = getServiceCategoryKeys(service);
    if (keys.length === 0) return;
    const current = watch(`items.${index}.clothingCategory`);
    if (!keys.includes(current)) {
      const fallback = keys.includes('normal_clothes') ? 'normal_clothes' : keys[0];
      setValue(`items.${index}.clothingCategory`, fallback);
    }
  };

  // Helper function to get category-specific priceType (with fallback)
  const getCategoryPriceType = (service, category) => {
    if (!service || !category) return service?.priceType || 'per_piece';
    
    // Check if clothingPriceTypes exists and has the category
    let priceTypesObj = service.clothingPriceTypes;
    if (service.clothingPriceTypes instanceof Map) {
      priceTypesObj = Object.fromEntries(service.clothingPriceTypes);
    }
    
    if (priceTypesObj && priceTypesObj[category]) {
      return priceTypesObj[category];
    }
    
    // Fallback to legacy priceType
    return service.priceType || 'per_piece';
  };

  const isLoading = createOrderMutation.isPending || updateOrderMutation.isPending || isLoadingOrder;

  // Live price for one order line (mirrors the server's pricing rules)
  const getItemTotal = (item) => {
    const service = getServiceDetails(item?.serviceId);
    if (!service) return 0;
    const category = item.clothingCategory || 'normal_clothes';
    const priceType = getCategoryPriceType(service, category);
    const unitPrice = Number(service.clothingPrices?.get?.(category) ?? service.clothingPrices?.[category] ?? 0);
    const qty = priceType === 'per_kg' ? (parseFloat(item.weight) || 0) : (parseInt(item.quantity, 10) || 0);
    return unitPrice * qty;
  };

  // Running totals for the summary panel
  const watchedItems = watch('items') || [];
  const watchedPickupCharges = watch('pickupCharges');
  const watchedDeliveryCharges = watch('deliveryCharges');

  const totals = useMemo(() => {
    const subtotal = watchedItems.reduce((sum, item) => sum + getItemTotal(item), 0);

    const extrasLines = extraItems
      .filter((item) => Number(extraQuantities[item._id]) > 0)
      .map((item) => ({
        id: item._id,
        name: item.name,
        quantity: Number(extraQuantities[item._id]),
        price: item.price,
        total: item.price * Number(extraQuantities[item._id]),
      }));
    const extrasTotal = extrasLines.reduce((sum, line) => sum + line.total, 0);

    let discountAmount = 0;
    let discountLabel = '';
    if (discountChoice === 'none') {
      discountLabel = '';
    } else if (isObjectId(discountChoice)) {
      const promo = liveDiscounts.find((d) => d._id === discountChoice);
      if (promo) {
        discountAmount = calculateDiscountAmount(promo, subtotal);
        discountLabel = promo.name;
      } else if (order?.discount?.promotion && String(order.discount.promotion?._id || order.discount.promotion) === discountChoice) {
        // Offer no longer listed (ended) but kept on this order: estimate from the saved rate
        discountAmount = Math.round(((subtotal * (Number(order.discount.percentage) || 0)) / 100) * 100) / 100;
        discountLabel = order.discount.description;
      }
    } else if (customerDiscount?.percentage > 0) {
      discountAmount = Math.round(((subtotal * customerDiscount.percentage) / 100) * 100) / 100;
      discountLabel = customerDiscount.description;
    }

    const expressFee = isExpressService ? pricing.expressServiceFee : 0;
    const pickupCharges = watchedPickupRequired ? (parseFloat(watchedPickupCharges) || 0) : 0;
    const deliveryCharges = watchedDeliveryRequired ? (parseFloat(watchedDeliveryCharges) || 0) : 0;
    const baseTotal = Math.max(0, subtotal + extrasTotal + expressFee + pickupCharges + deliveryCharges - discountAmount);
    const minimumTopUp = calculateMinimumOrderAdjustment(baseTotal, pricing.minimumOrderAmount);

    return {
      subtotal,
      extrasLines,
      extrasTotal,
      discountAmount,
      discountLabel,
      expressFee,
      pickupCharges,
      deliveryCharges,
      minimumTopUp,
      minimumOrderAmount: pricing.minimumOrderAmount,
      total: Math.round((baseTotal + minimumTopUp) * 100) / 100,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(watchedItems), services, extraItems, extraQuantities, discountChoice,
    liveDiscounts, customerDiscount, isExpressService, watchedPickupRequired, watchedDeliveryRequired,
    watchedPickupCharges, watchedDeliveryCharges, order, pricing.minimumOrderAmount, pricing.expressServiceFee,
  ]);

  // Show loading state when fetching order for editing
  if (isLoadingOrder) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle error when fetching order for editing
  if (isEditing && orderError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-4">{orderError?.response?.data?.message || orderError?.message || 'Failed to fetch order details'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Handle order not found when editing
  if (isEditing && !order && !isLoadingOrder) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're trying to edit doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            ← Back to Orders
          </button>
        </div>
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
                onClick={() => navigate('/orders')}
                className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-white/70 mt-1">
                  {isEditing ? 'Update order details' : 'Fill in the details to create a new order'}
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
            {/* Step 1: Customer Selection */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-orange-200">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#fe7f2d' }}>
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Select Customer</h3>
                    <p className="text-xs text-gray-500">Choose the customer for this order</p>
                  </div>
                </div>
            
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Customer</label>
                  <CustomerSearch
                    onSelectCustomer={async (customer) => {
                      if (customer) {
                        setSelectedCustomer(customer);
                        setValue('customerId', customer._id || '');
                        
                        // Bug 1 Fix: Fetch full customer details if address is missing
                        if (!customer.address && customer._id) {
                          try {
                            const response = await customerService.getCustomerById(customer._id);
                            if (response.success && response.customer) {
                              const fullCustomer = response.customer;
                              setSelectedCustomer(fullCustomer);
                              // Address population will be handled by the useEffect
                            }
                          } catch (error) {
                            console.error('Error fetching customer details:', error);
                          }
                        }
                      } else {
                        setSelectedCustomer(null);
                        setValue('customerId', '');
                      }
                    }}
                    selectedCustomer={selectedCustomer}
                  />
                  {!selectedCustomer && (
                    <p className="mt-2 text-sm text-red-600">⚠️ Please select a customer to continue</p>
                  )}
                  {selectedCustomer && (
                    <div className="mt-4 space-y-3">
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-green-900">✓ Customer Selected</p>
                            <p className="text-xs text-green-700 mt-1">
                              {selectedCustomer.fullName} • {selectedCustomer.phoneNumber}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-4 py-2 text-sm font-medium rounded-lg text-white shadow-sm hover:shadow-md transition-all"
                            style={{ backgroundColor: '#fe7f2d' }}
                          >
                            Continue →
                          </button>
                        </div>
                      </div>
                      {!isEditing && (
                        <CustomerRecentOrders
                          customerId={selectedCustomer._id}
                          onReorder={(source) => {
                            applyReorder(source);
                            setCurrentStep(2);
                          }}
                        />
                      )}
                      {selectedCustomer.isStudent && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xl animate-fadeIn">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-xl">🎓</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-blue-900">Student Discount Available!</p>
                              <p className="text-xs text-blue-700 mt-1">
                                This customer will receive a <span className="font-bold">10% discount</span> on their order total
                              </p>
                              {selectedCustomer.campusId && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Campus ID: {selectedCustomer.campusId}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Service Selection */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-500">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Add Services</h3>
                      <p className="text-xs text-gray-500">Select laundry services and quantities</p>
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

                {/* Order Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Service Items</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {fields.map((field, index) => {
                      const service = getServiceDetails(watch(`items.${index}.serviceId`));
                      return (
                        <div key={field.id} className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-blue-300 transition-colors">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-900">Item {index + 1}</h4>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <Controller
                                control={control}
                                name={`items.${index}.serviceId`}
                                rules={{ required: 'Service is required' }}
                                render={({ field }) => (
                                  <SearchSelect
                                    label="Service"
                                    required
                                    placeholder="Search services..."
                                    value={field.value}
                                    options={serviceOptions}
                                    error={errors.items?.[index]?.serviceId?.message}
                                    onChange={(serviceId) => {
                                      field.onChange(serviceId);
                                      const selectedService = services.find(s => s._id === serviceId);
                                      if (selectedService) {
                                        // Only categories priced on this service are selectable
                                        ensureValidCategory(index, selectedService);
                                        const currentCategory = watch(`items.${index}.clothingCategory`) || 'normal_clothes';
                                        const categoryPriceType = getCategoryPriceType(selectedService, currentCategory);
                                        // Reset weight/quantity when service changes
                                        setValue(`items.${index}.weight`, 0);
                                        setValue(`items.${index}.quantity`, 1);
                                        if (categoryPriceType !== 'per_kg') setValue(`items.${index}.weight`, 0);
                                      }
                                    }}
                                  />
                                )}
                              />
                            </div>

                            {(() => {
                              const selectedCategory = watch(`items.${index}.clothingCategory`) || 'normal_clothes';
                              const categoryPriceType = service ? getCategoryPriceType(service, selectedCategory) : 'per_piece';
                              
                              return categoryPriceType === 'per_kg' ? (
                                <div>
                                  <Input
                                    label="Weight (kg)"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    {...register(`items.${index}.weight`, {
                                      required: 'Weight is required',
                                      min: { value: 0.1, message: 'Weight must be at least 0.1 kg' },
                                      valueAsNumber: true
                                    })}
                                    error={errors.items?.[index]?.weight?.message}
                                    placeholder="Enter weight in kg"
                                    required
                                  />
                                </div>
                              ) : (
                                <div>
                                  <Input
                                    label="Quantity"
                                    type="number"
                                    min="1"
                                    {...register(`items.${index}.quantity`, {
                                      required: 'Quantity is required',
                                      min: { value: 1, message: 'Quantity must be at least 1' },
                                      valueAsNumber: true
                                    })}
                                    error={errors.items?.[index]?.quantity?.message}
                                    placeholder="1"
                                    required
                                  />
                                </div>
                              );
                            })()}

                            {service && getCategoryOptionsForService(service).length === 0 && (
                              <div className="lg:col-span-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                This service has no clothing category prices yet, so it can’t be ordered. Add prices under Management → Services.
                              </div>
                            )}

                            {service && getCategoryOptionsForService(service).length > 0 && (
                              <div className="lg:col-span-3">
                                <Controller
                                  control={control}
                                  name={`items.${index}.clothingCategory`}
                                  render={({ field }) => (
                                    <SearchSelect
                                      label="Clothing Category"
                                      placeholder="Search categories..."
                                      allowClear={false}
                                      helperText={`${getCategoryOptionsForService(service).length} categor${getCategoryOptionsForService(service).length === 1 ? 'y' : 'ies'} priced for this service`}
                                      value={field.value}
                                      options={getCategoryOptionsForService(service).map(({ key, label }) => {
                                        const price = Number(service.clothingPrices?.get?.(key) ?? service.clothingPrices?.[key] ?? 0);
                                        const type = getCategoryPriceType(service, key);
                                        return { value: key, label, badge: `LKR ${price}/${type === 'per_kg' ? 'kg' : 'pc'}` };
                                      })}
                                      onChange={(newCategory) => {
                                        if (!newCategory) return;
                                        field.onChange(newCategory);
                                        // Update weight/quantity when category changes
                                        setValue(`items.${index}.weight`, 0);
                                        setValue(`items.${index}.quantity`, 1);
                                      }}
                                    />
                                  )}
                                />
                              </div>
                            )}

                            <div className="lg:col-span-3">
                              <Input
                                label="Item Notes (Optional)"
                                {...register(`items.${index}.notes`)}
                                error={errors.items?.[index]?.notes?.message}
                                placeholder="e.g., Handle with care, Remove stains"
                              />
                            </div>
                          </div>

                          {/* Price Preview */}
                          {service && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-blue-700 font-medium">{service.name}</span>
                                  <span className="text-blue-600 text-xs">
                                    {(() => {
                                      const selectedCategory = watch(`items.${index}.clothingCategory`) || 'normal_clothes';
                                      const categoryPriceType = getCategoryPriceType(service, selectedCategory);
                                      return categoryPriceType === 'per_kg' ? 'Per Kilogram' : 'Per Piece';
                                    })()}
                                  </span>
                                </div>
                                {(() => {
                                  const selectedCategory = watch(`items.${index}.clothingCategory`) || 'normal_clothes';
                                  const categoryPriceType = getCategoryPriceType(service, selectedCategory);
                                  const categoryPrice = service.clothingPrices?.get?.(selectedCategory) || 
                                                       service.clothingPrices?.[selectedCategory] || 0;
                                  const weight = parseFloat(watch(`items.${index}.weight`)) || 0;
                                  const quantity = parseInt(watch(`items.${index}.quantity`)) || 1;
                                  const total = categoryPriceType === 'per_kg' 
                                    ? categoryPrice * weight 
                                    : categoryPrice * quantity;
                                  
                                  return (
                                    <div className="space-y-1 pt-2 border-t border-blue-200">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-blue-600">
                                          Category: {getClothingCategoryLabel(selectedCategory)}
                                        </span>
                                        <span className="text-blue-900 font-semibold">
                                          LKR {categoryPrice} / {categoryPriceType === 'per_kg' ? 'kg' : 'piece'}
                                        </span>
                                      </div>
                                      {categoryPriceType === 'per_kg' && weight > 0 && (
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-blue-600">
                                            {weight} kg × LKR {categoryPrice}
                                          </span>
                                          <span className="text-green-700 font-bold">
                                            = LKR {total.toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                      {categoryPriceType === 'per_piece' && quantity > 0 && (
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-blue-600">
                                            {quantity} piece(s) × LKR {categoryPrice}
                                          </span>
                                          <span className="text-green-700 font-bold">
                                            = LKR {total.toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Extras (hangers, bags, ...) and offers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <OrderExtrasSelector
                    items={extraItems}
                    quantities={extraQuantities}
                    onChange={setExtraQuantities}
                  />
                  <OrderDiscountSelector
                    customer={selectedCustomer}
                    customerDiscount={customerDiscount}
                    discounts={liveDiscounts}
                    isLoading={isLoadingOffers}
                    subtotal={totals.subtotal}
                    value={discountChoice}
                    onChange={setDiscountChoice}
                    currentLabel={order?.discount?.description}
                  />
                </div>

                {/* Running total */}
                <OrderSummaryPanel totals={totals} />

                {/* Navigation Buttons */}
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
                    disabled={fields.length === 0 || !watch('items.0.serviceId')}
                    style={{ backgroundColor: '#fe7f2d', color: 'white' }}
                  >
                    Continue to Delivery →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Pickup & Delivery */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b-2 border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-purple-500">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pickup & Delivery</h3>
                      <p className="text-xs text-gray-500">Configure pickup and delivery options</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      id="pickupRequired"
                      {...register('pickupRequired')}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="pickupRequired" className="ml-3 block text-sm font-semibold text-gray-700">
                      📦 Pickup Required
                    </label>
                  </div>

                  <div className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors">
                    <input
                      type="checkbox"
                      id="deliveryRequired"
                      {...register('deliveryRequired')}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="deliveryRequired" className="ml-3 block text-sm font-semibold text-gray-700">
                      🚚 Delivery Required
                    </label>
                  </div>
                </div>

                {/* Pickup Address */}
                {watchedPickupRequired && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="text-md font-semibold text-blue-900 mb-3">Pickup Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Street Address"
                        {...register('pickupAddress.street', { required: watchedPickupRequired ? 'Street address is required' : false })}
                        error={errors.pickupAddress?.street?.message}
                        placeholder="e.g., Room 305, SLIIT Hostel, Malabe"
                      />
                      <Input
                        label="City"
                        {...register('pickupAddress.city', { required: watchedPickupRequired ? 'City is required' : false })}
                        error={errors.pickupAddress?.city?.message}
                        placeholder="e.g., Colombo"
                      />
                    </div>
                    
                    {/* Pickup Price Selection */}
                    <div className="mt-4 bg-white border-2 border-blue-300 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-blue-900 mb-3">📦 Pickup Price</label>
                      <div className="space-y-3">
                        <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{
                          borderColor: watch('pickupPriceType') === 'free' ? '#3b82f6' : '#e5e7eb'
                        }}>
                          <input
                            type="radio"
                            name="pickupPriceType"
                            value="free"
                            checked={watch('pickupPriceType') === 'free'}
                            onChange={() => {
                              setValue('pickupPriceType', 'free');
                              setValue('pickupCharges', 0);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm font-medium">
                            <span className="text-green-600 font-bold">FREE</span> Pickup
                          </span>
                        </label>
                        
                        <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{
                          borderColor: watch('pickupPriceType') === 'price' ? '#3b82f6' : '#e5e7eb'
                        }}>
                          <input
                            type="radio"
                            name="pickupPriceType"
                            value="price"
                            checked={watch('pickupPriceType') === 'price'}
                            onChange={() => setValue('pickupPriceType', 'price')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 flex-1">
                            <span className="text-sm font-medium mr-2">Add Custom Price:</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...register('pickupCharges', { 
                                valueAsNumber: true,
                                disabled: watch('pickupPriceType') !== 'price'
                              })}
                              error={errors.pickupCharges?.message}
                              placeholder="0.00"
                              className="inline-block w-32"
                            />
                            <span className="text-sm text-gray-600 ml-2">LKR</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                {watchedDeliveryRequired && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <h4 className="text-md font-semibold text-green-900 mb-3">Delivery Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Street Address"
                        {...register('deliveryAddress.street', { required: watchedDeliveryRequired ? 'Street address is required' : false })}
                        error={errors.deliveryAddress?.street?.message}
                        placeholder="e.g., Room 305, SLIIT Hostel, Malabe"
                      />
                      <Input
                        label="City"
                        {...register('deliveryAddress.city', { required: watchedDeliveryRequired ? 'City is required' : false })}
                        error={errors.deliveryAddress?.city?.message}
                        placeholder="e.g., Colombo"
                      />
                    </div>

                    {/* Delivery Date */}
                    <div className="mt-4 bg-white border-2 border-green-300 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <Input
                          label="Delivery Date"
                          type="date"
                          required
                          min={toDateKey(new Date())}
                          {...register('expectedDeliveryDate', {
                            required: watchedDeliveryRequired ? 'Delivery date is required' : false,
                          })}
                          error={errors.expectedDeliveryDate?.message}
                          helperText="Shown on the Deliveries calendar"
                        />
                        <div className="flex flex-wrap gap-2 pb-7">
                          {[
                            { label: 'Tomorrow', days: 1 },
                            { label: 'In 2 days', days: 2 },
                            { label: 'In 3 days', days: 3 },
                            { label: 'Next week', days: 7 },
                          ].map((opt) => {
                            const value = toDateKey(addDays(new Date(), opt.days));
                            const active = watch('expectedDeliveryDate') === value;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setValue('expectedDeliveryDate', value, { shouldValidate: true })}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-800 border-green-200 hover:bg-green-50'}`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {/* Delivery Price Selection */}
                    <div className="mt-4 bg-white border-2 border-green-300 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-green-900 mb-3">🚚 Delivery Price</label>
                      <div className="space-y-3">
                        <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors" style={{
                          borderColor: watch('deliveryPriceType') === 'free' ? '#10b981' : '#e5e7eb'
                        }}>
                          <input
                            type="radio"
                            name="deliveryPriceType"
                            value="free"
                            checked={watch('deliveryPriceType') === 'free'}
                            onChange={() => {
                              setValue('deliveryPriceType', 'free');
                              setValue('deliveryCharges', 0);
                            }}
                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-3 text-sm font-medium">
                            <span className="text-green-600 font-bold">FREE</span> Delivery
                          </span>
                        </label>
                        
                        <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors" style={{
                          borderColor: watch('deliveryPriceType') === 'price' ? '#10b981' : '#e5e7eb'
                        }}>
                          <input
                            type="radio"
                            name="deliveryPriceType"
                            value="price"
                            checked={watch('deliveryPriceType') === 'price'}
                            onChange={() => setValue('deliveryPriceType', 'price')}
                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-3 flex-1">
                            <span className="text-sm font-medium mr-2">Add Custom Price:</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...register('deliveryCharges', { 
                                valueAsNumber: true,
                                disabled: watch('deliveryPriceType') !== 'price'
                              })}
                              error={errors.deliveryCharges?.message}
                              placeholder="0.00"
                              className="inline-block w-32"
                            />
                            <span className="text-sm text-gray-600 ml-2">LKR</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Input
                    label="Special Instructions (Optional)"
                    {...register('specialInstructions')}
                    error={errors.specialInstructions?.message}
                    placeholder="Any special instructions for this order"
                  />
                </div>

                {/* Final total including express / pickup / delivery */}
                <OrderSummaryPanel totals={totals} />

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    ← Back to Services
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center"
                    style={{ backgroundColor: '#fe7f2d', color: 'white' }}
                  >
                    {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                    {isEditing ? '✓ Update Order' : '✓ Create Order'}
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

export default OrderFormPage;
