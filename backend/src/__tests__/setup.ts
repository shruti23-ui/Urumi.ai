// Test setup file
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'store_platform_test';
});

afterAll(async () => {
  // Cleanup
});
