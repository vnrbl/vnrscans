const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const newUrl = 'postgresql://postgres:Vnr610%40Supabase%232005@db.nzxrshkpjdkrbnsonxos.supabase.co:5432/postgres';

async function main() {
  const client = new Client({ connectionString: newUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to new DB!');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} migration files to apply.`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    process.stdout.write(`Applying ${file}... `);
    try {
      await client.query(sql);
      console.log('✅');
    } catch (err) {
      console.log(`⚠️ (${err.message.split('\n')[0]})`);
    }
  }

  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log('\nCreated tables in new DB:');
  for (const row of res.rows) {
    console.log(` - ${row.table_name}`);
  }

  await client.end();
}

main().catch(console.error);
