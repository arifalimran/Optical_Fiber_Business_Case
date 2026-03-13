import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create Prisma client with adapter
const connectionString = process.env.DATABASE_URL || 'postgresql://mac:@localhost:5433/optical_fiber_dev';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@opticalfiber.com' },
    update: {},
    create: {
      email: 'admin@opticalfiber.com',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create sample analyst user
  const analystPasswordHash = await bcrypt.hash('analyst123', 12);
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@opticalfiber.com' },
    update: {},
    create: {
      email: 'analyst@opticalfiber.com',
      passwordHash: analystPasswordHash,
      fullName: 'John Analyst',
      role: 'ANALYST',
      isActive: true,
    },
  });
  console.log('✅ Created analyst user:', analyst.email);

  // Create sample approver user
  const approverPasswordHash = await bcrypt.hash('approver123', 12);
  const approver = await prisma.user.upsert({
    where: { email: 'approver@opticalfiber.com' },
    update: {},
    create: {
      email: 'approver@opticalfiber.com',
      passwordHash: approverPasswordHash,
      fullName: 'Jane Approver',
      role: 'APPROVER',
      isActive: true,
    },
  });
  console.log('✅ Created approver user:', approver.email);

  // Create Optical Fiber template
  const fiberTemplate = await prisma.projectTemplate.upsert({
    where: { templateCode: 'OPTICAL_FIBER' },
    update: {},
    create: {
      templateCode: 'OPTICAL_FIBER',
      templateName: 'Optical Fiber Installation',
      category: 'Telecom Infrastructure',
      icon: 'Cable',
      description: 'Underground and overhead optical fiber cable laying and installation projects',
      displayOrder: 1,
      inputSchema: {
        fields: [
          {
            name: 'underground_length',
            label: 'Underground Cable Length',
            type: 'number',
            unit: 'meters',
            required: true,
            min: 0,
            default: 0,
          },
          {
            name: 'overhead_length',
            label: 'Overhead Cable Length',
            type: 'number',
            unit: 'meters',
            required: true,
            min: 0,
            default: 0,
          },
          {
            name: 'number_of_rings',
            label: 'Number of Rings',
            type: 'number',
            required: true,
            min: 1,
            default: 2,
          },
          {
            name: 'number_of_links',
            label: 'Number of Links',
            type: 'number',
            required: true,
            min: 1,
            default: 10,
          },
          {
            name: 'has_jrc',
            label: 'Joint Repeatered Connection (JRC)',
            type: 'boolean',
            default: false,
          },
          {
            name: 'jrc_count',
            label: 'Number of JRCs',
            type: 'number',
            conditional: { field: 'has_jrc', value: true },
            min: 0,
            default: 0,
          },
          {
            name: 'has_splitter',
            label: 'Include Splitters',
            type: 'boolean',
            default: false,
          },
          {
            name: 'splitter_count',
            label: 'Number of Splitters',
            type: 'number',
            conditional: { field: 'has_splitter', value: true },
            min: 0,
            default: 0,
          },
          {
            name: 'cable_type',
            label: 'Cable Type',
            type: 'select',
            options: ['Single Mode', 'Multi Mode'],
            default: 'Single Mode',
          },
          {
            name: 'project_duration_months',
            label: 'Project Duration',
            type: 'number',
            unit: 'months',
            required: true,
            min: 1,
            default: 12,
          },
          {
            name: 'client_advance_percentage',
            label: 'Client Advance Payment',
            type: 'number',
            unit: '%',
            min: 0,
            max: 100,
            default: 20,
          },
          {
            name: 'payment_terms',
            label: 'Payment Terms',
            type: 'select',
            options: ['30 days', '45 days', '60 days', '90 days'],
            default: '30 days',
          },
        ],
      },
      costCategories: {
        categories: [
          'Mobilization',
          'Equipment',
          'Manpower',
          'Materials',
          'Civil Works',
          'Design & Survey',
          'Overhead',
          'Testing & Commissioning',
          'Financing',
          'Revenue & Tax',
        ],
      },
      revenueModel: {
        type: 'PER_METER',
        items: [
          {
            name: 'underground_rate',
            label: 'Underground Rate',
            unit: 'BDT/meter',
            default: 1200,
          },
          {
            name: 'overhead_rate',
            label: 'Overhead Rate',
            unit: 'BDT/meter',
            default: 800,
          },
        ],
      },
    },
  });
  console.log('✅ Created template:', fiberTemplate.templateName);

  // Create 5G Tower Conversion template
  const towerTemplate = await prisma.projectTemplate.upsert({
    where: { templateCode: '5G_TOWER_CONVERSION' },
    update: {},
    create: {
      templateCode: '5G_TOWER_CONVERSION',
      templateName: '5G Tower Conversion',
      category: 'Mobile Network',
      icon: 'Radio',
      description: '4G to 5G tower conversion and upgrade projects for mobile network operators',
      displayOrder: 2,
      inputSchema: {
        fields: [
          {
            name: 'number_of_towers',
            label: 'Number of Towers',
            type: 'number',
            required: true,
            min: 1,
            default: 1,
          },
          {
            name: 'tower_type',
            label: 'Tower Type',
            type: 'select',
            options: ['Monopole', 'Lattice', 'Guyed', 'Rooftop'],
            default: 'Monopole',
          },
          {
            name: 'operator',
            label: 'Mobile Operator',
            type: 'select',
            options: ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk'],
            required: true,
          },
          {
            name: 'vendor',
            label: 'Equipment Vendor',
            type: 'select',
            options: ['Huawei', 'ZTE', 'Nokia', 'Ericsson'],
            required: true,
          },
          {
            name: 'requires_structural_upgrade',
            label: 'Requires Structural Upgrade',
            type: 'boolean',
            default: false,
          },
          {
            name: 'requires_power_upgrade',
            label: 'Requires Power System Upgrade',
            type: 'boolean',
            default: true,
          },
          {
            name: 'requires_fiber_backhaul',
            label: 'Requires Fiber Backhaul',
            type: 'boolean',
            default: false,
          },
          {
            name: 'location_category',
            label: 'Location Category',
            type: 'select',
            options: ['Urban', 'Rural', 'Remote'],
            default: 'Urban',
          },
          {
            name: 'project_duration_months',
            label: 'Project Duration',
            type: 'number',
            unit: 'months',
            required: true,
            min: 1,
            default: 6,
          },
          {
            name: 'payment_terms',
            label: 'Payment Terms',
            type: 'select',
            options: ['Per Tower', 'Monthly', 'Milestone-based'],
            default: 'Per Tower',
          },
        ],
      },
      costCategories: {
        categories: [
          'Equipment & Hardware',
          'Installation Labor',
          'Structural Upgrades',
          'Power System',
          'Testing & Integration',
          'Project Management',
          'Contingency',
        ],
      },
      revenueModel: {
        type: 'PER_TOWER',
        items: [
          {
            name: 'per_tower_rate',
            label: 'Revenue per Tower',
            unit: 'BDT/tower',
            default: 500000,
          },
        ],
      },
    },
  });
  console.log('✅ Created template:', towerTemplate.templateName);

  // Create sample cost parameters for Optical Fiber template
  const fiberCostParams = [
    // Mobilization
    { category: 'Mobilization', itemName: 'Site Setup', rate: 50000, unit: 'lump sum', frequency: 'ONE_TIME' },
    { category: 'Mobilization', itemName: 'Transport', rate: 30000, unit: 'per month', frequency: 'MONTHLY' },
    
    // Equipment
    { category: 'Equipment', itemName: 'Trenching Machine', rate: 80000, unit: 'per month', frequency: 'MONTHLY' },
    { category: 'Equipment', itemName: 'Fusion Splicer', rate: 5000, unit: 'per splice', frequency: 'PER_SPLICE' },
    
    // Manpower
    { category: 'Manpower', itemName: 'Project Manager', rate: 60000, unit: 'per month', frequency: 'MONTHLY' },
    { category: 'Manpower', itemName: 'Technician', rate: 30000, unit: 'per month', frequency: 'MONTHLY' },
    { category: 'Manpower', itemName: 'Labor', rate: 800, unit: 'per day', frequency: 'DAILY' },
    
    // Materials
    { category: 'Materials', itemName: 'Fiber Cable (Underground)', rate: 150, unit: 'per meter', frequency: 'PER_METER' },
    { category: 'Materials', itemName: 'Fiber Cable (Overhead)', rate: 100, unit: 'per meter', frequency: 'PER_METER' },
    { category: 'Materials', itemName: 'HDPE Duct', rate: 80, unit: 'per meter', frequency: 'PER_METER' },
    
    // Civil Works
    { category: 'Civil Works', itemName: 'Trenching', rate: 200, unit: 'per meter', frequency: 'PER_METER' },
    { category: 'Civil Works', itemName: 'Duct Laying', rate: 150, unit: 'per meter', frequency: 'PER_METER' },
    
    // Overhead
    { category: 'Overhead', itemName: 'Office Rent', rate: 20000, unit: 'per month', frequency: 'MONTHLY' },
    { category: 'Overhead', itemName: 'Utilities', rate: 10000, unit: 'per month', frequency: 'MONTHLY' },
  ];

  for (const param of fiberCostParams) {
    await prisma.templateCostParameter.create({
      data: {
        templateCode: 'OPTICAL_FIBER',
        ...param,
      },
    });
  }
  console.log(`✅ Created ${fiberCostParams.length} cost parameters for Optical Fiber template`);

  // Create sample cost parameters for 5G Tower template
  const towerCostParams = [
    // Equipment
    { category: 'Equipment & Hardware', itemName: '5G RRU', rate: 180000, unit: 'per tower', frequency: 'PER_TOWER' },
    { category: 'Equipment & Hardware', itemName: 'BBU', rate: 120000, unit: 'per tower', frequency: 'PER_TOWER' },
    { category: 'Equipment & Hardware', itemName: 'Antenna', rate: 80000, unit: 'per tower', frequency: 'PER_TOWER' },
    
    // Labor
    { category: 'Installation Labor', itemName: 'RF Engineer', rate: 50000, unit: 'per month', frequency: 'MONTHLY' },
    { category: 'Installation Labor', itemName: 'Installation Team', rate: 25000, unit: 'per tower', frequency: 'PER_TOWER' },
    
    // Structural
    { category: 'Structural Upgrades', itemName: 'Tower Reinforcement', rate: 100000, unit: 'per tower', frequency: 'PER_TOWER', isConditional: true },
    
    // Power
    { category: 'Power System', itemName: 'Rectifier Upgrade', rate: 50000, unit: 'per tower', frequency: 'PER_TOWER' },
    { category: 'Power System', itemName: 'Battery Backup', rate: 80000, unit: 'per tower', frequency: 'PER_TOWER' },
    
    // Testing
    { category: 'Testing & Integration', itemName: 'System Integration', rate: 30000, unit: 'per tower', frequency: 'PER_TOWER' },
    { category: 'Testing & Integration', itemName: 'Drive Test', rate: 15000, unit: 'per tower', frequency: 'PER_TOWER' },
    
    // PM
    { category: 'Project Management', itemName: 'PM Cost', rate: 20000, unit: 'per tower', frequency: 'PER_TOWER' },
  ];

  for (const param of towerCostParams) {
    await prisma.templateCostParameter.create({
      data: {
        templateCode: '5G_TOWER_CONVERSION',
        ...param,
      },
    });
  }
  console.log(`✅ Created ${towerCostParams.length} cost parameters for 5G Tower template`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin:    admin@opticalfiber.com / admin123');
  console.log('   Analyst:  analyst@opticalfiber.com / analyst123');
  console.log('   Approver: approver@opticalfiber.com / approver123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
