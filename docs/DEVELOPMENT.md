# SpendWise Development Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (v6 or higher)
- **Redis** (v6 or higher)
- **Docker** and **Docker Compose** (optional, for containerized development)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd spendwise-backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=mongodb://localhost:27017/spendwise
DATABASE_HOST=localhost
DATABASE_PORT=27017
DATABASE_NAME=spendwise

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Kafka (optional)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=spendwise-backend

# Application
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start MongoDB and Redis
npm run docker:up

# Initialize database with indexes
npm run db:init
```

#### Option B: Local Installation

Ensure MongoDB and Redis are running locally, then:

```bash
# Initialize database
npm run db:init
```

### 4. Seed Database (Optional)

```bash
npm run seed
```

This creates a test user with default categories:
- **Email**: test@spendwise.com
- **Password**: test123

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── kafka.config.ts
│   └── redis.config.ts
├── modules/             # Feature modules
│   ├── auth/           # Authentication
│   ├── users/          # User management
│   ├── categories/     # Expense categories
│   ├── expenses/       # Expense tracking
│   ├── budgets/        # Budget management
│   ├── goals/          # Financial goals
│   ├── transactions/   # Transaction history
│   ├── recurring-expenses/ # Recurring expenses
│   ├── notifications/  # User notifications
│   ├── receipts/       # Receipt management
│   └── reports/        # Financial reports
├── app.module.ts       # Main application module
└── main.ts            # Application entry point

scripts/                # Utility scripts
├── init-mongo.js      # MongoDB initialization
└── seed.ts           # Database seeding

docs/                  # Documentation
└── API.md            # API documentation
```

## Development Workflow

### 1. Module Development Pattern

Each feature module follows NestJS conventions:

```
module-name/
├── dto/                    # Data Transfer Objects
│   └── module-name.dto.ts
├── schemas/               # MongoDB schemas
│   └── module-name.schema.ts
├── guards/               # Route guards (if needed)
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.module.ts
├── module-name.controller.spec.ts
└── module-name.service.spec.ts
```

### 2. Adding New Features

1. **Create the module structure**:
```bash
nest g module modules/feature-name
nest g controller modules/feature-name
nest g service modules/feature-name
```

2. **Define the schema** (`schemas/feature-name.schema.ts`):
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeatureDocument = Feature & Document;

@Schema({ timestamps: true })
export class Feature {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  // Add other fields
}

export const FeatureSchema = SchemaFactory.createForClass(Feature);
```

3. **Create DTOs** (`dto/feature-name.dto.ts`):
```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  // Add other validation rules
}

export class UpdateFeatureDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;
}
```

4. **Implement service logic** (`feature-name.service.ts`):
```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectModel(Feature.name) private featureModel: Model<FeatureDocument>,
  ) {}

  async create(userId: string, dto: CreateFeatureDto): Promise<Feature> {
    const feature = new this.featureModel({
      ...dto,
      user: new Types.ObjectId(userId),
    });
    return feature.save();
  }

  // Add other CRUD operations
}
```

5. **Create controller endpoints** (`feature-name.controller.ts`):
```typescript
@Controller('features')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new feature' })
  async create(@Req() req: any, @Body() dto: CreateFeatureDto) {
    return this.featureService.create(req.user.id, dto);
  }

  // Add other endpoints
}
```

### 3. Testing

#### Unit Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:cov          # Run tests with coverage
```

#### E2E Tests
```bash
npm run test:e2e
```

#### Manual Testing
Use tools like Postman or Insomnia with the API documentation in `docs/API.md`.

### 4. Debugging

#### Enable Debug Mode
```bash
npm run start:debug
```

Then attach your debugger to port 9229.

