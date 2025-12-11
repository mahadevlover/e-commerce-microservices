const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3002;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';

app.use(cors());
app.use(express.json());

// In-memory order storage
let orders = [];
let orderIdCounter = 1;

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'order-service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      getAllOrders: 'GET /orders',
      getOrderById: 'GET /orders/:id',
      createOrder: 'POST /orders'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'order-service' });
});

// Get all orders
app.get('/orders', (req, res) => {
  const userId = req.query.userId;
  let filteredOrders = orders;
  
  if (userId) {
    filteredOrders = orders.filter(o => o.userId === userId);
  }
  
  console.log(`[${new Date().toISOString()}] GET /orders - Returning ${filteredOrders.length} orders`);
  res.status(200).json(filteredOrders);
});

// Get order by ID
app.get('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    console.log(`[${new Date().toISOString()}] GET /orders/${id} - Order not found`);
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.status(200).json(order);
});

// Create order
app.post('/orders', async (req, res) => {
  try {
    const { userId, items } = req.body;
    
    // Validation
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      console.log(`[${new Date().toISOString()}] POST /orders - Validation failed`);
      return res.status(400).json({ error: 'Invalid request: userId and items array required' });
    }
    
    // Fetch product details from product-service
    const orderItems = [];
    let total = 0;
    
    for (const item of items) {
      try {
        const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
        const product = productResponse.data;
        
        if (item.quantity <= 0) {
          return res.status(400).json({ error: `Invalid quantity for product ${item.productId}` });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
        }
        
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        
        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: itemTotal
        });
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return res.status(404).json({ error: `Product ${item.productId} not found` });
        }
        throw error;
      }
    }
    
    // Create order
    const order = {
      id: orderIdCounter++,
      userId,
      items: orderItems,
      total: parseFloat(total.toFixed(2)),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    orders.push(order);
    
    console.log(`[${new Date().toISOString()}] POST /orders - Order created: ID=${order.id}, User=${userId}, Total=$${order.total}`);
    
    res.status(201).json(order);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /orders - Error:`, error.message);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Order service running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Product service URL: ${PRODUCT_SERVICE_URL}`);
});

module.exports = app;

