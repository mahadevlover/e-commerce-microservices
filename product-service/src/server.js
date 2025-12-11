const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory product storage
const products = [
  { id: 1, name: 'Laptop', price: 999.99, description: 'High-performance laptop', stock: 10 },
  { id: 2, name: 'Mouse', price: 29.99, description: 'Wireless mouse', stock: 50 },
  { id: 3, name: 'Keyboard', price: 79.99, description: 'Mechanical keyboard', stock: 30 },
  { id: 4, name: 'Monitor', price: 249.99, description: '27-inch 4K monitor', stock: 15 },
  { id: 5, name: 'Headphones', price: 149.99, description: 'Noise-cancelling headphones', stock: 25 }
];

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'product-service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      getAllProducts: 'GET /products',
      getProductById: 'GET /products/:id'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'product-service' });
});

// Get all products
app.get('/products', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /products - Returning ${products.length} products`);
  res.status(200).json(products);
});

// Get product by ID
app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  
  if (!product) {
    console.log(`[${new Date().toISOString()}] GET /products/${id} - Product not found`);
    return res.status(404).json({ error: 'Product not found' });
  }
  
  console.log(`[${new Date().toISOString()}] GET /products/${id} - Returning product: ${product.name}`);
  res.status(200).json(product);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Product service running on port ${PORT}`);
});

module.exports = app;

