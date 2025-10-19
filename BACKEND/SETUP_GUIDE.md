# GLITZMIA Backend Setup Guide

## 🚨 **FIXING THE RAZORPAY ERROR**

The error you're seeing is because Razorpay environment variables are missing. Here's how to fix it:

### **Step 1: Create .env file**

Create a `.env` file in the `GLITZMIA/BACKEND` directory with these contents:

```env
# Database Configuration
mongourl=mongodb://localhost:27017/glitzmia

# Server Configuration
port=5010

# Razorpay Configuration (Get these from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### **Step 2: Get Razorpay Keys**

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up/Login
3. Go to Settings → API Keys
4. Generate Test Keys
5. Copy the Key ID and Key Secret
6. Replace the values in your `.env` file

### **Step 3: For Development (Quick Fix)**

If you want to test without Razorpay setup, use these test values:

```env
RAZORPAY_KEY_ID=rzp_test_key
RAZORPAY_KEY_SECRET=test_secret
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret
```

### **Step 4: Restart Server**

After adding the `.env` file:

```bash
cd GLITZMIA/BACKEND
npm start
```

## 🔧 **Alternative: Disable Razorpay Temporarily**

If you want to test the cart without Razorpay, you can modify the routes to return mock data.

## 📋 **Complete .env Example**

```env
# Database
mongourl=mongodb://localhost:27017/glitzmia

# Server
port=5010

# Razorpay (Get from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_test_1234567890abcdef
RAZORPAY_KEY_SECRET=abcdef1234567890abcdef1234567890
RAZORPAY_WEBHOOK_SECRET=webhook_secret_1234567890
```

## ✅ **Verification**

After setup, the server should start without errors. You can test with:

- `http://localhost:5010/test` - Basic server test
- `http://localhost:5010/api/razorpay/health` - Razorpay routes test
