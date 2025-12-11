const request = require('supertest');
const axios = require('axios');
const app = require('./server');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('order-service');
    });
  });

  describe('POST /orders', () => {
    it('should create an order with valid data', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { id: 1, name: 'Laptop', price: 999.99, stock: 10 }
      });

      const orderData = {
        userId: 'user123',
        items: [{ productId: 1, quantity: 2 }]
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBe(1999.98);
      expect(response.body.userId).toBe('user123');
    });

    it('should return 400 for invalid request', async () => {
      const response = await request(app)
        .post('/orders')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid request');
    });

    it('should calculate total correctly for multiple items', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { id: 1, name: 'Laptop', price: 999.99, stock: 10 } })
        .mockResolvedValueOnce({ data: { id: 2, name: 'Mouse', price: 29.99, stock: 50 } });

      const orderData = {
        userId: 'user123',
        items: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 2 }
        ]
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.total).toBe(1059.97);
    });

    it('should return 404 for non-existent product', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404 }
      });

      const orderData = {
        userId: 'user123',
        items: [{ productId: 999, quantity: 1 }]
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /orders', () => {
    it('should return an array of orders', async () => {
      const response = await request(app).get('/orders');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

