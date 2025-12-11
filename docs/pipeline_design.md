# CI/CD Pipeline Design

## Overview

The CI/CD pipeline is implemented using Jenkins and follows a standard DevOps workflow. The pipeline automates the entire software delivery process from code commit to production deployment, with built-in testing, containerization, and deployment to AWS Elastic Beanstalk.

## Pipeline Stages

### Stage 1: Checkout

**Purpose**: Retrieve source code from the Git repository

**Actions**:
- Checkout code from the configured Git repository (GitHub/GitLab)
- Extract Git commit SHA for versioning
- Store commit information for later stages

**Output**: Source code available in Jenkins workspace

---

### Stage 2: Build & Test

**Purpose**: Build applications and run automated tests

**Execution**: Parallel execution for faster pipeline

**Sub-stages**:

1. **Test Product Service**
   - Install Node.js dependencies (`npm install`)
   - Run unit tests (`npm test`)
   - Tests verify:
     - Health endpoint returns correct status
     - Products endpoint returns array
     - Product by ID endpoint works correctly
     - Error handling for invalid requests

2. **Test Order Service**
   - Install Node.js dependencies
   - Run unit tests with mocked product-service
   - Tests verify:
     - Order creation logic
     - Total price calculation
     - Validation of order items
     - Error handling

3. **Test Frontend**
   - Install dependencies
   - Run React tests (`npm test`)
   - Basic component and functionality tests

**Failure Handling**: If any test fails, the pipeline stops and deployment is prevented

---

### Stage 3: Docker Build

**Purpose**: Create Docker images for all services

**Actions**:
- Build Docker image for product-service
- Build Docker image for order-service
- Build Docker image for frontend (multi-stage build)
- Tag images with:
  - Git commit SHA: `service:commit-sha`
  - Latest tag: `service:latest`

**Image Naming Convention**:
- `username/product-service:abc1234`
- `username/order-service:abc1234`
- `username/frontend:abc1234`

---

### Stage 4: Docker Push

**Purpose**: Push Docker images to container registry (Docker Hub)

**Actions**:
- Authenticate with Docker Hub using Jenkins credentials
- Push all images with both commit SHA and latest tags
- Images are now available for deployment

**Credentials Management**: Uses Jenkins credential store for Docker Hub username/password

---

### Stage 5: Prepare EB Deployment

**Purpose**: Prepare deployment package for Elastic Beanstalk

**Actions**:
- Update `Dockerrun.aws.json` with:
  - Actual Docker Hub username
  - Image tags with commit SHA
- Create deployment ZIP package containing:
  - Updated `Dockerrun.aws.json`
  - Any additional configuration files

**Output**: `eb-deploy.zip` ready for deployment

---

### Stage 6: Deploy to AWS Elastic Beanstalk

**Purpose**: Deploy application to AWS production environment

**Actions**:
- Install/verify AWS EB CLI
- Deploy new application version to EB environment
- Use version label based on Git commit SHA
- Wait for environment health checks
- Monitor deployment status

**Deployment Strategy**:
- Elastic Beanstalk performs rolling update
- New instances launched with updated containers
- Health checks verify new instances
- Traffic gradually shifted to new instances
- Old instances terminated after successful deployment

**Minimizing Downtime**:
- Rolling updates ensure service availability
- Health checks prevent deployment of unhealthy versions
- Automatic rollback if health checks fail

---

### Stage 7: Smoke Tests

**Purpose**: Verify deployed application is functioning correctly

**Actions**:
- Retrieve Elastic Beanstalk environment URL
- Test product-service health endpoint
- Test order-service health endpoint
- Verify endpoints return expected status codes

**Failure Handling**: If smoke tests fail, pipeline marks as failed and triggers rollback

---

### Stage 8: Rollback (Post-Action)

**Purpose**: Revert to previous working version if deployment fails

**Trigger**: Automatic on pipeline failure

**Actions**:
- Read last successful version from stored file
- Deploy previous application version to EB
- Restore environment to known good state

**Manual Rollback**: Can also be triggered manually via EB CLI or AWS Console

## Pipeline Tools

### Jenkins
- **Purpose**: CI/CD orchestration
- **Features Used**:
  - Pipeline as Code (Jenkinsfile)
  - Parallel execution
  - Credential management
  - Post-actions for cleanup and rollback

### Git
- **Purpose**: Source code version control
- **Integration**: Jenkins checks out code from repository
- **Versioning**: Git commit SHA used for image tagging

### Docker
- **Purpose**: Containerization
- **Usage**:
  - Build images in pipeline
  - Push to registry
  - Deploy via Elastic Beanstalk

### AWS Elastic Beanstalk
- **Purpose**: Cloud deployment platform
- **Features Used**:
  - Multi-container Docker platform
  - Application version management
  - Rolling deployments
  - Health monitoring
  - Environment management

## Pipeline Flow Diagram

```
Git Repository
    ↓
[Checkout]
    ↓
[Build & Test] (Parallel)
    ├─ Product Service Tests
    ├─ Order Service Tests
    └─ Frontend Tests
    ↓
[Docker Build]
    ├─ Build product-service image
    ├─ Build order-service image
    └─ Build frontend image
    ↓
[Docker Push]
    └─ Push to Docker Hub
    ↓
[Prepare EB Deployment]
    └─ Create deployment package
    ↓
[Deploy to AWS EB]
    └─ Rolling update deployment
    ↓
[Smoke Tests]
    └─ Verify deployment
    ↓
Success / Failure
    ↓
[Rollback] (if failure)
```

## Environment Variables

Pipeline uses environment variables for configuration:
- `DOCKERHUB_USERNAME`: Docker Hub username
- `AWS_EB_APP_NAME`: Elastic Beanstalk application name
- `AWS_EB_ENV_NAME`: Elastic Beanstalk environment name
- `AWS_REGION`: AWS region for deployment
- `GIT_COMMIT_SHORT`: Short Git commit SHA

## Best Practices Implemented

1. **Automated Testing**: Tests run before deployment
2. **Version Tagging**: Images tagged with commit SHA for traceability
3. **Parallel Execution**: Faster pipeline execution
4. **Health Checks**: Verify deployment success
5. **Rollback Strategy**: Automatic recovery from failures
6. **Infrastructure as Code**: Pipeline defined in Jenkinsfile
7. **Credential Security**: Sensitive data stored in Jenkins credentials

## Pipeline Execution Time

Estimated total execution time: 10-15 minutes
- Checkout: < 1 minute
- Build & Test: 3-5 minutes (parallel)
- Docker Build: 5-7 minutes
- Docker Push: 2-3 minutes
- EB Deployment: 5-10 minutes
- Smoke Tests: < 1 minute

