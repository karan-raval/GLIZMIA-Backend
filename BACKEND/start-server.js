const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Test routes
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date(),
    port: process.env.PORT || 5010
  });
});

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

// Error handling
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
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5010;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('📋 Available routes:');
  console.log(`   GET  http://localhost:${PORT}/test`);
  console.log(`   GET  http://localhost:${PORT}/api/razorpay/health`);
  console.log(`   POST http://localhost:${PORT}/api/razorpay/create-order`);
  console.log(`   POST http://localhost:${PORT}/api/razorpay/verify-payment`);
  console.log(`   GET  http://localhost:${PORT}/api/razorpay/order/:orderId`);
  console.log(`   GET  http://localhost:${PORT}/api/razorpay/orders`);
  console.log(`   POST http://localhost:${PORT}/api/razorpay/webhook`);
  console.log(`   GET  http://localhost:${PORT}/api/razorpay/key`);
  console.log('');
  console.log('🔧 To test:');
  console.log(`   curl http://localhost:${PORT}/test`);
  console.log(`   curl http://localhost:${PORT}/api/razorpay/health`);
});
