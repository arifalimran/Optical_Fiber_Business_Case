const pool = require('./database');

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        project_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Financial data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_data (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        initial_investment NUMERIC(15, 2) NOT NULL,
        annual_revenue NUMERIC(15, 2),
        annual_operating_costs NUMERIC(15, 2),
        maintenance_costs NUMERIC(15, 2),
        discount_rate NUMERIC(5, 2),
        project_lifetime INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Market data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        target_customers INTEGER,
        market_size NUMERIC(15, 2),
        competition_level VARCHAR(50),
        market_growth_rate NUMERIC(5, 2),
        customer_acquisition_cost NUMERIC(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Technical data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS technical_data (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        fiber_length NUMERIC(10, 2),
        fiber_type VARCHAR(100),
        installation_complexity VARCHAR(50),
        technology_readiness VARCHAR(50),
        infrastructure_available BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Risk assessment table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_assessment (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        technical_risk INTEGER CHECK (technical_risk BETWEEN 1 AND 10),
        financial_risk INTEGER CHECK (financial_risk BETWEEN 1 AND 10),
        market_risk INTEGER CHECK (market_risk BETWEEN 1 AND 10),
        regulatory_risk INTEGER CHECK (regulatory_risk BETWEEN 1 AND 10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Analysis results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        npv NUMERIC(15, 2),
        roi NUMERIC(10, 2),
        payback_period NUMERIC(5, 2),
        irr NUMERIC(5, 2),
        feasibility_score INTEGER CHECK (feasibility_score BETWEEN 0 AND 100),
        recommendation VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ All tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();
