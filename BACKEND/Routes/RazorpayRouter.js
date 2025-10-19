const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../Model/Order');
const Product = require('../Model/Product');

const razorpayRouter = express.Router();

// Initialize Razorpay with fallback values for development
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
  });
} catch (error) {
  console.warn('Razorpay initialization failed:', error.message);
  console.warn('Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file');
  // Create a mock razorpay object for development
  razorpay = {
    orders: {
      create: async () => {
        throw new Error('Razorpay not configured. Please add environment variables.');
      }
    }
  };
}

// Generate unique order ID
const generateOrderId = () => {
  return 'GLITZ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Create Razorpay order
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

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        orderId: orderId,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email
      }
    });

    // Save order to database
    const order = new Order({
      orderId: orderId,
      razorpayOrderId: razorpayOrder.id,
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
      key: process.env.RAZORPAY_KEY_ID,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: orderId
      }
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order' 
    });
  }
});

// Verify payment
razorpayRouter.post('/api/razorpay/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'All payment details are required' 
      });
    }

    // Find order in database
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update order status
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      order.status = 'paid';
      await order.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        order: {
          orderId: order.orderId,
          status: order.status,
          total: order.pricing.total
        }
      });
    } else {
      // Payment verification failed
      order.status = 'failed';
      await order.save();

      res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }

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

// Get all orders (for admin)
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

// Razorpay webhook handler
razorpayRouter.post('/api/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'payment.captured':
        // Handle successful payment
        const paymentData = event.payload.payment.entity;
        const order = await Order.findOne({ razorpayOrderId: paymentData.order_id });
        
        if (order) {
          order.razorpayPaymentId = paymentData.id;
          order.status = 'paid';
          await order.save();
        }
        break;

      case 'payment.failed':
        // Handle failed payment
        const failedPaymentData = event.payload.payment.entity;
        const failedOrder = await Order.findOne({ razorpayOrderId: failedPaymentData.order_id });
        
        if (failedOrder) {
          failedOrder.status = 'failed';
          await failedOrder.save();
        }
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// Get Razorpay key for frontend
razorpayRouter.get('/api/razorpay/key', (req, res) => {
  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID
  });
});

module.exports = razorpayRouter;
