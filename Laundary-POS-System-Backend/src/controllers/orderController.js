const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const { generateOrderNumber } = require('../utils/helpers');
const { sendBankAccountDetails, sendOrderConfirmation, sendPickupScheduledEmail } = require('../services/notificationService');

// Helper function to determine next status based on service statuses and order requirements
const determineNextStatus = (currentStatus, serviceStatuses, pickupRequired, deliveryRequired) => {
  // If pickup required and status is pickup, next is received
  if (currentStatus === 'pickup') {
    return 'received';
  }

  // If status is received, determine first service status
  if (currentStatus === 'received') {
    const serviceStatusOrder = ['washing', 'drying', 'ironing', 'dry_cleaning', 'folding'];
    for (const status of serviceStatusOrder) {
      if (serviceStatuses.includes(status)) {
        return status;
      }
    }
  }

  // For service statuses, determine next in sequence
  const serviceStatusOrder = ['washing', 'drying', 'ironing', 'dry_cleaning', 'folding'];
  const currentIndex = serviceStatusOrder.indexOf(currentStatus);
  
  if (currentIndex !== -1) {
    // Find next service status
    for (let i = currentIndex + 1; i < serviceStatusOrder.length; i++) {
      if (serviceStatuses.includes(serviceStatusOrder[i])) {
        return serviceStatusOrder[i];
      }
    }
    // If no more services, move to complete
    return 'complete';
  }

  // If status is complete, determine if delivery is needed
  if (currentStatus === 'complete') {
    if (deliveryRequired) {
      return 'deliver';
    } else {
      return 'complete'; // Stay complete for self-service orders
    }
  }

  // If status is deliver, stay deliver (no further progression needed)
  if (currentStatus === 'deliver') {
    return 'deliver';
  }

  return currentStatus; // Return current status if no progression
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      items,
      pickupRequired,
      pickupAddress,
      deliveryRequired,
      deliveryAddress,
      specialInstructions,
      tags,
      loyaltyPointsUsed = 0
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    // Pickup and delivery are optional but addresses required if they are enabled
    if (pickupRequired && !pickupAddress) {
      return res.status(400).json({
        success: false,
        message: 'Pickup address is required when pickup is enabled'
      });
    }

    if (deliveryRequired && !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required when delivery is enabled'
      });
    }

    // Validate and enrich order items with service details
    const enrichedItems = [];
    let totalEstimatedTime = 0;
    const allServiceStatuses = new Set(); // Collect all unique service statuses

    for (const item of items) {
      const service = await Service.findById(item.serviceId);
      if (!service) {
        return res.status(400).json({
          success: false,
          message: `Service not found: ${item.serviceId}`
        });
      }

      // Add service statuses to the set
      if (service.statuses && Array.isArray(service.statuses)) {
        service.statuses.forEach(status => allServiceStatuses.add(status));
      }

      // Calculate pricing based on service type and clothing category
      let unitPrice = service.basePrice;
      
      console.log(`[Order Creation] Processing service: ${service.name}, Type: ${service.priceType}`);
      console.log(`[Order Creation] Item data:`, { 
        weight: item.weight, 
        quantity: item.quantity, 
        clothingCategory: item.clothingCategory 
      });
      console.log(`[Order Creation] Service clothingPrices:`, service.clothingPrices);
      
      // Both per_kg and per_piece now use clothing category pricing
      if ((service.priceType === 'per_piece' || service.priceType === 'per_kg') && item.clothingCategory) {
        // Convert Map to Object if necessary
        let pricesObj = service.clothingPrices;
        if (service.clothingPrices instanceof Map) {
          pricesObj = Object.fromEntries(service.clothingPrices);
          console.log(`[Order Creation] Converted Map to Object:`, pricesObj);
        }
        
        // Try to get the price for the category
        const clothingPrice = pricesObj?.[item.clothingCategory];
        console.log(`[Order Creation] Found price for ${item.clothingCategory}:`, clothingPrice);
        
        if (clothingPrice !== undefined && clothingPrice !== null && clothingPrice > 0) {
          unitPrice = Number(clothingPrice);
        } else {
          console.error(`[Order Creation] Price lookup failed for category: ${item.clothingCategory}`);
          return res.status(400).json({
            success: false,
            message: `No price found for clothing category: "${item.clothingCategory}" in service: "${service.name}". Available categories: ${Object.keys(pricesObj || {}).join(', ') || 'NONE'}`
          });
        }
      }
      
      console.log(`[Order Creation] Final unitPrice:`, unitPrice);

      // Validate weight/quantity based on price type
      if (service.priceType === 'per_kg') {
        if (!item.weight || item.weight <= 0) {
          return res.status(400).json({
            success: false,
            message: `Weight is required and must be greater than 0 for service: ${service.name}`
          });
        }
      } else if (service.priceType === 'per_piece') {
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: `Quantity is required and must be greater than 0 for service: ${service.name}`
          });
        }
      }

      const totalPrice = service.priceType === 'per_kg' 
        ? unitPrice * item.weight
        : unitPrice * item.quantity;
      
      console.log(`[Order Creation] Calculated totalPrice:`, totalPrice, `(${unitPrice} × ${service.priceType === 'per_kg' ? item.weight : item.quantity})`);

      enrichedItems.push({
        service: service._id,
        serviceName: service.name,
        quantity: item.quantity || 1,
        weight: item.weight || 0,
        clothingCategory: item.clothingCategory || 'normal_clothes',
        unitPrice,
        totalPrice,
        estimatedTime: service.estimatedTime,
        notes: item.notes || ''
      });
      
      console.log(`[Order Creation] Added item to enrichedItems:`, enrichedItems[enrichedItems.length - 1]);

      totalEstimatedTime += service.estimatedTime;
    }

    // Handle customer (only existing customers allowed)
    let customer;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'customerId is required - only existing customers can place orders'
      });
    }

    // Calculate totals
    const subtotal = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = 0; // Can be configured later
    
    // Apply 10% student discount if customer is a student
    let discountAmount = 0;
    if (customer.isStudent) {
      discountAmount = subtotal * 0.10; // 10% discount on subtotal
      console.log(`[Order Creation] Student discount applied: 10% = LKR ${discountAmount.toFixed(2)}`);
    }
    
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    console.log(`[Order Creation] Order totals:`, {
      subtotal,
      taxAmount,
      discountAmount,
      discountPercentage: customer.isStudent ? '10%' : '0%',
      isStudent: customer.isStudent,
      totalAmount,
      itemCount: enrichedItems.length
    });


    // Use customer address as default if not provided
    const finalPickupAddress = pickupAddress || customer.address || {};
    const finalDeliveryAddress = deliveryAddress || customer.address || {};

    // Determine initial status and phase based on pickup requirement
    let initialStatus;
    let initialPhase;
    let itemsConfirmed;

    // Explicitly check if pickup is required (handle undefined, null, false)
    const isPickupOrder = pickupRequired === true;
    
    console.log(`[Order Creation] pickupRequired value:`, pickupRequired, `| isPickupOrder:`, isPickupOrder);

    if (isPickupOrder) {
      // Pickup orders start in draft phase (needs confirmation after pickup)
      initialStatus = 'pickup';
      initialPhase = 'draft';
      itemsConfirmed = false;
      console.log(`[Order Creation] Setting as PICKUP order: phase=draft, status=pickup`);
    } else {
      // Walk-in orders are auto-confirmed (items already received)
      initialStatus = 'received';
      initialPhase = 'confirmed';
      itemsConfirmed = true;
      console.log(`[Order Creation] Setting as WALK-IN order: phase=confirmed, status=received`);
    }

    // Create order
    const order = await Order.create({
      customer: customer._id,
      customerInfo: {
        name: customer.fullName,
        phone: customer.phoneNumber,
        email: customer.email,
        address: customer.address
      },
      items: enrichedItems,
      serviceStatuses: Array.from(allServiceStatuses), // Add service statuses from all services
      pickupRequired: pickupRequired || false,
      pickupAddress: finalPickupAddress,
      deliveryRequired: deliveryRequired || false,
      deliveryAddress: finalDeliveryAddress,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      specialInstructions,
      tags: tags || [],
      loyaltyPointsUsed,
      loyaltyPointsEarned: Math.floor(totalAmount), // 1 point per rupee
      createdBy: req.user.id,
      status: initialStatus,
      orderPhase: initialPhase,
      itemsConfirmed: itemsConfirmed,
      isEditable: true
    });

    // Log the created order phase for debugging
    console.log(`[Order Creation] Order ${order.orderNumber} created with phase: ${order.orderPhase}, status: ${order.status}, itemsConfirmed: ${order.itemsConfirmed}`);

    // Update customer's order count and loyalty points
    await Customer.findByIdAndUpdate(customer._id, {
      $inc: { 
        'loyaltyPoints': -loyaltyPointsUsed + Math.floor(totalAmount),
        'totalOrders': 1 
      }
    });

    // Send appropriate email to customer based on order type
    try {
      if (customer.email && customer.email.trim() !== '') {
        if (order.pickupRequired) {
          // PICKUP ORDER: Send Email 1 (Pickup Scheduled - No amounts)
          await sendPickupScheduledEmail({
            email: customer.email,
            orderNumber: order.orderNumber,
            customerName: customer.fullName,
            pickupAddress: finalPickupAddress
          });
          console.log(`✅ Pickup scheduled email sent to ${customer.email} for order ${order.orderNumber}`);
          console.log(`⏳ Order confirmation with actual amounts will be sent after items are received and confirmed`);
        } else {
          // WALK-IN ORDER: Send Email 2 (Order Confirmed - Full details)
          await sendOrderConfirmation({
            email: customer.email,
            orderNumber: order.orderNumber,
            customerName: customer.fullName,
            totalAmount: order.totalAmount,
            orderDetails: {
              items: enrichedItems,
              pickupRequired: order.pickupRequired,
              deliveryRequired: order.deliveryRequired,
              estimatedTime: totalEstimatedTime,
              subtotal: order.subtotal,
              discountAmount: order.discountAmount,
              taxAmount: order.taxAmount
            }
          });
          console.log(`✅ Order confirmation email sent to ${customer.email} for order ${order.orderNumber}`);
        }
      } else {
        console.log(`⚠️  No email address for customer ${customer.fullName}, skipping order notification email`);
      }
    } catch (emailError) {
      // Log error but don't fail the order creation
      console.error('❌ Failed to send order notification email:', emailError.message);
      // Order is still created successfully even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: await Order.findById(order._id)
          .populate('customer', 'fullName phoneNumber address loyaltyPoints')
          .populate('items.service', 'name priceType basePrice statuses')
          .populate('createdBy', 'name')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get all orders with filtering and pagination
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      serviceStatus,
      customerId,
      staffId,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isDeleted: false };

    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }

    // Filter by payment status
    if (paymentStatus) {
      if (paymentStatus === 'paid') {
        filter.balanceAmount = { $lte: 0 };
      } else if (paymentStatus === 'unpaid') {
        filter.balanceAmount = { $gt: 0 };
      }
    }

    // Filter by service status
    if (serviceStatus) {
      filter.serviceStatuses = { $in: [serviceStatus] };
    }

    if (customerId) {
      filter.customer = customerId;
    }

    if (staffId) {
      filter.assignedStaff = staffId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.name': { $regex: search, $options: 'i' } },
        { 'customerInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const orders = await Order.find(filter)
      .populate('customer', 'fullName phoneNumber address')
      .populate('items.service', 'name priceType basePrice clothingPrices estimatedTime statuses')
      .populate('createdBy', 'name')
      .populate('assignedStaff', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // Get order statistics
    const stats = await Order.getOrderStats(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get single order by ID
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customer', 'fullName phoneNumber address loyaltyPoints')
      .populate('items.service', 'name priceType basePrice clothingPrices estimatedTime statuses')
      .populate('createdBy', 'name')
      .populate('assignedStaff', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get the order first to check if it can be edited
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be edited
    const canEdit = existingOrder.canEdit();
    if (!canEdit.allowed) {
      return res.status(403).json({
        success: false,
        message: canEdit.reason,
        orderPhase: existingOrder.orderPhase,
        paidAmount: existingOrder.paidAmount
      });
    }

    // If editing confirmed order, revert to draft for re-confirmation
    if (existingOrder.orderPhase === 'confirmed' && existingOrder.pickupRequired) {
      existingOrder.itemsConfirmed = false;
      existingOrder.orderPhase = 'draft';
      console.log(`Order ${existingOrder.orderNumber} reverted to draft for re-confirmation after edit`);
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.orderNumber;
    delete updateData.customer;
    delete updateData.createdBy;
    delete updateData._id;
    delete updateData.orderPhase; // Phase is managed by system
    delete updateData.itemsConfirmed; // Managed by confirmItems
    delete updateData.confirmationHistory; // Managed by confirmItems

    // If items are being updated, enrich them with service details
    if (updateData.items && Array.isArray(updateData.items)) {
      const enrichedItems = [];
      
      for (const item of updateData.items) {
        // If item already has service details, use them (for existing items)
        if (item.service && item.serviceName && item.unitPrice && item.totalPrice) {
          enrichedItems.push(item);
          continue;
        }

        // Otherwise, enrich the item (for new/modified items)
        const service = await Service.findById(item.serviceId);
        if (!service) {
          return res.status(400).json({
            success: false,
            message: `Service not found: ${item.serviceId}`
          });
        }

        // Calculate pricing based on service type and clothing category
        let unitPrice = service.basePrice;
        
        // Both per_kg and per_piece now use clothing category pricing
        if ((service.priceType === 'per_piece' || service.priceType === 'per_kg') && item.clothingCategory) {
          // Convert Map to Object if necessary
          let pricesObj = service.clothingPrices;
          if (service.clothingPrices instanceof Map) {
            pricesObj = Object.fromEntries(service.clothingPrices);
          }
          
          // Try to get the price for the category
          const clothingPrice = pricesObj?.[item.clothingCategory];
          
          if (clothingPrice !== undefined && clothingPrice !== null) {
            unitPrice = Number(clothingPrice);
          } else {
            return res.status(400).json({
              success: false,
              message: `No price found for clothing category: ${item.clothingCategory} in service: ${service.name}. Available categories: ${Object.keys(pricesObj || {}).join(', ')}`
            });
          }
        }

        // Validate weight/quantity based on price type
        if (service.priceType === 'per_kg') {
          if (!item.weight || item.weight <= 0) {
            return res.status(400).json({
              success: false,
              message: `Weight is required and must be greater than 0 for service: ${service.name}`
            });
          }
        } else if (service.priceType === 'per_piece') {
          if (!item.quantity || item.quantity <= 0) {
            return res.status(400).json({
              success: false,
              message: `Quantity is required and must be greater than 0 for service: ${service.name}`
            });
          }
        }

        const totalPrice = service.priceType === 'per_kg' 
          ? unitPrice * item.weight
          : unitPrice * item.quantity;

        enrichedItems.push({
          service: service._id,
          serviceName: service.name,
          quantity: item.quantity || 1,
          weight: item.weight || 0,
          clothingCategory: item.clothingCategory || 'normal_clothes',
          unitPrice,
          totalPrice,
          estimatedTime: service.estimatedTime,
          notes: item.notes || ''
        });
      }
      
      updateData.items = enrichedItems;
    }

    // Apply the updates to existing order
    Object.assign(existingOrder, updateData);
    await existingOrder.save();

    // Reload with populated data
    const order = await Order.findById(id)
      .populate('customer', 'fullName phoneNumber address')
      .populate('items.service', 'name priceType statuses')
      .populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Order updated successfully',
      warning: canEdit.warning,
      data: { order }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, staffId, autoProgress } = req.body;

    const validStatuses = [
      'pickup', 'received', 'washing', 'drying', 'ironing', 
      'dry_cleaning', 'folding', 'complete', 'deliver', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(id)
      .populate('items.service', 'statuses');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If autoProgress is true, determine next status automatically
    let newStatus = status;
    if (autoProgress) {
      // Get all service statuses from order items
      const allServiceStatuses = order.items.reduce((acc, item) => {
        if (item.service && item.service.statuses) {
          acc.push(...item.service.statuses);
        }
        return acc;
      }, []);
      
      // Remove duplicates
      const uniqueServiceStatuses = [...new Set(allServiceStatuses)];
      
      newStatus = determineNextStatus(
        order.status, 
        uniqueServiceStatuses, 
        order.pickupRequired, 
        order.deliveryRequired
      );
    }

    await order.updateStatus(newStatus, staffId, notes);

    // Handle phase transitions based on status changes
    // Transition to completed phase when order reaches complete or deliver status
    if ((newStatus === 'complete' || newStatus === 'deliver') && order.orderPhase === 'processing') {
      order.transitionPhase('completed', `Order ${newStatus === 'deliver' ? 'ready for delivery' : 'completed'}`);
      await order.save();
      console.log(`Order ${order.orderNumber} transitioned to completed phase (status: ${newStatus})`);
    }

    // Transition to cancelled phase when order is cancelled
    if (newStatus === 'cancelled' && order.orderPhase !== 'cancelled') {
      order.orderPhase = 'cancelled';
      order.isEditable = false;
      await order.save();
      console.log(`Order ${order.orderNumber} transitioned to cancelled phase`);
    }

    res.json({
      success: true,
      message: `Order status updated to ${newStatus} successfully`,
      data: { order }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Add payment to order
const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, amount, transactionId, notes, status = 'completed' } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate payment method
    if (!['cash', 'bank_transfer'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Only cash and bank_transfer are allowed.'
      });
    }

    // For bank transfer, transaction ID is required
    if (method === 'bank_transfer' && !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required for bank transfer payments'
      });
    }

    // For cash payments, no transaction ID needed
    const paymentData = {
      method,
      amount,
      transactionId: method === 'cash' ? null : transactionId,
      notes,
      status,
      processedAt: new Date()
    };

    await order.addPayment(paymentData);

    // Transition to processing phase when first payment is made
    if (order.orderPhase === 'confirmed' && order.paidAmount > 0) {
      order.transitionPhase('processing', 'Payment received, order now in processing');
      await order.save();
      console.log(`Order ${order.orderNumber} transitioned to processing phase after payment`);
    }

    // Reload order with populated data
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'fullName phoneNumber email')
      .populate('items.service', 'name basePrice clothingPrices estimatedTime statuses')
      .populate('createdBy', 'fullName email')
      .populate('assignedStaff', 'fullName phoneNumber');

    res.json({
      success: true,
      message: `Payment added successfully via ${method === 'cash' ? 'cash' : 'bank transfer'}`,
      data: { order: updatedOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add payment',
      error: error.message
    });
  }
};

// Delete order (soft delete)
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

// Get order analytics
const getOrderAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const filter = { isDeleted: false };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [
      overview,
      ordersByStatus,
      dailyStats
    ] = await Promise.all([
      Order.getOrderStats(filter),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    console.log('Analytics Filter:', filter);
    console.log('Analytics Data:', {
      overview,
      ordersByStatusCount: ordersByStatus.length,
      dailyStatsCount: dailyStats.length
    });

    res.json({
      success: true,
      data: {
        overview,
        ordersByStatus,
        dailyStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order analytics',
      error: error.message
    });
  }
};

// Bulk update orders
const bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, action, data } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs are required'
      });
    }

    let result;
    switch (action) {
      case 'updateStatus':
        result = await Order.updateMany(
          { _id: { $in: orderIds } },
          { status: data.status }
        );
        break;
      case 'assignStaff':
        result = await Order.updateMany(
          { _id: { $in: orderIds } },
          { $addToSet: { assignedStaff: data.staffId } }
        );
        break;
      case 'delete':
        result = await Order.updateMany(
          { _id: { $in: orderIds } },
          { isDeleted: true }
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update orders',
      error: error.message
    });
  }
};

