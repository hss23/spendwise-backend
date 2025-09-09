import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { CategoriesService } from '../src/modules/categories/categories.service';
import { Currency } from '../src/modules/users/schemas/user.schema';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const categoriesService = app.get(CategoriesService);

  console.log('🌱 Starting database seeding...');

  try {
    // Create test user
    const testUser = await usersService.create({
      email: 'test@spendwise.com',
      password: 'test123',
      firstName: 'Test',
      lastName: 'User',
      preferredCurrency: Currency.USD,
    });

    console.log('✅ Test user created');

    // Create default categories for test user
    await categoriesService.createDefaultCategories((testUser as any).id || (testUser as any)._id.toString());

    console.log('✅ Default categories created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\nTest account credentials:');
    console.log('Email: test@spendwise.com');
    console.log('Password: test123');
    console.log('\nYou can now:');
    console.log('1. Start the application: npm run start:dev');
    console.log('2. Login with the test credentials');
    console.log('3. Create expenses, budgets, and goals through the API');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  console.error('❌ Seed script failed:', error);
  process.exit(1);
});
