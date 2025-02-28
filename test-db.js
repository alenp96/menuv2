import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: '172.29.240.1',
  port: 5432,
  database: 'meni',
  user: 'postgres',
  password: '854KPaafpjs6VhC'
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');
    const result = await client.query('SELECT NOW()');
    console.log('Current time from database:', result.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  }
}

testConnection(); 