#### Logging
Use the built-in NestJS logger:

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  someMethod() {
    this.logger.log('This is a log message');
    this.logger.error('This is an error message');
    this.logger.debug('This is a debug message');
  }
}
```

## Database Management

### MongoDB Indexes

Indexes are automatically created by the `init-mongo.js` script. Key indexes include:

- User email (unique)
- Expense user + date
- Budget user + category
- Transaction user + date
- Notification expiration (TTL)

### Schema Changes

When modifying schemas:

1. Update the schema file
2. Consider migration needs for existing data
3. Update related DTOs and services
4. Add/update indexes if needed

### Backup and Restore

```bash
# Backup
mongodump --db spendwise --out backup/

# Restore
mongorestore backup/spendwise
```

## Caching Strategy

Redis is used for:

- **Session storage** (JWT token blacklist)
- **API response caching** (reports, analytics)
- **Rate limiting** (request throttling)
- **Background job queues** (notifications, recurring expenses)

### Cache Keys Convention

- `user:{userId}:profile` - User profile cache
- `reports:{userId}:{type}:{period}` - Report cache
- `budget:{budgetId}:progress` - Budget progress cache

## Background Jobs

The application uses `@nestjs/schedule` for cron jobs:

- **Daily**: Process recurring expenses
- **Weekly**: Generate budget alerts
- **Monthly**: Calculate financial health scores

### Adding New Cron Jobs

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MyService {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyTask() {
    // Your daily task logic
  }

  @Cron('0 0 * * 0') // Every Sunday at midnight
  async weeklyTask() {
    // Your weekly task logic
  }
}
```

## Performance Optimization

### Database Queries

1. **Use indexes** - Ensure queries use appropriate indexes
2. **Limit fields** - Use `.select()` to only fetch needed fields
3. **Pagination** - Always paginate large result sets
4. **Aggregation** - Use MongoDB aggregation for complex queries

### Caching

1. **Cache expensive operations** - Reports, analytics
2. **Set appropriate TTL** - Balance freshness vs performance
3. **Cache invalidation** - Clear cache when data changes

### Request Optimization

1. **Rate limiting** - Prevent API abuse
2. **Compression** - Enable gzip compression
3. **Validation** - Use DTOs for input validation

## Security Best Practices

### Authentication & Authorization

- JWT tokens with reasonable expiration
- Password hashing with bcrypt
- Protected routes with guards
- User-specific data isolation

### Data Validation

- Always validate input with DTOs
- Sanitize data before database operations
- Use TypeScript for type safety

### Environment Security

- Never commit secrets to version control
- Use environment variables for configuration
- Rotate secrets regularly

## Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Docker Deployment

```bash
npm run docker:build
docker run -p 3000:3000 spendwise-backend
```

### Environment Variables (Production)

Ensure these are set in production:

- `NODE_ENV=production`
- `DATABASE_URL` - Production MongoDB connection
- `REDIS_HOST` - Production Redis host
- `JWT_SECRET` - Strong secret key
- `PORT` - Application port

## Monitoring & Logging

### Health Checks

The application includes health check endpoints:

- `GET /health` - Application health
- `GET /health/db` - Database connectivity
- `GET /health/redis` - Redis connectivity

### Logging

Logs are structured and include:

- Request/response logging
- Error tracking
- Performance metrics
- Business event logging

### Metrics

Consider implementing:

- API response times
- Error rates
- Database query performance
- Cache hit rates

## Common Issues & Solutions

### 1. MongoDB Connection Issues

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

### 2. Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Should return "PONG"
```

### 3. Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>
```

### 4. TypeScript Compilation Errors

```bash
# Clean build
rm -rf dist/
npm run build
```

## Code Style & Standards

### ESLint Configuration

The project uses ESLint with NestJS recommended rules. Run:

```bash
npm run lint
```

### Prettier Configuration

Code formatting is handled by Prettier:

```bash
npm run format
```

### Commit Standards

Use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## Support

For development questions:
- Check the API documentation in `docs/API.md`
- Review existing code patterns
- Use the test database for experimentation

For issues or feature requests, create a GitHub issue with detailed information.
