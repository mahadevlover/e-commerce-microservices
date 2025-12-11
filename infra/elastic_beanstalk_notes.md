# AWS Elastic Beanstalk Deployment Notes

## Overview

This project uses AWS Elastic Beanstalk with **Multi-container Docker** platform to deploy the microservices architecture.

## Configuration Files

### Dockerrun.aws.json (v2)

This file defines the multi-container Docker configuration for Elastic Beanstalk. It specifies:
- Container definitions for each service (product-service, order-service, frontend)
- Port mappings
- Environment variables
- Health check configurations
- Links between containers

### Deployment Strategy

Elastic Beanstalk supports **rolling updates** by default, which minimizes downtime:
- New instances are created with the updated application version
- Health checks ensure new instances are healthy before traffic is shifted
- Old instances are terminated only after new ones are confirmed healthy

This provides a simple blue/green-like deployment strategy without manual intervention.

## Deployment Process

1. **Package Application**: Create a zip file containing:
   - `Dockerrun.aws.json`
   - Docker images (pushed to Docker Hub or ECR)
   - Any additional configuration files

2. **Create/Update EB Environment**:
   - Use EB CLI: `eb create` or `eb deploy`
   - Or use AWS Console to upload the application version

3. **Health Checks**:
   - EB monitors container health via health check endpoints
   - `/health` endpoints on each service provide status

4. **Rollback**:
   - Use `eb deploy --version <previous-version>` to rollback
   - Or use AWS Console to select a previous application version

## Environment Variables

Set in EB environment configuration:
- `PRODUCT_SERVICE_URL`: Internal service URL for order-service
- `REACT_APP_PRODUCT_SERVICE_URL`: Frontend API URL
- `REACT_APP_ORDER_SERVICE_URL`: Frontend API URL

## Logging

Application logs are automatically shipped to CloudWatch Logs:
- Each container's stdout/stderr is captured
- Log groups are created per environment
- Access via AWS Console or CloudWatch Logs API

