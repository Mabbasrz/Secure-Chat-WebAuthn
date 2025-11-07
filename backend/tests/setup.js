// Jest setup file for backend tests
require('dotenv').config({ path: '.env.test' });

// Mock console in tests if needed
global.console = {
  ...console,
  // Suppress logs during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.MONGODB_URI = 'mongodb://test:test@localhost:27017/cryptalk-test';
process.env.FRONTEND_URL = 'http://localhost:3000';
