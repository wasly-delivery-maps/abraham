import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:VtRhhnbMJhLnnVAQXyPavWPpMERpjPFe@crossover.proxy.rlwy.net:57117/railway';

async function testConnection() {
  console.log('Testing connection to:', dbUrl);
  try {
    const connection = await mysql.createConnection(dbUrl);
    console.log('Successfully connected to the database!');
    
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables in database:', rows);
    
    await connection.end();
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

testConnection();