// Confirm order items after pickup (update actual quantities)
const confirmOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    // Get the order
    const order = await Order.findById(id)
      .populate('customer', 'fullName email phoneNumber');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be confirmed
    const canConfirm = order.canConfirm();
    if (!canConfirm.allowed) {
      return res.status(400).json({
        success: false,
        message: canConfirm.reason
      });
    }

    // Validate and enrich updated items with service details
    const confirmedItems = [];
    let totalEstimatedTime = 0;

    for (const itemUpdate of items) {
      // Find original item in order
      const originalItem = order.items.find(i => i._id.toString() === itemUpdate.itemId);
      
      if (!originalItem) {
        return res.status(400).json({
          success: false,
          message: `Original item not found: ${itemUpdate.itemId}`
        });
      }

      // Get service details
      const service = await Service.findById(originalItem.service);
      if (!service) {
        return res.status(400).json({
          success: false,
          message: `Service not found: ${originalItem.service}`
        });
      }

      // Use updated quantities or keep original
      const actualQuantity = itemUpdate.actualQuantity !== undefined ? itemUpdate.actualQuantity : originalItem.quantity;
      const actualWeight = itemUpdate.actualWeight !== undefined ? itemUpdate.actualWeight : originalItem.weight;
      const clothingCategory = itemUpdate.clothingCategory || originalItem.clothingCategory || 'normal_clothes';

      // Calculate pricing based on service type and clothing category
      let unitPrice = service.basePrice;
      
      if ((service.priceType === 'per_piece' || service.priceType === 'per_kg') && clothingCategory) {
        let pricesObj = service.clothingPrices;
        if (service.clothingPrices instanceof Map) {
          pricesObj = Object.fromEntries(service.clothingPrices);
        }
        
        const clothingPrice = pricesObj?.[clothingCategory];
        
        if (clothingPrice !== undefined && clothingPrice !== null && clothingPrice > 0) {
          unitPrice = Number(clothingPrice);
        }
      }

      // Validate actual quantities
      if (service.priceType === 'per_kg' && (!actualWeight || actualWeight <= 0)) {
        return res.status(400).json({
          success: false,
          message: `Weight is required and must be greater than 0 for service: ${service.name}`
        });
      } else if (service.priceType === 'per_piece' && (!actualQuantity || actualQuantity <= 0)) {
        return res.status(400).json({
          success: false,
          message: `Quantity is required and must be greater than 0 for service: ${service.name}`
        });
      }

      const totalPrice = service.priceType === 'per_kg' 
        ? unitPrice * actualWeight
        : unitPrice * actualQuantity;

      confirmedItems.push({
        service: service._id,
        serviceName: service.name,
        quantity: actualQuantity,
        weight: actualWeight,
        clothingCategory: clothingCategory,
        unitPrice,
        totalPrice,
        estimatedTime: service.estimatedTime,
        notes: itemUpdate.notes || originalItem.notes || ''
      });

      totalEstimatedTime += service.estimatedTime;
    }

    // Recalculate totals
    const subtotal = confirmedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = 0;
    
    // Apply discount if customer is a student
    let discountAmount = 0;
    if (order.customer && order.customer.isStudent) {
      discountAmount = subtotal * 0.10;
    }
    
    const totalAmount = subtotal + taxAmount - discountAmount;
    const balanceAmount = totalAmount - (order.paidAmount || 0);

    const originalTotal = order.totalAmount;
    const difference = totalAmount - originalTotal;

    console.log(`[Confirm Items] Order ${order.orderNumber} totals:`, {
      originalTotal,
      newTotal: totalAmount,
      difference,
      itemCount: confirmedItems.length
    });

    // Save confirmation history for audit trail
    order.confirmationHistory = {
      estimatedTotal: originalTotal,
      actualTotal: totalAmount,
      difference: difference,
      confirmedAt: new Date(),
      confirmedBy: req.user.id,
      notes: difference !== 0 ? `Total ${difference > 0 ? 'increased' : 'decreased'} by LKR ${Math.abs(difference).toFixed(2)}` : 'No change in total'
    };

    // Update order with confirmed items and recalculated amounts
    order.items = confirmedItems;
    order.subtotal = subtotal;
    order.taxAmount = taxAmount;
    order.discountAmount = discountAmount;
    order.totalAmount = totalAmount;
    order.balanceAmount = balanceAmount;
    order.loyaltyPointsEarned = Math.floor(totalAmount);
    
    // Mark items as confirmed
    order.itemsConfirmed = true;
    order.confirmedAt = new Date();
    order.confirmedBy = req.user.id;

    // Transition order phase from draft to confirmed
    order.transitionPhase('confirmed', 'Items confirmed after pickup');
    
    // Change status to "received" if still in pickup
    if (order.status === 'pickup') {
      await order.updateStatus('received', req.user.id, 'Items received and confirmed');
    }

    await order.save();

    // Send Email 2: Order Confirmed (Full details with actual amounts)
    try {
      if (order.customer && order.customer.email && order.customer.email.trim() !== '') {
        await sendOrderConfirmation({
          email: order.customer.email,
          orderNumber: order.orderNumber,
          customerName: order.customer.fullName,
          totalAmount: order.totalAmount,
          orderDetails: {
            items: confirmedItems,
            pickupRequired: order.pickupRequired,
            deliveryRequired: order.deliveryRequired,
            estimatedTime: totalEstimatedTime,
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            taxAmount: order.taxAmount
          }
        });
        console.log(`✅ Order confirmation email (with actual amounts) sent to ${order.customer.email} for order ${order.orderNumber}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation email:', emailError.message);
    }

    // Reload order with populated data
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'fullName phoneNumber email address loyaltyPoints')
      .populate('items.service', 'name priceType basePrice clothingPrices estimatedTime statuses')
      .populate('createdBy', 'name')
      .populate('confirmedBy', 'name');

    res.json({
      success: true,
      message: 'Items confirmed and order updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to confirm items',
      error: error.message
    });
  }
};

// Send bank account details to customer
const sendBankDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Get order details
    const order = await Order.findById(id)
      .populate('customer', 'fullName phoneNumber email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate amount
    const transferAmount = amount || order.balanceAmount;
    if (!transferAmount || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer amount'
      });
    }

    // Get bank account details from environment or configuration
    const bankDetails = {
      bankName: process.env.BANK_NAME || 'Commercial Bank of Sri Lanka',
      accountName: process.env.BANK_ACCOUNT_NAME || 'Fast Laundry Services',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
      branch: process.env.BANK_BRANCH || 'Colombo Main Branch',
      swiftCode: process.env.BANK_SWIFT_CODE || 'CBCYLKLX'
    };

    // Send bank details to customer via email
    const result = await sendBankAccountDetails({
      email: order.customerInfo?.email || order.customer?.email,
      orderNumber: order.orderNumber,
      amount: transferAmount,
      bankDetails
    });

    // Always return success even if notifications fail
    // The frontend can still display bank details manually
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          sentVia: result.sentVia,
          details: result.results
        }
      });
    } else {
      // Return 200 with warning instead of 500
      // This allows the payment flow to continue
      res.json({
        success: true,
        warning: true,
        message: 'Bank details could not be sent automatically. Please inform customer manually.',
        originalMessage: result.message,
        data: {
          sentVia: [],
          details: result.results,
          bankDetails: bankDetails // Include bank details so frontend can display them
        }
      });
    }
  } catch (error) {
    console.error('Error sending bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bank account details',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  addPayment,
  deleteOrder,
  getOrderAnalytics,
  bulkUpdateOrders,
  sendBankDetails,
  confirmOrderItems
};