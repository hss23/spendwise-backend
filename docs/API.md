# SpendWise API Documentation

## Overview

SpendWise is a comprehensive Budget & Expense Tracker backend API built with NestJS, MongoDB, Redis, and Kafka. This API provides all the functionality needed for a modern expense tracking and budgeting application.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "preferredCurrency": "USD"
}
```

## User Management

#### GET /users/profile
Get current user profile.

#### PUT /users/profile
Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "preferredCurrency": "USD",
  "timezone": "America/New_York"
}
```

#### PUT /users/subscription
Update subscription plan.

**Request Body:**
```json
{
  "plan": "PREMIUM"
}
```

## Categories

#### GET /categories
Get all user categories.

**Query Parameters:**
- `type`: EXPENSE | INCOME (optional)
- `isActive`: boolean (optional)

#### POST /categories
Create a new category.

**Request Body:**
```json
{
  "name": "Groceries",
  "description": "Food and household items",
  "type": "EXPENSE",
  "color": "#FF6B6B",
  "icon": "🛒"
}
```

#### PUT /categories/:id
Update a category.

#### DELETE /categories/:id
Delete a category (soft delete).

## Expenses

#### GET /expenses
Get user expenses with pagination and filtering.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `category`: category ID (optional)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `minAmount`: number (optional)
- `maxAmount`: number (optional)

#### POST /expenses
Create a new expense.

**Request Body:**
```json
{
  "amount": 25.50,
  "description": "Lunch at restaurant",
  "category": "category-id",
  "date": "2024-01-15T12:00:00.000Z",
  "paymentMethod": "CREDIT_CARD",
  "tags": ["lunch", "restaurant"],
  "location": "Downtown Cafe"
}
```

#### PUT /expenses/:id
Update an expense.

#### DELETE /expenses/:id
Delete an expense.

## Budgets

#### GET /budgets
Get user budgets.

**Query Parameters:**
- `status`: ACTIVE | PAUSED | COMPLETED | EXPIRED (optional)
- `period`: WEEKLY | MONTHLY | QUARTERLY | YEARLY (optional)

#### POST /budgets
Create a new budget.

**Request Body:**
```json
{
  "name": "Monthly Groceries",
  "amount": 500,
  "category": "category-id",
  "period": "MONTHLY",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.000Z",
  "alertThreshold": 80,
  "autoRenewal": true
}
```

#### PUT /budgets/:id
Update a budget.

#### DELETE /budgets/:id
Delete a budget.

#### GET /budgets/:id/progress
Get budget progress and spending analytics.

## Goals

#### GET /goals
Get user financial goals.

**Query Parameters:**
- `status`: ACTIVE | COMPLETED | PAUSED (optional)
- `priority`: LOW | MEDIUM | HIGH (optional)

#### POST /goals
Create a new financial goal.

**Request Body:**
```json
{
  "name": "Emergency Fund",
  "description": "Build 6-month emergency fund",
  "targetAmount": 10000,
  "currentAmount": 2500,
  "deadline": "2024-12-31T23:59:59.000Z",
  "priority": "HIGH",
  "category": "category-id",
  "autoSaveAmount": 300,
  "autoSaveFrequency": "MONTHLY"
}
```

#### PUT /goals/:id
Update a goal.

#### DELETE /goals/:id
Delete a goal.

#### PUT /goals/:id/contribute
Add money to a goal.

**Request Body:**
```json
{
  "amount": 100,
  "note": "Monthly contribution"
}
```

## Transactions

#### GET /transactions
Get transaction history.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `type`: EXPENSE | INCOME | TRANSFER (optional)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

#### POST /transactions
Create a new transaction.

**Request Body:**
```json
{
  "type": "EXPENSE",
  "amount": 150.00,
  "description": "Grocery shopping",
  "category": "category-id",
  "date": "2024-01-15T14:30:00.000Z",
  "paymentMethod": "DEBIT_CARD"
}
```

## Recurring Expenses

#### GET /recurring-expenses
Get all recurring expenses.

#### POST /recurring-expenses
Create a new recurring expense.

**Request Body:**
```json
{
  "name": "Netflix Subscription",
  "amount": 15.99,
  "category": "category-id",
  "frequency": "MONTHLY",
  "nextDueDate": "2024-02-01T00:00:00.000Z",
  "autoPayEnabled": true,
  "reminderDays": 3
}
```

#### PUT /recurring-expenses/:id
Update a recurring expense.

#### DELETE /recurring-expenses/:id
Delete a recurring expense.

## Reports

#### GET /reports/spending
Get spending analysis report.

**Query Parameters:**
- `period`: WEEKLY | MONTHLY | QUARTERLY | YEARLY (default: MONTHLY)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

#### GET /reports/budget-performance
Get budget performance report.

#### GET /reports/goal-progress
Get goals progress report.

#### GET /reports/financial-health
Get financial health score and insights.

#### GET /reports/export
Export financial data.

**Query Parameters:**
- `format`: CSV | PDF | JSON (default: JSON)
- `type`: expenses | budgets | goals | all (default: all)
- `startDate`: ISO date string (required)
- `endDate`: ISO date string (required)

## Notifications

#### GET /notifications
Get user notifications.

**Query Parameters:**
- `isRead`: boolean (optional)
- `type`: BUDGET_ALERT | GOAL_REMINDER | EXPENSE_REMINDER | SYSTEM (optional)

#### PUT /notifications/:id/read
Mark notification as read.

#### PUT /notifications/read-all
Mark all notifications as read.

#### DELETE /notifications/:id
Delete a notification.

## Receipts

#### GET /receipts
Get all receipts.

#### POST /receipts
Upload a receipt.

**Request Body (multipart/form-data):**
- `file`: Receipt image file
- `expense`: Expense ID (optional)

#### DELETE /receipts/:id
Delete a receipt.

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited:
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

## Webhook Events (Premium Feature)

SpendWise can send webhook events for real-time updates:

### Available Events
- `expense.created`
- `budget.exceeded`
- `goal.achieved`
- `recurring_expense.due`

### Webhook Payload Example
```json
{
  "event": "budget.exceeded",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "data": {
    "budget": { ... },
    "currentSpent": 850,
    "percentage": 102
  },
  "user": "user-id"
}
```

## Testing

Use the following test credentials for development:
- **Email**: test@spendwise.com
- **Password**: test123

## Support

For API support, contact: api-support@spendwise.com
