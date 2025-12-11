# Testing Strategy

## Overview

The testing strategy focuses on automated testing integrated into the CI/CD pipeline. Tests are designed to be minimal but sufficient to demonstrate automated testing practices and prevent deployment of broken code.

## Test Types

### 1. Unit Tests

**Purpose**: Test individual components and functions in isolation

#### Product Service Tests

**Framework**: Jest + Supertest

**Test Cases**:
- `GET /health` endpoint returns healthy status
- `GET /products` returns an array of products
- Products have required fields (id, name, price)
- `GET /products/:id` returns correct product
- `GET /products/:id` returns 404 for non-existent product

**Location**: `product-service/src/server.test.js`

**Execution**: `npm test` in product-service directory

#### Order Service Tests

**Framework**: Jest + Supertest

**Test Cases**:
- `GET /health` endpoint returns healthy status
- `POST /orders` creates order with valid data
- Order total calculation is correct
- Multiple items in order calculate total correctly
- Validation rejects invalid requests (missing userId, empty items)
- Returns 404 for non-existent products
- Returns 400 for invalid quantities

**Location**: `order-service/src/server.test.js`

**Execution**: `npm test` in order-service directory

**Mocking**: Product-service calls are mocked using Jest to avoid dependencies

#### Frontend Tests

**Framework**: React Testing Library (via react-scripts)

**Test Cases**:
- Basic component rendering
- User interaction tests (if implemented)

**Location**: `frontend/src/` (test files)

**Execution**: `npm test` in frontend directory

### 2. Integration Tests (Implicit)

**Purpose**: Verify services work together correctly

**Implementation**: 
- Order-service tests include integration-like tests with mocked product-service
- In production, smoke tests verify end-to-end functionality

### 3. Smoke Tests

**Purpose**: Verify deployed application is functioning after deployment

**Location**: Jenkins pipeline (Stage 7)

**Test Cases**:
- Product-service health endpoint responds with 200
- Order-service health endpoint responds with 200
- Services are accessible via deployed URLs

**Execution**: Automated in Jenkins pipeline after deployment

## Test Execution in CI/CD Pipeline

### Pipeline Stage: Build & Test

Tests run in **parallel** for efficiency:

```
[Build & Test] (Parallel)
    ├─ Test Product Service
    │   └─ npm install && npm test
    ├─ Test Order Service
    │   └─ npm install && npm test
    └─ Test Frontend
        └─ npm install && npm test
```

### Failure Handling

- **If any test fails**: Pipeline stops immediately
- **No deployment occurs**: Broken code is not deployed
- **Developer notification**: Jenkins reports failure
- **Fix and retry**: Developer fixes issues and triggers new pipeline

## Test Coverage

### Current Coverage

- **Product Service**: Core endpoints and error cases
- **Order Service**: Order creation logic, validation, calculations
- **Frontend**: Basic functionality (minimal for assessment)

### Coverage Goals

For this assessment, coverage is **minimal but sufficient** to demonstrate:
- Automated testing is integrated into CI
- Tests prevent broken deployments
- Tests run automatically on every commit

## Test Data

### Product Service
- Uses in-memory product array
- Pre-populated with sample products (Laptop, Mouse, Keyboard, etc.)

### Order Service
- Uses in-memory order storage
- Mocks product-service responses in tests
- Tests use sample order data

## Running Tests Locally

### Product Service
```bash
cd product-service
npm install
npm test
```

### Order Service
```bash
cd order-service
npm install
npm test
```

### Frontend
```bash
cd frontend
npm install
npm test
```

### All Tests
```bash
# From project root
cd product-service && npm test && cd ..
cd order-service && npm test && cd ..
cd frontend && npm test && cd ..
```

## Test Maintenance

### Adding New Tests

1. **Identify test case**: What functionality needs testing?
2. **Write test**: Add test case to appropriate test file
3. **Run locally**: Verify test passes
4. **Commit**: Test will run automatically in pipeline

### Test Best Practices

- Tests should be **fast** (run in seconds, not minutes)
- Tests should be **isolated** (no dependencies on external services)
- Tests should be **deterministic** (same input = same output)
- Tests should **fail fast** (clear error messages)

## Limitations and Future Improvements

### Current Limitations

- Limited test coverage (sufficient for assessment)
- No end-to-end tests (beyond smoke tests)
- No performance/load tests
- Frontend tests are minimal

### Future Improvements

- Add integration tests with test containers
- Add API contract tests
- Increase frontend test coverage
- Add performance benchmarks
- Add security scanning tests

## Testing Tools

- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library for API testing
- **React Testing Library**: Frontend component testing
- **Jenkins**: Test orchestration and reporting

## Summary

The testing strategy ensures:
1. ✅ Automated tests run on every code change
2. ✅ Tests prevent deployment of broken code
3. ✅ Core functionality is verified
4. ✅ Tests are fast and reliable
5. ✅ Test results are visible in CI/CD pipeline

This minimal but complete testing approach demonstrates DevOps best practices while keeping the assessment scope manageable.

