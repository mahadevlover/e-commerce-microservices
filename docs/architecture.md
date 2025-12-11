# System Architecture

## Overview

This project implements a microservices-based e-commerce system with a minimal architecture designed to demonstrate DevOps practices. The system consists of two backend microservices and a frontend application, all containerized using Docker and deployed to AWS Elastic Beanstalk.

## Components

### 1. Product Service (Microservice 1)

**Technology**: Node.js + Express

**Purpose**: Manages the product catalog

**Endpoints**:
- `GET /health` - Health check endpoint
- `GET /products` - Returns list of all products
- `GET /products/:id` - Returns a specific product by ID

**Data Storage**: In-memory array (can be easily replaced with a database)

**Port**: 3001

**Key Features**:
- Simple REST API
- Request logging
- Error handling
- Health check for monitoring

### 2. Order Service (Microservice 2)

**Technology**: Node.js + Express

**Purpose**: Handles order creation and management

**Endpoints**:
- `GET /health` - Health check endpoint
- `GET /orders` - Returns list of orders (optionally filtered by userId)
- `GET /orders/:id` - Returns a specific order by ID
- `POST /orders` - Creates a new order

**Data Storage**: In-memory array

**Port**: 3002

**Key Features**:
- Communicates with product-service via HTTP to fetch product details
- Validates order items and calculates totals
- Checks product availability
- Request logging

**Inter-Service Communication**:
- Uses HTTP/axios to call product-service
- Service URL configured via environment variable: `PRODUCT_SERVICE_URL`

### 3. Frontend Application

**Technology**: React

**Purpose**: User interface for browsing products and placing orders

**Features**:
- Displays product catalog
- Allows users to select products and quantities
- Places orders via order-service API
- Shows order confirmation

**Port**: 80 (nginx)

**API Integration**:
- Calls product-service to fetch products
- Calls order-service to create orders
- API URLs configured via environment variables

## Communication Flow

```
User → Frontend → Order Service → Product Service
                ↓
            (Order created)
```

1. User browses products in the frontend
2. Frontend calls `GET /products` on product-service
3. User selects products and places order
4. Frontend calls `POST /orders` on order-service
5. Order-service validates request and calls product-service to fetch product details
6. Order-service calculates total and creates order
7. Frontend displays order confirmation

## Containerization

### Docker Architecture

Each service has its own `Dockerfile`:
- **product-service/Dockerfile**: Node.js Alpine-based image
- **order-service/Dockerfile**: Node.js Alpine-based image  
- **frontend/Dockerfile**: Multi-stage build (Node.js for build, nginx for serving)

### Docker Compose (Local Development)

The `infra/docker-compose.yml` file orchestrates all services:
- Defines network for inter-service communication
- Sets up health checks
- Configures environment variables
- Maps ports for local access

**Running locally**:
```bash
cd infra
docker-compose up
```

## AWS Elastic Beanstalk Deployment

### Multi-Container Docker Platform

The system is deployed to AWS Elastic Beanstalk using the **Multi-container Docker** platform, which:
- Runs multiple Docker containers on EC2 instances
- Manages load balancing and auto-scaling
- Handles health checks and monitoring
- Provides rolling updates to minimize downtime

### Configuration

**Dockerrun.aws.json** (v2) defines:
- Container definitions for each service
- Port mappings
- Environment variables
- Health check configurations
- CloudWatch logging configuration
- Container links for service discovery

### Deployment Strategy

Elastic Beanstalk uses **rolling updates** by default:
1. New instances are launched with the updated application version
2. Health checks ensure new instances are healthy
3. Traffic is gradually shifted from old to new instances
4. Old instances are terminated after successful deployment

This approach minimizes downtime and provides a simple blue/green-like deployment strategy.

## Network Architecture

### Local Development
- Services communicate via Docker network: `ecommerce-network`
- Frontend accesses services via `http://localhost:3001` and `http://localhost:3002`

### Production (AWS EB)
- Services communicate via internal Docker network
- Frontend accesses services via Elastic Beanstalk load balancer URLs
- External access via EB environment URL

## Scalability Considerations

The architecture supports horizontal scaling:
- Each microservice can be scaled independently
- Elastic Beanstalk auto-scaling groups handle instance management
- Load balancer distributes traffic across instances
- Stateless services allow for easy scaling

## Technology Choices Rationale

- **Node.js + Express**: Lightweight, fast development, good for microservices
- **React**: Modern frontend framework, component-based architecture
- **Docker**: Consistent environments, easy deployment, industry standard
- **AWS Elastic Beanstalk**: Managed platform, handles infrastructure, supports multi-container Docker
- **In-memory storage**: Simplifies setup for assessment; easily replaceable with databases

