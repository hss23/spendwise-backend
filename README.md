# SpendWise Backend API

A comprehensive budget and expense tracking backend built with NestJS, MongoDB, Redis, and Kafka.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based auth with role-based access
- **Expense Management** - Track and categorize expenses with receipt scanning
- **Budget Management** - Set budgets with intelligent alerts and tracking
- **Goal-Based Savings** - Set financial goals with progress tracking
- **Recurring Expenses** - Automate recurring payments and bills
- **Multi-Currency Support** - Support for multiple currencies
- **Offline Capabilities** - Redis caching for offline functionality
- **Analytics & Reporting** - Comprehensive financial insights and reports

### Advanced Features
- **Smart Notifications** - Real-time alerts via Kafka
- **Receipt OCR** - Automatic expense extraction from receipts
- **Financial Health Score** - AI-powered financial health analysis
- **Data Export** - Export data in CSV/PDF formats
- **Auto-Save Goals** - Automated savings contributions
- **Budget Auto-Renewal** - Automatic budget period management

## 🛠 Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for session management and caching
- **Message Queue**: Apache Kafka for real-time notifications
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Task Scheduling**: Node-cron for automated tasks

## 📋 Prerequisites

- Node.js (v18+ recommended)
- MongoDB (v5.0+)
- Redis (v6.0+)
- Apache Kafka (v2.8+)

## 🚦 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd spendwise-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/spendwise
MONGODB_TEST_URI=mongodb://localhost:27017/spendwise-test

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=spendwise-backend
KAFKA_GROUP_ID=spendwise-consumer-group

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DEST=./uploads
```

### 4. Start Required Services

#### MongoDB
```bash
# Using Docker
docker run --name mongodb -p 27017:27017 -d mongo:latest

# Or install locally and start
mongod
```

#### Redis
```bash
# Using Docker
docker run --name redis -p 6379:6379 -d redis:latest

# Or install locally and start
redis-server
```

#### Kafka (Optional - for notifications)
```bash
# Using Docker Compose
docker-compose up kafka zookeeper
```

### 5. Run the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: `http://localhost:3000/api`
- **API JSON**: `http://localhost:3000/api-json`

### Main API Endpoints

#### Authentication
```
POST /auth/register    - Register new user
POST /auth/login       - User login
POST /auth/refresh     - Refresh JWT token
POST /auth/logout      - User logout
```

#### User Management
```
GET    /users/profile     - Get user profile
PATCH  /users/profile     - Update user profile
POST   /users/subscription - Update subscription
```

#### Categories
```
GET    /categories         - Get all categories
POST   /categories         - Create category
POST   /categories/default - Create default categories
PATCH  /categories/:id     - Update category
DELETE /categories/:id     - Delete category
```

#### Expenses
```
GET    /expenses           - Get all expenses
POST   /expenses           - Create expense
GET    /expenses/:id       - Get expense by ID
PATCH  /expenses/:id       - Update expense
DELETE /expenses/:id       - Delete expense
POST   /expenses/bulk      - Bulk create expenses
```

#### Budgets
```
GET    /budgets            - Get all budgets
POST   /budgets            - Create budget
GET    /budgets/summary    - Budget summary
GET    /budgets/:id        - Get budget by ID
PATCH  /budgets/:id        - Update budget
DELETE /budgets/:id        - Delete budget
```

#### Goals
```
GET    /goals              - Get all goals
POST   /goals              - Create goal
GET    /goals/summary      - Goals summary
POST   /goals/:id/contribute - Contribute to goal
PATCH  /goals/:id          - Update goal
DELETE /goals/:id          - Delete goal
```

#### Recurring Expenses
```
GET    /recurring-expenses           - Get all recurring expenses
POST   /recurring-expenses           - Create recurring expense
GET    /recurring-expenses/upcoming  - Get upcoming expenses
POST   /recurring-expenses/:id/process - Process recurring expense
```

#### Notifications
```
GET    /notifications          - Get all notifications
GET    /notifications/unread-count - Get unread count
PATCH  /notifications/:id/read - Mark as read
PATCH  /notifications/read/all - Mark all as read
```

#### Reports & Analytics
```
GET /reports/analytics         - Spending analytics
GET /reports/monthly-trends    - Monthly spending trends
GET /reports/budget-performance - Budget performance
GET /reports/goals-progress    - Goals progress
GET /reports/financial-health  - Financial health score
GET /reports/comparison        - Period comparison
GET /reports/export           - Export data (CSV/PDF)
```

## 🏗 Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── kafka.config.ts
│   └── redis.config.ts
├── modules/             # Feature modules
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   ├── categories/     # Expense categories
│   ├── expenses/       # Expense tracking
│   ├── budgets/        # Budget management
│   ├── goals/          # Savings goals
│   ├── recurring-expenses/ # Recurring payments
│   ├── transactions/   # Transaction history
│   ├── receipts/       # Receipt management & OCR
│   ├── notifications/  # Real-time notifications
│   └── reports/        # Analytics & reporting
├── common/             # Shared utilities
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── app.module.ts       # Main application module
└── main.ts            # Application entry point
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** to prevent abuse
- **Data Validation** using class-validator
- **Password Hashing** with bcryptjs
- **Request Throttling** per user/IP
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers

## 📊 Monitoring & Observability

- **Health Checks** endpoint at `/health`
- **Metrics** endpoint at `/metrics`
- **Logging** with structured logging
- **Error Tracking** with detailed error responses
- **Performance Monitoring** with caching strategies

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🚀 Deployment

### Using Docker

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-mongo-cluster/spendwise
REDIS_URL=redis://your-redis-cluster:6379
KAFKA_BROKERS=your-kafka-cluster:9092
JWT_SECRET=your-super-secure-jwt-secret
```

## 📈 Performance Optimizations

- **Redis Caching** for frequently accessed data
- **Database Indexing** on commonly queried fields
- **Pagination** for large data sets
- **Lazy Loading** for related data
- **Background Jobs** for heavy computations
- **Connection Pooling** for database connections

## 🔄 Background Jobs

The application includes several automated tasks:
- **Budget Renewal** (daily at midnight)
- **Goal Auto-Save** (every 6 hours)
- **Notification Cleanup** (daily)
- **Report Generation** (scheduled)
- **Recurring Expense Processing** (every 6 hours)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [API Documentation](http://localhost:3000/api)
- Review the test files for usage examples

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Basic expense tracking
- [x] Budget management
- [x] Goals and savings
- [x] User authentication
- [x] Basic reporting

### Phase 2 (Next)
- [ ] Advanced analytics with ML
- [ ] Mobile app API enhancements
- [ ] Bank account integration
- [ ] Investment tracking
- [ ] Tax reporting features

### Phase 3 (Future)
- [ ] Multi-tenant architecture
- [ ] Advanced AI insights
- [ ] Cryptocurrency support
- [ ] Social features
- [ ] Advanced automation
