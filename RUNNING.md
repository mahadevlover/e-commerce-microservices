# How to Run the Project

## Prerequisites

Before running the project, ensure you have:

1. **Docker** installed
   - Download from: https://www.docker.com/get-started
   - Verify installation: `docker --version`
   - Verify Docker Compose: `docker-compose --version`

2. **Node.js** (optional, for running tests locally)
   - Download from: https://nodejs.org/
   - Verify: `node --version` (should be v18 or higher)
   - Verify npm: `npm --version`

---

## Quick Start (Recommended)

### Step 1: Navigate to Infrastructure Directory

```bash
cd infra
```

### Step 2: Build and Start All Services

```bash
docker-compose up --build
```

The `--build` flag ensures Docker images are built from scratch.

**What happens:**
- Docker builds images for product-service, order-service, and frontend
- All three containers start
- Services become available on their respective ports

### Step 3: Access the Application

Once containers are running, open your browser:

- **Frontend (Main Application)**: http://localhost:3000
- **Product Service API**: http://localhost:3001
- **Order Service API**: http://localhost:3002

### Step 4: Test the Services

**Test Product Service:**
```bash
# In a new terminal
curl http://localhost:3001/health
curl http://localhost:3001/products
```

**Test Order Service:**
```bash
curl http://localhost:3002/health
curl http://localhost:3002/orders
```

**Test Frontend:**
- Open http://localhost:3000 in your browser
- You should see the product catalog
- Try selecting products and placing an order

---

## Running in Detached Mode (Background)

To run containers in the background:

```bash
cd infra
docker-compose up -d --build
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop containers:**
```bash
docker-compose down
```

**Stop and remove volumes:**
```bash
docker-compose down -v
```

---

## Running Tests Locally (Without Docker)

### Product Service Tests

```bash
cd product-service
npm install
npm test
```

**Expected output:**
```
PASS  src/server.test.js
  Product Service
    GET /health
      ✓ should return healthy status
    GET /products
      ✓ should return an array of products
      ✓ should return products with required fields
    GET /products/:id
      ✓ should return a product by ID
      ✓ should return 404 for non-existent product

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

### Order Service Tests

```bash
cd order-service
npm install
npm test
```

**Expected output:**
```
PASS  src/server.test.js
  Order Service
    GET /health
      ✓ should return healthy status
    POST /orders
      ✓ should create an order with valid data
      ✓ should return 400 for invalid request
      ✓ should calculate total correctly for multiple items
      ✓ should return 404 for non-existent product
    GET /orders
      ✓ should return an array of orders

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

### Frontend Tests

```bash
cd frontend
npm install
npm test -- --watchAll=false
```

---

## Testing the Full Application Flow

### 1. View Products

**Via Browser:**
- Open http://localhost:3000
- Products should be displayed

**Via API:**
```bash
curl http://localhost:3001/products
```

**Expected response:**
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "price": 999.99,
    "description": "High-performance laptop",
    "stock": 10
  },
  ...
]
```

### 2. Create an Order

**Via Browser:**
- Select products and quantities
- Click "Place Order"
- View order confirmation

**Via API:**
```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {"productId": 1, "quantity": 2},
      {"productId": 2, "quantity": 1}
    ]
  }'
```

**Expected response:**
```json
{
  "id": 1,
  "userId": "user123",
  "items": [
    {
      "productId": 1,
      "productName": "Laptop",
      "quantity": 2,
      "unitPrice": 999.99,
      "subtotal": 1999.98
    },
    ...
  ],
  "total": 2029.97,
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### 3. View Orders

```bash
curl http://localhost:3002/orders
```

---

## Troubleshooting

### Issue: Port Already in Use

**Error:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution:**
1. Find process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```
2. Stop the process or change port in `docker-compose.yml`

### Issue: Docker Build Fails

**Error:** `npm ERR!` or build errors

**Solution:**
1. Check Docker is running: `docker ps`
2. Try rebuilding without cache:
   ```bash
   docker-compose build --no-cache
   docker-compose up
   ```

### Issue: Services Can't Communicate

**Error:** Order service can't reach product service

**Solution:**
1. Verify services are on same network:
   ```bash
   docker network ls
   docker network inspect infra_ecommerce-network
   ```
2. Check service names match in `docker-compose.yml`
3. Restart services:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Issue: Frontend Can't Connect to APIs

**Error:** API calls fail in browser

**Solution:**
1. Check environment variables in `docker-compose.yml`
2. Verify services are running:
   ```bash
   docker-compose ps
   ```
3. Check browser console for CORS errors (shouldn't happen, CORS is enabled)

### Issue: Tests Fail

**Error:** Tests don't pass

**Solution:**
1. Ensure dependencies are installed: `npm install`
2. Check Node.js version: `node --version` (should be 18+)
3. Clear npm cache: `npm cache clean --force`
4. Reinstall: `rm -rf node_modules && npm install`

---

## Viewing Logs

### All Services
```bash
cd infra
docker-compose logs -f
```

### Specific Service
```bash
docker-compose logs -f product-service
docker-compose logs -f order-service
docker-compose logs -f frontend
```

### Last 100 Lines
```bash
docker-compose logs --tail=100
```

---

## Container Management

### List Running Containers
```bash
docker-compose ps
```

### Stop All Services
```bash
docker-compose stop
```

### Start Stopped Services
```bash
docker-compose start
```

### Restart a Specific Service
```bash
docker-compose restart product-service
```

### Remove All Containers and Networks
```bash
docker-compose down
```

### Remove Everything (Including Volumes)
```bash
docker-compose down -v
```

### Rebuild a Specific Service
```bash
docker-compose build product-service
docker-compose up -d product-service
```

---

## Health Checks

All services have health check endpoints:

```bash
# Product Service
curl http://localhost:3001/health

# Order Service
curl http://localhost:3002/health

# Frontend
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "product-service"
}
```

---

## Development Workflow

### Making Changes

1. **Edit code** in service directories
2. **Rebuild and restart**:
   ```bash
   docker-compose up --build
   ```
3. **Or restart specific service**:
   ```bash
   docker-compose restart product-service
   ```

### Testing Changes

1. Run tests locally:
   ```bash
   cd product-service && npm test
   ```
2. Test manually via API or frontend
3. Check logs for errors

---

## Next Steps

Once everything is running locally:

1. ✅ Test all endpoints
2. ✅ Verify frontend works
3. ✅ Run all tests
4. ✅ Review logs
5. 📝 Update Jenkinsfile with your Docker Hub credentials
6. 📝 Configure AWS Elastic Beanstalk
7. 📝 Set up Jenkins pipeline

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker-compose up --build` | Build and start all services |
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop and remove containers |
| `docker-compose logs -f` | View logs (follow mode) |
| `docker-compose ps` | List running containers |
| `docker-compose restart <service>` | Restart a service |
| `curl http://localhost:3001/products` | Test product API |
| `curl http://localhost:3002/orders` | Test order API |

---

## Support

If you encounter issues:
1. Check Docker is running
2. Verify ports are available
3. Review container logs
4. Ensure all prerequisites are installed
5. Try rebuilding from scratch: `docker-compose down -v && docker-compose up --build`

