# Jenkins Setup and Deployment Guide

## ✅ Completed Tasks

### 1. Docker Containers Started Successfully
All microservices are now running in Docker:
- **Product Service**: Running on port 3001 ✅ (Healthy)
- **Order Service**: Running on port 3002 ✅ (Healthy)  
- **Frontend**: Running on port 3003 ✅ (Fixed health check)

**To start/stop containers:**
```powershell
cd infra
docker-compose up -d          # Start all services
docker-compose down            # Stop all services
docker-compose ps              # Check status
```

### 2. Docker Builds Verified
All Dockerfiles have been tested and build successfully:
- ✅ product-service/Dockerfile
- ✅ order-service/Dockerfile
- ✅ frontend/Dockerfile

### 3. Jenkinsfile Fixed
**Changes made:**
- ✅ Fixed `DOCKERHUB_USERNAME` placeholder - now uses parameter or environment variable
- ✅ Improved frontend test stage to handle missing tests gracefully
- ✅ Added build verification step for frontend

### 4. Docker Compose Fixed
- ✅ Removed obsolete `version` field
- ✅ Changed frontend port from 3000 to 3003 (to avoid conflicts)

## 🔧 Jenkins Configuration Required

### Before Running Jenkins Pipeline:

1. **Set Docker Hub Credentials in Jenkins:**
   - Go to Jenkins → Manage Jenkins → Credentials → System → Global credentials
   - Add new credentials:
     - Kind: Username with password
     - ID: `dockerhub-credentials`
     - Username: Your Docker Hub username
     - Password: Your Docker Hub password/token

2. **Set Docker Hub Username:**
   You have two options:
   
   **Option A: Set as Global Environment Variable (Recommended)**
   - Go to Jenkins → Manage Jenkins → Configure System
   - Under "Global properties" → "Environment variables"
   - Add: `DOCKERHUB_USERNAME` = `your-dockerhub-username`
   
   **Option B: Use Pipeline Parameter**
   - When running the pipeline, provide `DOCKERHUB_USERNAME_PARAM` parameter
   - Or it will prompt you to enter it

3. **Install Required Jenkins Plugins:**
   - Docker Pipeline
   - Git
   - AWS Elastic Beanstalk (if deploying to AWS)

4. **Configure AWS Credentials (if deploying to AWS):**
   - Add AWS credentials in Jenkins credentials store
   - Configure AWS CLI in Jenkins agent

### Jenkins Pipeline Stages:

1. **Checkout** - Pulls code from Git repository
2. **Build & Test** - Runs tests for all services in parallel
3. **Docker Build** - Builds Docker images for all services
4. **Docker Push** - Pushes images to Docker Hub
5. **Prepare EB Deployment** - Prepares AWS Elastic Beanstalk package
6. **Deploy to AWS** - Deploys to AWS Elastic Beanstalk
7. **Smoke Tests** - Verifies deployment health

## 🐛 Potential Issues & Solutions

### Issue 1: Frontend Tests
- **Status**: Fixed ✅
- **Solution**: Added `--passWithNoTests` flag and build verification

### Issue 2: Docker Hub Authentication
- **Solution**: Ensure credentials are set in Jenkins as `dockerhub-credentials`

### Issue 3: Git Authentication (Current Issue)
- **Status**: Credentials cleared, needs re-authentication
- **Solution**: Next Git push will prompt for credentials

### Issue 4: AWS Deployment (Optional)
- If not deploying to AWS, you can comment out AWS-related stages
- Or configure AWS credentials in Jenkins

## 📝 Next Steps

1. **Fix Git Authentication:**
   ```powershell
   git push -u origin main
   # When prompted, enter your GitHub credentials for mahadevlover account
   ```

2. **Configure Jenkins:**
   - Set up Docker Hub credentials
   - Set DOCKERHUB_USERNAME environment variable
   - Create a new pipeline job pointing to your repository

3. **Test Jenkins Pipeline:**
   - Run the pipeline manually first
   - Verify all stages pass
   - Check Docker images are pushed successfully

## 🧪 Local Testing

**Test services locally:**
```powershell
# Product Service
Invoke-WebRequest -Uri http://localhost:3001/health -UseBasicParsing

# Order Service  
Invoke-WebRequest -Uri http://localhost:3002/health -UseBasicParsing

# Frontend
Invoke-WebRequest -Uri http://localhost:3003/health -UseBasicParsing
```

**View logs:**
```powershell
docker logs product-service
docker logs order-service
docker logs frontend
```

## ✅ Verification Checklist

- [x] Docker containers running and healthy
- [x] All Dockerfiles build successfully
- [x] Jenkinsfile configured correctly
- [x] Health checks working
- [ ] Git credentials configured (in progress)
- [ ] Jenkins credentials configured
- [ ] Docker Hub credentials configured
- [ ] Jenkins pipeline tested

## 📞 Support

If you encounter any issues:
1. Check Docker container logs: `docker logs <container-name>`
2. Check Jenkins console output for detailed error messages
3. Verify all credentials are set correctly in Jenkins
4. Ensure Docker is running on Jenkins agent

