const express = require('express');
const cors = require('cors');
const connet = require('./Config/server');
const adminRouter = require('./Routes/AdminRouter');
const razorpayRouter = require('./Routes/RazorpayRouter');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() });
});

// Health check for Razorpay routes
app.get('/api/razorpay/health', (req, res) => {
  res.json({ 
    message: 'Razorpay routes are working!', 
    timestamp: new Date(),
    routes: [
      'POST /api/razorpay/create-order',
      'POST /api/razorpay/verify-payment',
      'GET /api/razorpay/order/:orderId',
      'GET /api/razorpay/orders',
      'POST /api/razorpay/webhook',
      'GET /api/razorpay/key'
    ]
  });
});

// mount routers
app.use('/', adminRouter);
app.use('/', razorpayRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.port || 5010;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET /test');
  console.log('- GET /api/razorpay/health');
  console.log('- POST /api/razorpay/create-order');
  console.log('- POST /api/razorpay/verify-payment');
  console.log('- GET /api/razorpay/order/:orderId');
  console.log('- GET /api/razorpay/orders');
  console.log('- POST /api/razorpay/webhook');
  console.log('- GET /api/razorpay/key');
  connet();
});
