import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const PRODUCT_SERVICE_URL = process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:3002';

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState(null);
  const [userId] = useState('user123'); // Simple user ID for demo

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty > 0) {
      setSelectedProducts({ ...selectedProducts, [productId]: qty });
    } else {
      const newSelection = { ...selectedProducts };
      delete newSelection[productId];
      setSelectedProducts(newSelection);
    }
  };

  const handlePlaceOrder = async () => {
    const items = Object.entries(selectedProducts).map(([productId, quantity]) => ({
      productId: parseInt(productId),
      quantity: quantity
    }));

    if (items.length === 0) {
      setOrderStatus({ type: 'error', message: 'Please select at least one product' });
      return;
    }

    try {
      setOrderStatus({ type: 'loading', message: 'Placing order...' });
      const response = await axios.post(`${ORDER_SERVICE_URL}/orders`, {
        userId,
        items
      });
      
      setOrderStatus({ 
        type: 'success', 
        message: `Order placed successfully! Order ID: ${response.data.id}, Total: $${response.data.total}` 
      });
      setSelectedProducts({});
    } catch (error) {
      setOrderStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to place order' 
      });
    }
  };

  const getTotal = () => {
    return Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>E-Commerce Store</h1>
        <p>DevOps Assessment - Microservices Demo</p>
      </header>

      <main className="App-main">
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <>
            <section className="products-section">
              <h2>Products</h2>
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.id} className="product-card">
                    <h3>{product.name}</h3>
                    <p className="description">{product.description}</p>
                    <p className="price">${product.price.toFixed(2)}</p>
                    <p className="stock">Stock: {product.stock}</p>
                    <div className="quantity-selector">
                      <label>
                        Quantity:
                        <input
                          type="number"
                          min="0"
                          max={product.stock}
                          value={selectedProducts[product.id] || 0}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="order-section">
              <h2>Order Summary</h2>
              {Object.keys(selectedProducts).length === 0 ? (
                <p>No products selected</p>
              ) : (
                <>
                  <ul className="order-items">
                    {Object.entries(selectedProducts).map(([productId, quantity]) => {
                      const product = products.find(p => p.id === parseInt(productId));
                      return product ? (
                        <li key={productId}>
                          {product.name} x {quantity} = ${(product.price * quantity).toFixed(2)}
                        </li>
                      ) : null;
                    })}
                  </ul>
                  <p className="total">Total: ${getTotal().toFixed(2)}</p>
                  <button onClick={handlePlaceOrder} className="order-button">
                    Place Order
                  </button>
                </>
              )}
            </section>

            {orderStatus && (
              <div className={`order-status ${orderStatus.type}`}>
                {orderStatus.message}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

