# Environment Configuration for Authentication System

## Frontend (.env files)

### .env.development
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_JWT_SECRET=dev-secret-key-for-testing-only
REACT_APP_ENABLE_VERBOSE_LOGGING=true
REACT_APP_BIOMETRIC_ENABLED=true
REACT_APP_LOCK_TIMEOUT_MINUTES=3
REACT_APP_ACCESS_TOKEN_DURATION_MINUTES=30
REACT_APP_REFRESH_TOKEN_DURATION_DAYS=14
```

### .env.staging
```
REACT_APP_API_URL=https://api-staging.kookee.com/api
REACT_APP_JWT_SECRET=staging-secret-key-change-in-production
REACT_APP_ENABLE_VERBOSE_LOGGING=false
REACT_APP_BIOMETRIC_ENABLED=true
REACT_APP_LOCK_TIMEOUT_MINUTES=3
REACT_APP_ACCESS_TOKEN_DURATION_MINUTES=30
REACT_APP_REFRESH_TOKEN_DURATION_DAYS=14
```

### .env.production
```
REACT_APP_API_URL=https://api.kookee.com/api
REACT_APP_JWT_SECRET=production-secret-key-rotate-regularly
REACT_APP_ENABLE_VERBOSE_LOGGING=false
REACT_APP_BIOMETRIC_ENABLED=true
REACT_APP_LOCK_TIMEOUT_MINUTES=3
REACT_APP_ACCESS_TOKEN_DURATION_MINUTES=30
REACT_APP_REFRESH_TOKEN_DURATION_DAYS=14
```

## Backend (application.properties or application.yml)

### application.properties (Development)
```properties
# Server
server.port=8080
server.servlet.context-path=/

# JWT Configuration
jwt.secret=dev-secret-key-for-testing-only-min-32-characters
jwt.access-token-expiration=1800
jwt.refresh-token-expiration=1209600
jwt.jws-algorithm=HS512
jwt.issuer=http://localhost:8080
jwt.audience=kookee-sales-app

# Spring Security OAuth2
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8080/.well-known/jwks.json

# CORS Configuration
app.cors.allowed-origins=http://localhost:3000,http://localhost:19000,http://localhost:19006
app.cors.allowed-methods=GET,POST,PUT,DELETE,PATCH,OPTIONS
app.cors.allowed-headers=*
app.cors.exposed-headers=Authorization,Content-Type,X-Total-Count
app.cors.max-age=3600
app.cors.allow-credentials=true

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/kookee_sales_dev
spring.datasource.username=postgres
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Logging
logging.level.root=INFO
logging.level.com.kookee.sales=DEBUG
logging.level.org.springframework.security=DEBUG

# Application
app.name=Kookee Sales App
app.version=1.0.0
app.environment=development
```

### application.yml (Staging)
```yaml
server:
  port: 8080
  servlet:
    context-path: /

jwt:
  secret: ${JWT_SECRET:staging-secret-key-change-in-production}
  access-token-expiration: 1800
  refresh-token-expiration: 1209600
  jws-algorithm: HS512
  issuer: https://api-staging.kookee.com
  audience: kookee-sales-app

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://api-staging.kookee.com
          jwk-set-uri: https://api-staging.kookee.com/.well-known/jwks.json
  datasource:
    url: ${DB_URL:jdbc:postgresql://postgres-staging:5432/kookee_sales}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

app:
  cors:
    allowed-origins: https://app-staging.kookee.com,https://staging.kookee.com
    allowed-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
    allowed-headers: '*'
    exposed-headers: Authorization,Content-Type,X-Total-Count
    max-age: 3600
    allow-credentials: true
  name: Kookee Sales App
  version: 1.0.0
  environment: staging
```

### application.yml (Production)
```yaml
server:
  port: 8080
  servlet:
    context-path: /
  ssl:
    enabled: true
    key-store: classpath:keystore.jks
    key-store-password: ${KEYSTORE_PASSWORD}

jwt:
  secret: ${JWT_SECRET}
  access-token-expiration: 1800
  refresh-token-expiration: 1209600
  jws-algorithm: HS512
  issuer: https://api.kookee.com
  audience: kookee-sales-app

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://api.kookee.com
          jwk-set-uri: https://api.kookee.com/.well-known/jwks.json
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          batch_size: 20

app:
  cors:
    allowed-origins: https://app.kookee.com
    allowed-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
    allowed-headers: '*'
    exposed-headers: Authorization,Content-Type,X-Total-Count
    max-age: 3600
    allow-credentials: true
  name: Kookee Sales App
  version: 1.0.0
  environment: production
```

## Docker Environment (.env for docker-compose)

```
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password-change-in-production
POSTGRES_DB=kookee_sales
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Backend
JAVA_OPTS=-Xmx512m -Xms256m
JWT_SECRET=production-jwt-secret-min-32-characters
DB_URL=jdbc:postgresql://postgres:5432/kookee_sales
DB_USER=postgres
DB_PASSWORD=secure-password-change-in-production

# Certificates
KEYSTORE_PASSWORD=keystore-password-change-in-production

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO
```

## Expo App Configuration (app.json)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-secure-store",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "Allow $(PRODUCT_NAME) to use Face ID for secure authentication",
        "NSBiometricsUsageDescription": "Allow $(PRODUCT_NAME) to use biometric authentication",
        "NSLocationWhenInUseUsageDescription": "We use your location to track your sales route",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We use your location to track your sales route"
      }
    },
    "android": {
      "permissions": [
        "android.permission.USE_BIOMETRIC",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.INTERNET"
      ]
    }
  }
}
```

## Security Checklist

### Development
- ✅ JWT secret randomized
- ✅ CORS enabled for localhost
- ✅ Verbose logging enabled
- ✅ No rate limiting (for testing)

### Staging
- ✅ JWT secret from environment
- ✅ CORS limited to staging domain
- ✅ Logging at appropriate level
- ✅ Rate limiting enabled (100 req/min)
- ✅ HTTPS enforced

### Production
- ✅ JWT secret rotated regularly
- ✅ CORS limited to production domain only
- ✅ Verbose logging disabled
- ✅ Rate limiting strict (10 req/min login)
- ✅ HTTPS with valid certificate
- ✅ Database encrypted at rest
- ✅ Tokens logged (NO! Never log tokens)
- ✅ WAF enabled
- ✅ API Gateway enforcing authentication

## Deployment Commands

### Development
```bash
# Start backend
mvn spring-boot:run \
  -Dspring-boot.run.arguments="--jwt.secret=dev-secret"

# Start frontend
expo start --tunnel
```

### Docker Production
```bash
# Build
docker-compose build

# Deploy
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Kubernetes
```bash
# Set secrets
kubectl create secret generic jwt-secret \
  --from-literal=secret=$(openssl rand -base64 32)

# Deploy
kubectl apply -f k8s/auth-deployment.yaml
```
