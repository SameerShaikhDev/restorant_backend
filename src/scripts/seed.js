require("dotenv").config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

// Import models
const User = require('../models/User.model');
const Category = require('../models/Category.model');
const MenuItem = require('../models/MenuItem.model');
const Table = require('../models/Table.model');

const seedDatabase = async () => {
  console.log("1. seedDatabase started");

  try {
    console.log("2. About to connect");
    console.log(env.MONGO_URI);

    await mongoose.connect(env.MONGO_URI);

    console.log("3. Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    const admin = new User({
      name: 'Admin User',
      email: 'admin@restaurant.com',
      passwordHash,
      role: 'manager',
      isActive: true,
    });
    await admin.save();

    const kitchen = new User({
      name: 'Kitchen Staff',
      email: 'kitchen@restaurant.com',
      passwordHash,
      role: 'kitchen',
      isActive: true,
    });
    await kitchen.save();

    const waiter = new User({
      name: 'Waiter Staff',
      email: 'waiter@restaurant.com',
      passwordHash,
      role: 'waiter',
      isActive: true,
    });
    await waiter.save();
    
    console.log('👤 Created staff accounts');
    console.log('  - Manager: admin@restaurant.com / admin123');
    console.log('  - Kitchen: kitchen@restaurant.com / admin123');
    console.log('  - Waiter: waiter@restaurant.com / admin123');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Appetizers', displayOrder: 1, isActive: true },
      { name: 'Main Course', displayOrder: 2, isActive: true },
      { name: 'Burgers & Sandwiches', displayOrder: 3, isActive: true },
      { name: 'Pizza', displayOrder: 4, isActive: true },
      { name: 'Pasta', displayOrder: 5, isActive: true },
      { name: 'Desserts', displayOrder: 6, isActive: true },
      { name: 'Beverages', displayOrder: 7, isActive: true },
      { name: 'Healthy Options', displayOrder: 8, isActive: true },
    ]);
    console.log(`📋 Created ${categories.length} categories`);

    // Create menu items
    const menuItems = [
      // Appetizers
      {
        name: 'Classic Bruschetta',
        description: 'Toasted bread topped with fresh tomatoes, garlic, basil, and olive oil',
        price: 8.99,
        categoryId: categories[0]._id,
        isVeg: true,
        isBestSeller: true,
        rating: 4.5,
        prepTimeMinutes: 10,
        spiceLevel: 'mild',
        ingredients: ['Bread', 'Tomatoes', 'Garlic', 'Basil', 'Olive Oil'],
      },
      {
        name: 'Crispy Calamari',
        description: 'Lightly fried calamari served with marinara sauce and lemon',
        price: 12.99,
        categoryId: categories[0]._id,
        isVeg: false,
        isBestSeller: false,
        rating: 4.2,
        prepTimeMinutes: 15,
        spiceLevel: 'medium',
        ingredients: ['Calamari', 'Flour', 'Marinara Sauce', 'Lemon'],
      },
      // Main Course
      {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon grilled to perfection, served with seasonal vegetables',
        price: 24.99,
        categoryId: categories[1]._id,
        isVeg: false,
        isBestSeller: true,
        rating: 4.8,
        prepTimeMinutes: 25,
        spiceLevel: 'mild',
        ingredients: ['Salmon', 'Olive Oil', 'Lemon', 'Vegetables'],
      },
      {
        name: 'Vegetable Stir Fry',
        description: 'Fresh seasonal vegetables stir-fried in a savory sauce with tofu',
        price: 16.99,
        categoryId: categories[1]._id,
        isVeg: true,
        isBestSeller: false,
        rating: 4.3,
        prepTimeMinutes: 20,
        spiceLevel: 'medium',
        ingredients: ['Broccoli', 'Carrots', 'Bell Peppers', 'Tofu', 'Soy Sauce'],
      },
      // Burgers
      {
        name: 'Classic Burger',
        description: 'Beef patty with lettuce, tomato, onion, and special sauce',
        price: 14.99,
        categoryId: categories[2]._id,
        isVeg: false,
        isBestSeller: true,
        rating: 4.6,
        prepTimeMinutes: 15,
        spiceLevel: 'medium',
        ingredients: ['Beef Patty', 'Lettuce', 'Tomato', 'Onion', 'Bun', 'Special Sauce'],
      },
      {
        name: 'Veggie Burger',
        description: 'Plant-based patty with avocado, sprouts, and chipotle mayo',
        price: 13.99,
        categoryId: categories[2]._id,
        isVeg: true,
        isBestSeller: false,
        rating: 4.1,
        prepTimeMinutes: 15,
        spiceLevel: 'hot',
        ingredients: ['Veggie Patty', 'Avocado', 'Sprouts', 'Chipotle Mayo', 'Bun'],
      },
      // Pizza
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, fresh mozzarella, and basil',
        price: 16.99,
        categoryId: categories[3]._id,
        isVeg: true,
        isBestSeller: true,
        rating: 4.7,
        prepTimeMinutes: 20,
        spiceLevel: 'mild',
        ingredients: ['Pizza Dough', 'Tomato Sauce', 'Mozzarella', 'Basil'],
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Pizza topped with pepperoni, mozzarella, and Italian herbs',
        price: 18.99,
        categoryId: categories[3]._id,
        isVeg: false,
        isBestSeller: true,
        rating: 4.5,
        prepTimeMinutes: 20,
        spiceLevel: 'medium',
        ingredients: ['Pizza Dough', 'Tomato Sauce', 'Mozzarella', 'Pepperoni'],
      },
      // Pasta
      {
        name: 'Spaghetti Carbonara',
        description: 'Classic Roman pasta with eggs, pecorino cheese, pancetta, and black pepper',
        price: 17.99,
        categoryId: categories[4]._id,
        isVeg: false,
        isBestSeller: false,
        rating: 4.4,
        prepTimeMinutes: 20,
        spiceLevel: 'mild',
        ingredients: ['Spaghetti', 'Eggs', 'Pecorino', 'Pancetta', 'Black Pepper'],
      },
      {
        name: 'Penne Arrabbiata',
        description: 'Penne pasta in a spicy tomato sauce with garlic and chili flakes',
        price: 15.99,
        categoryId: categories[4]._id,
        isVeg: true,
        isBestSeller: false,
        rating: 4.0,
        prepTimeMinutes: 18,
        spiceLevel: 'hot',
        ingredients: ['Penne', 'Tomatoes', 'Garlic', 'Chili Flakes'],
      },
      // Desserts
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream',
        price: 8.99,
        categoryId: categories[5]._id,
        isVeg: false,
        isBestSeller: true,
        rating: 4.7,
        prepTimeMinutes: 10,
        spiceLevel: 'mild',
        ingredients: ['Ladyfingers', 'Coffee', 'Mascarpone', 'Cocoa'],
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with a molten chocolate center, served with vanilla ice cream',
        price: 9.99,
        categoryId: categories[5]._id,
        isVeg: true,
        isBestSeller: false,
        rating: 4.6,
        prepTimeMinutes: 15,
        spiceLevel: 'mild',
        ingredients: ['Dark Chocolate', 'Eggs', 'Flour', 'Sugar', 'Vanilla Ice Cream'],
      },
      // Beverages
      {
        name: 'Fresh Lemonade',
        description: 'House-made lemonade with fresh lemons and mint',
        price: 4.99,
        categoryId: categories[6]._id,
        isVeg: true,
        isBestSeller: false,
        rating: 4.3,
        prepTimeMinutes: 5,
        spiceLevel: 'mild',
        ingredients: ['Lemons', 'Sugar', 'Mint', 'Water'],
      },
      {
        name: 'Craft Beer',
        description: 'Selection of local craft beers - ask server for current availability',
        price: 6.99,
        categoryId: categories[6]._id,
        isVeg: true,
        isBestSeller: false,
        rating: 4.1,
        prepTimeMinutes: 2,
        spiceLevel: 'mild',
        ingredients: ['Beer'],
      },
      // Healthy Options
      {
        name: 'Quinoa Bowl',
        description: 'Quinoa with roasted vegetables, chickpeas, and tahini dressing',
        price: 14.99,
        categoryId: categories[7]._id,
        isVeg: true,
        isBestSeller: false,
        rating: 4.4,
        prepTimeMinutes: 15,
        spiceLevel: 'medium',
        ingredients: ['Quinoa', 'Vegetables', 'Chickpeas', 'Tahini'],
      },
      {
        name: 'Grilled Chicken Salad',
        description: 'Fresh mixed greens with grilled chicken, avocado, and balsamic vinaigrette',
        price: 15.99,
        categoryId: categories[7]._id,
        isVeg: false,
        isBestSeller: false,
        rating: 4.2,
        prepTimeMinutes: 15,
        spiceLevel: 'mild',
        ingredients: ['Chicken', 'Mixed Greens', 'Avocado', 'Balsamic Vinaigrette'],
      },
    ];

    await MenuItem.insertMany(menuItems);
    console.log(`🍽️ Created ${menuItems.length} menu items`);

    // Create tables
    const tables = [];
    for (let i = 1; i <= 20; i++) {
      const tableNumber = `T${i.toString().padStart(3, '0')}`;
      const capacity = i <= 5 ? 2 : i <= 12 ? 4 : 6;
      const floorSection = i <= 8 ? 'Main' : i <= 15 ? 'Terrace' : 'Garden';
      
      // Make some tables reserved or occupied for demo
      let status = 'available';
      let reservedUntil = null;
      let reservedFor = '';
      
      if (i === 3) {
        status = 'reserved';
        reservedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
        reservedFor = 'John Smith';
      } else if (i === 7) {
        status = 'occupied';
      } else if (i === 12) {
        status = 'cleaning';
      }
      
      tables.push({
        tableNumber,
        capacity,
        floorSection,
        status,
        reservedUntil,
        reservedFor,
        qrCodeUrl: `https://yourdomain.com/?table=${tableNumber}`,
      });
    }

    await Table.insertMany(tables);
    console.log(`🪑 Created ${tables.length} tables`);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();