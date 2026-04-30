const bcrypt = require('bcryptjs');
const db = require('./config/db');
require('dotenv').config();

async function seed() {
  try {
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const staffPass = await bcrypt.hash('staff123', salt);
    const userPass = await bcrypt.hash('user123', salt);

    console.log('Seeding demo accounts...');

    // Clean up
    await db.query('DELETE FROM purchases');
    await db.query('DELETE FROM datasets');
    await db.query('DELETE FROM users');

    // Admin
    await db.query(
      'INSERT INTO users (email, password_hash, role, company_name) VALUES ($1, $2, $3, $4)',
      ['admin@datamarket.com', adminPass, 'admin', 'DataMarket Global Admin']
    );

    // Staff
    await db.query(
      'INSERT INTO users (email, password_hash, role, company_name) VALUES ($1, $2, $3, $4)',
      ['staff@datamarket.com', staffPass, 'staff', 'Marketplace Operations']
    );

    // User/Seller
    const seller = await db.query(
      'INSERT INTO users (email, password_hash, role, company_name) VALUES ($1, $2, $3, $4) RETURNING id',
      ['seller@datamarket.com', userPass, 'seller', 'Premium Data Corp']
    );

    // User/Buyer
    await db.query(
      'INSERT INTO users (email, password_hash, role, company_name) VALUES ($1, $2, $3, $4)',
      ['buyer@datamarket.com', userPass, 'buyer', 'Research Hub']
    );

    // Initial Datasets
    await db.query(
      `INSERT INTO datasets (seller_id, title, description, category, price_cents, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [seller.rows[0].id, 'Financial Transactions 2024', 'Anonymized global transaction data for Q1 2024.', 'Finance', 49900, 'active']
    );

    await db.query(
      `INSERT INTO datasets (seller_id, title, description, category, price_cents, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [seller.rows[0].id, 'Pending Healthcare Trends', 'Sensitive healthcare trends awaiting validation.', 'Healthcare', 29900, 'pending']
    );

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
