# Monitoring and Rollback Strategy

## Overview

This document describes the monitoring and logging approach for the e-commerce microservices system, as well as the rollback strategy for handling deployment failures.

## Monitoring

### Application Logging

Each microservice implements structured logging:

#### Product Service Logging
- Logs incoming requests with timestamps
- Logs product retrieval operations
- Logs errors with context
- Example log format: `[2024-01-15T10:30:00.000Z] GET /products - Returning 5 products`

#### Order Service Logging
- Logs order creation events
- Logs inter-service communication (calls to product-service)
- Logs validation errors
- Logs calculation operations
- Example log format: `[2024-01-15T10:30:00.000Z] POST /orders - Order created: ID=1, User=user123, Total=$1999.98`

#### Frontend Logging
- Browser console logs for debugging
- Error logging for API failures

### CloudWatch Logs Integration

**AWS Elastic Beanstalk** automatically ships container logs to **AWS CloudWatch Logs**:

#### Configuration
- Defined in `Dockerrun.aws.json` for each container
- Log driver: `awslogs`
- Log groups:
  - `/aws/elasticbeanstalk/product-service`
  - `/aws/elasticbeanstalk/order-service`
  - `/aws/elasticbeanstalk/frontend`

#### Accessing Logs
1. **AWS Console**: Navigate to CloudWatch → Logs → Log Groups
2. **EB CLI**: `eb logs` command
3. **CloudWatch Logs Insights**: Query and analyze logs

#### Log Retention
- Default: 7 days (configurable)
- Can be extended for compliance/analysis needs

### Health Checks

#### Application-Level Health Checks

Each service exposes a `/health` endpoint:
- **Product Service**: `GET /health` → `{ status: 'healthy', service: 'product-service' }`
- **Order Service**: `GET /health` → `{ status: 'healthy', service: 'order-service' }`
- **Frontend**: `GET /health` → `healthy` (via nginx)

#### Container Health Checks

Defined in Dockerfiles and `Dockerrun.aws.json`:
- **Interval**: Check every 30 seconds
- **Timeout**: 3-5 seconds
- **Retries**: 3 attempts before marking unhealthy
- **Start Period**: 10 seconds grace period on startup

#### Elastic Beanstalk Health Monitoring

EB monitors:
- Container health status
- Application health endpoints
- Instance health (CPU, memory, network)
- Load balancer health checks

### Monitoring Signals

#### Success Indicators
- Health endpoints return 200 status
- Services respond within acceptable time
- No error patterns in logs
- Smoke tests pass

#### Failure Indicators
- Health endpoints return non-200 status
- Services timeout or fail to respond
- Error rate increases in logs
- Smoke tests fail
- CloudWatch alarms trigger (if configured)

## Rollback Strategy

### Automatic Rollback

#### Trigger Conditions
1. **Pipeline Failure**: Any stage fails after deployment
2. **Smoke Test Failure**: Post-deployment verification fails
3. **Health Check Failure**: EB detects unhealthy instances

#### Rollback Process (Jenkins Pipeline)

**Location**: `post { failure { ... } }` block in Jenkinsfile

**Steps**:
1. Pipeline detects failure
2. Reads last successful version from `last-successful-version.txt`
3. Executes: `eb deploy --version-label v<previous-version>`
4. EB performs rolling update to previous version
5. Health checks verify rollback success

**Code Example**:
```groovy
failure {
    sh '''
        cd infra
        if [ -f ../last-successful-version.txt ]; then
            PREV_VERSION=$(cat ../last-successful-version.txt)
            eb deploy ${AWS_EB_ENV_NAME} --version-label v${PREV_VERSION}
        fi
    '''
}
```

### Manual Rollback

#### Via AWS Console
1. Navigate to Elastic Beanstalk → Application → Application Versions
2. Select previous working version
3. Deploy to environment
4. Monitor deployment status

#### Via EB CLI
```bash
cd infra
eb deploy <environment-name> --version-label v<previous-version>
```

#### Via Jenkins (Manual Build)
- Trigger pipeline with previous commit SHA
- Or use Jenkins "Rollback" job (if configured)

### Version Management

#### Version Labeling
- Format: `v<git-commit-sha>`
- Example: `vabc1234`
- Stored in: `last-successful-version.txt` after successful deployment

#### Version History
- EB maintains application version history
- Previous versions remain available for rollback
- Can configure version retention policy

### Rollback Considerations

#### Data Consistency
- **Current Implementation**: In-memory storage (data lost on rollback)
- **Production Consideration**: Use persistent storage (database) to preserve data across rollbacks

#### Downtime During Rollback
- EB rolling updates minimize downtime
- Similar to forward deployment process
- Health checks ensure service availability

#### Rollback Validation
- After rollback, smoke tests should verify:
  - Services are accessible
  - Health endpoints respond
  - Core functionality works

## Monitoring Best Practices

### Logging Best Practices
1. **Structured Logging**: Consistent format with timestamps
2. **Log Levels**: Use appropriate levels (info, error, warn)
3. **Context**: Include relevant context (user ID, order ID, etc.)
4. **Sensitive Data**: Avoid logging passwords, tokens, PII

### Health Check Best Practices
1. **Lightweight**: Health checks should be fast
2. **Comprehensive**: Check critical dependencies
3. **Meaningful**: Return actual service status
4. **Frequent**: Regular checks for early failure detection

### Alerting (Future Enhancement)
- CloudWatch Alarms for error rates
- SNS notifications for critical failures
- Integration with PagerDuty/Slack for alerts

## Troubleshooting

### Common Issues

#### Service Unhealthy
1. Check CloudWatch logs for errors
2. Verify health endpoint manually
3. Check container resource limits
4. Review recent code changes

#### Rollback Fails
1. Verify previous version exists in EB
2. Check EB environment status
3. Review EB deployment logs
4. May require manual intervention

#### Logs Not Appearing in CloudWatch
1. Verify IAM permissions for log writing
2. Check log group configuration in Dockerrun.aws.json
3. Verify log driver is correctly set
4. Check EB environment configuration

## Summary

### Monitoring
- ✅ Application logs shipped to CloudWatch
- ✅ Health checks at container and application level
- ✅ EB monitors instance and application health
- ✅ Smoke tests verify deployment success

### Rollback
- ✅ Automatic rollback on pipeline failure
- ✅ Manual rollback via EB Console/CLI
- ✅ Version management with Git commit SHA
- ✅ Rolling updates minimize downtime

This approach provides sufficient monitoring and rollback capabilities for the assessment while keeping complexity manageable.

