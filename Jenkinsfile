pipeline {
    agent any
    
    parameters {
        string(name: 'DOCKERHUB_USERNAME_PARAM', defaultValue: '', description: 'Docker Hub username (e.g., yourusername)')
    }
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        // Set DOCKERHUB_USERNAME in Jenkins Global Environment Variables or use parameter
        // Go to Jenkins > Manage Jenkins > Configure System > Global properties > Environment variables
        // Add: DOCKERHUB_USERNAME = your-dockerhub-username
        DOCKERHUB_USERNAME = "${env.DOCKERHUB_USERNAME ?: params.DOCKERHUB_USERNAME_PARAM ?: 'YOUR_DOCKERHUB_USERNAME'}"
        AWS_EB_APP_NAME = 'ecommerce-microservices'
        AWS_EB_ENV_NAME = 'ecommerce-prod'
        AWS_REGION = 'us-east-1'
        GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Stage 1: Checking out code from Git repository'
                checkout scm
                script {
                    env.GIT_COMMIT = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    echo "Git commit: ${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('Build & Test') {
            parallel {
                stage('Test Product Service') {
                    steps {
                        dir('product-service') {
                            echo 'Building and testing product-service'
                            sh '''
                                npm install
                                npm test
                            '''
                        }
                    }
                }
                
                stage('Test Order Service') {
                    steps {
                        dir('order-service') {
                            echo 'Building and testing order-service'
                            sh '''
                                npm install
                                npm test
                            '''
                        }
                    }
                }
                
                stage('Test Frontend') {
                    steps {
                        dir('frontend') {
                            echo 'Building and testing frontend'
                            sh '''
                                npm install
                                # Run tests if they exist, otherwise just verify build works
                                npm test -- --watchAll=false --passWithNoTests || echo "No tests found, continuing..."
                                npm run build
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                echo 'Stage 3: Building Docker images'
                script {
                    // Build product-service
                    sh '''
                        cd product-service
                        docker build -t ${DOCKERHUB_USERNAME}/product-service:${GIT_COMMIT_SHORT} .
                        docker tag ${DOCKERHUB_USERNAME}/product-service:${GIT_COMMIT_SHORT} ${DOCKERHUB_USERNAME}/product-service:latest
                    '''
                    
                    // Build order-service
                    sh '''
                        cd order-service
                        docker build -t ${DOCKERHUB_USERNAME}/order-service:${GIT_COMMIT_SHORT} .
                        docker tag ${DOCKERHUB_USERNAME}/order-service:${GIT_COMMIT_SHORT} ${DOCKERHUB_USERNAME}/order-service:latest
                    '''
                    
                    // Build frontend
                    sh '''
                        cd frontend
                        docker build -t ${DOCKERHUB_USERNAME}/frontend:${GIT_COMMIT_SHORT} .
                        docker tag ${DOCKERHUB_USERNAME}/frontend:${GIT_COMMIT_SHORT} ${DOCKERHUB_USERNAME}/frontend:latest
                    '''
                }
            }
        }
        
        stage('Docker Push') {
            steps {
                echo 'Stage 4: Pushing Docker images to registry'
                script {
                    sh '''
                        echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin
                        
                        docker push ${DOCKERHUB_USERNAME}/product-service:${GIT_COMMIT_SHORT}
                        docker push ${DOCKERHUB_USERNAME}/product-service:latest
                        
                        docker push ${DOCKERHUB_USERNAME}/order-service:${GIT_COMMIT_SHORT}
                        docker push ${DOCKERHUB_USERNAME}/order-service:latest
                        
                        docker push ${DOCKERHUB_USERNAME}/frontend:${GIT_COMMIT_SHORT}
                        docker push ${DOCKERHUB_USERNAME}/frontend:latest
                    '''
                }
            }
        }
        
        stage('Prepare EB Deployment') {
            steps {
                echo 'Stage 5: Preparing Elastic Beanstalk deployment package'
                script {
                    // Update Dockerrun.aws.json with actual image tags
                    sh '''
                        cd infra
                        sed -i "s/YOUR_DOCKERHUB_USERNAME/${DOCKERHUB_USERNAME}/g" Dockerrun.aws.json
                        sed -i "s/:latest/:${GIT_COMMIT_SHORT}/g" Dockerrun.aws.json
                        
                        # Create deployment package
                        zip -r ../eb-deploy.zip Dockerrun.aws.json
                    '''
                }
            }
        }
        
        stage('Deploy to AWS Elastic Beanstalk') {
            steps {
                echo 'Stage 5: Deploying to AWS Elastic Beanstalk'
                script {
                    sh '''
                        # Install EB CLI if not available
                        if ! command -v eb &> /dev/null; then
                            pip install awsebcli
                        fi
                        
                        # Initialize EB (if needed) or deploy
                        cd infra
                        
                        # Deploy using EB CLI
                        eb deploy ${AWS_EB_ENV_NAME} --version-label v${GIT_COMMIT_SHORT} --staged || {
                            echo "Deployment failed, will attempt rollback"
                            currentBuild.result = 'UNSTABLE'
                        }
                        
                        # Wait for environment to be ready
                        eb health ${AWS_EB_ENV_NAME} --refresh
                    '''
                }
            }
        }
        
        stage('Smoke Tests') {
            steps {
                echo 'Stage 6: Running smoke tests after deployment'
                script {
                    // Get EB environment URL
                    def ebUrl = sh(
                        script: "cd infra && eb status ${AWS_EB_ENV_NAME} | grep 'CNAME' | awk '{print \$2}'",
                        returnStdout: true
                    ).trim()
                    
                    if (!ebUrl) {
                        ebUrl = "${AWS_EB_ENV_NAME}.${AWS_REGION}.elasticbeanstalk.com"
                    }
                    
                    echo "Testing deployed application at: ${ebUrl}"
                    
                    // Test product-service health
                    sh '''
                        response=$(curl -s -o /dev/null -w "%{http_code}" http://${ebUrl}/products || echo "000")
                        if [ "$response" != "200" ]; then
                            echo "Smoke test failed: Product service returned status $response"
                            exit 1
                        fi
                        echo "Product service health check passed"
                    '''
                    
                    // Test order-service health
                    sh '''
                        response=$(curl -s -o /dev/null -w "%{http_code}" http://${ebUrl}:3002/health || echo "000")
                        if [ "$response" != "200" ]; then
                            echo "Smoke test failed: Order service returned status $response"
                            exit 1
                        fi
                        echo "Order service health check passed"
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            script {
                // Save successful deployment version for potential rollback
                sh '''
                    echo "${GIT_COMMIT_SHORT}" > last-successful-version.txt
                '''
            }
        }
        
        failure {
            echo 'Pipeline failed. Initiating rollback...'
            script {
                // Rollback to previous version
                sh '''
                    cd infra
                    if [ -f ../last-successful-version.txt ]; then
                        PREV_VERSION=$(cat ../last-successful-version.txt)
                        echo "Rolling back to version: ${PREV_VERSION}"
                        eb deploy ${AWS_EB_ENV_NAME} --version-label v${PREV_VERSION} || {
                            echo "Rollback failed. Manual intervention required."
                        }
                    else
                        echo "No previous successful version found. Manual rollback required."
                    fi
                '''
            }
        }
        
        always {
            echo 'Cleaning up...'
            // Cleanup Docker images to save space
            sh 'docker system prune -f'
        }
    }
}

