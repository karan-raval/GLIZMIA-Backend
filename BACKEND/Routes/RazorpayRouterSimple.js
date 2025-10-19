const express = require('express');
const Order = require('../Model/Order');
const Product = require('../Model/Product');

const razorpayRouter = express.Router();

// Generate unique order ID
const generateOrderId = () => {
  return 'GLITZ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Mock Razorpay order creation (for development)
razorpayRouter.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { items, customerDetails } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items are required' 
      });
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer details (name, email, phone) are required' 
      });
    }

    // Calculate pricing
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      const itemPrice = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price 
        ? product.discountPrice 
        : product.price;

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        quantity: item.quantity,
        imageUrl: product.imageUrl
      });
    }

    const shipping = 0; // Free shipping
    const total = subtotal + shipping;

    // Generate order ID
    const orderId = generateOrderId();

    // Create mock Razorpay order
    const mockRazorpayOrder = {
      id: 'order_mock_' + Date.now(),
      amount: Math.round(total * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId
    };

    // Save order to database
    const order = new Order({
      orderId: orderId,
      razorpayOrderId: mockRazorpayOrder.id,
      customerDetails: customerDetails,
      items: processedItems,
      pricing: {
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        currency: 'INR'
      },
      status: 'pending'
    });

    await order.save();

    res.json({
      success: true,
      key: 'rzp_test_key', // Mock key
      order: {
        id: mockRazorpayOrder.id,
        amount: mockRazorpayOrder.amount,
        currency: mockRazorpayOrder.currency,
        orderId: orderId
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order' 
    });
  }
});

// Mock payment verification
razorpayRouter.post('/api/razorpay/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Find order in database
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Mock payment verification (always successful for development)
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = 'paid';
    await order.save();

    res.json({
      success: true,
      message: 'Payment verified successfully (MOCK)',
      order: {
        orderId: order.orderId,
        status: order.status,
        total: order.pricing.total
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify payment' 
    });
  }
});

// Get order details
razorpayRouter.get('/api/razorpay/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId: orderId })
      .populate('items.productId', 'name price discountPrice imageUrl');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order' 
    });
  }
});

// Get all orders
razorpayRouter.get('/api/razorpay/orders', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name price discountPrice imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders: orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders' 
    });
  }
});

// Get Razorpay key
razorpayRouter.get('/api/razorpay/key', (req, res) => {
  res.json({
    success: true,
    key: 'rzp_test_key' // Mock key for development
  });
});

module.exports = razorpayRouter;
