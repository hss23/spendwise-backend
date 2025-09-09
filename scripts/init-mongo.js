// MongoDB initialization script for SpendWise
db = db.getSiblingDB('spendwise');

// Create users collection with indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });

// Create categories collection with indexes
db.categories.createIndex({ "user": 1, "name": 1 }, { unique: true });
db.categories.createIndex({ "type": 1 });
db.categories.createIndex({ "isActive": 1 });

// Create expenses collection with indexes
db.expenses.createIndex({ "user": 1, "date": -1 });
db.expenses.createIndex({ "category": 1 });
db.expenses.createIndex({ "user": 1, "category": 1, "date": -1 });

// Create budgets collection with indexes
db.budgets.createIndex({ "user": 1, "category": 1 });
db.budgets.createIndex({ "status": 1 });
db.budgets.createIndex({ "endDate": 1 });

// Create goals collection with indexes
db.goals.createIndex({ "user": 1 });
db.goals.createIndex({ "status": 1 });
db.goals.createIndex({ "deadline": 1 });

// Create transactions collection with indexes
db.transactions.createIndex({ "user": 1, "date": -1 });
db.transactions.createIndex({ "type": 1 });

// Create recurring expenses collection with indexes
db.recurringexpenses.createIndex({ "user": 1 });
db.recurringexpenses.createIndex({ "nextDueDate": 1 });
db.recurringexpenses.createIndex({ "isActive": 1, "nextDueDate": 1 });

// Create notifications collection with indexes
db.notifications.createIndex({ "user": 1, "createdAt": -1 });
db.notifications.createIndex({ "isRead": 1 });
db.notifications.createIndex({ "scheduledAt": 1 });
db.notifications.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

// Create receipts collection with indexes
db.receipts.createIndex({ "user": 1, "createdAt": -1 });
db.receipts.createIndex({ "expense": 1 });

print('SpendWise database initialized with indexes');

// Insert default categories for new users (these will be copied when users sign up)
db.defaultcategories.insertMany([
  {
    name: "Food & Dining",
    description: "Restaurants, groceries, food delivery",
    icon: "🍽️",
    color: "#FF6B6B",
    type: "EXPENSE",
    isDefault: true
  },
  {
    name: "Transportation",
    description: "Gas, public transport, rideshare",
    icon: "🚗",
    color: "#4ECDC4",
    type: "EXPENSE",
    isDefault: true
  },
  {
    name: "Shopping",
    description: "Clothing, electronics, general shopping",
    icon: "🛍️",
    color: "#45B7D1",
    type: "EXPENSE",
    isDefault: true
  },
  {
    name: "Entertainment",
    description: "Movies, games, subscriptions",
    icon: "🎬",
    color: "#96CEB4",
    type: "EXPENSE",
    isDefault: true
  },
  {
    name: "Bills & Utilities",
    description: "Rent, electricity, internet, phone",
    icon: "🏠",
    color: "#FFEAA7",
    type: "EXPENSE",
    isDefault: true
  },
  {
    name: "Healthcare",
    description: "Medical expenses, pharmacy, insurance",
    icon: "⚕️",
    color: "#FD79A8",
    type: "EXPENSE",
    isDefault: true
  },
  {
    name: "Education",
    description: "Books, courses, school fees",
    icon: "📚",
    color: "#A29BFE",
    type: "EXPENSE",
    isDefault: true
  },
  {
    name: "Travel",
    description: "Vacation, business trips, accommodation",
    icon: "✈️",
    color: "#FF7675",
    type: "EXPENSE",
    isDefault: true
  },
  {
    name: "Salary",
    description: "Monthly salary, bonuses",
    icon: "💰",
    color: "#00B894",
    type: "INCOME",
    isDefault: true
  },
  {
    name: "Freelance",
    description: "Freelance work, side projects",
    icon: "💼",
    color: "#6C5CE7",
    type: "INCOME",
    isDefault: true
  }
]);

print('Default categories inserted');

// Create admin user (optional - remove in production)
if (db.users.countDocuments({ email: "admin@spendwise.com" }) === 0) {
  db.users.insertOne({
    email: "admin@spendwise.com",
    password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsB5qjS5.",  // password: admin123
    firstName: "Admin",
    lastName: "User",
    preferredCurrency: "USD",
    subscriptionPlan: "LIFETIME",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Admin user created (admin@spendwise.com / admin123)');
}
