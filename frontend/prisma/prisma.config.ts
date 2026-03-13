// Prisma 7 Configuration
// Database connection URL - mac:@ means user 'mac' with empty password

export default {
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://mac:@localhost:5433/optical_fiber_dev',
};
