const request = require('supertest');
const app = require('./server');

describe('Product Service', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('product-service');
    });
  });

  describe('GET /products', () => {
    it('should return an array of products', async () => {
      const response = await request(app).get('/products');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return products with required fields', async () => {
      const response = await request(app).get('/products');
      expect(response.status).toBe(200);
      const product = response.body[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by ID', async () => {
      const response = await request(app).get('/products/1');
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body).toHaveProperty('name');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app).get('/products/999');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Product not found');
    });
  });
});

