# Razorpay Integration Setup

## Environment Variables Required

Add these to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

## API Endpoints

### 1. Create Order
- **POST** `/api/razorpay/create-order`
- **Body:**
```json
{
  "items": [
    {
      "productId": "product_id_here",
      "quantity": 2
    }
  ],
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  }
}
```

### 2. Verify Payment
- **POST** `/api/razorpay/verify-payment`
- **Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "orderId": "GLITZ_xxx"
}
```

### 3. Get Order Details
- **GET** `/api/razorpay/order/:orderId`

### 4. Get All Orders (Admin)
- **GET** `/api/razorpay/orders?page=1&limit=10&status=paid`

### 5. Get Razorpay Key
- **GET** `/api/razorpay/key`

### 6. Webhook Handler
- **POST** `/api/razorpay/webhook`

## Database Models

### Order Model
- `orderId`: Unique order identifier
- `razorpayOrderId`: Razorpay order ID
- `razorpayPaymentId`: Razorpay payment ID
- `customerDetails`: Customer information
- `items`: Array of ordered items
- `pricing`: Pricing breakdown
- `status`: Order status (pending, paid, failed, cancelled, refunded)
- `razorpaySignature`: Payment verification signature

## Security Features

1. **Payment Verification**: All payments are verified using Razorpay signatures
2. **Webhook Security**: Webhook signatures are verified
3. **Order Validation**: Product existence and pricing are validated
4. **Unique Order IDs**: Each order has a unique identifier

## Usage Flow

1. Frontend sends cart items and customer details to create order
2. Backend creates Razorpay order and saves to database
3. Frontend uses Razorpay SDK to process payment
4. After payment, frontend sends payment details for verification
5. Backend verifies payment and updates order status
6. Webhooks handle additional payment events
