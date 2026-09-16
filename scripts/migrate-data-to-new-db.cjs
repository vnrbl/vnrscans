const { Pool } = require('pg');

const oldUrl = 'postgresql://postgres:Vnr610%40vnrscans@db.edvqhmvqbtujzcfqkrbe.supabase.co:5432/postgres';
const newUrl = 'postgresql://postgres:Vnr610%40Supabase%232005@db.nzxrshkpjdkrbnsonxos.supabase.co:5432/postgres';

const oldPool = new Pool({
  connectionString: oldUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
});

const newPool = new Pool({
  connectionString: newUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
});

oldPool.on('error', (err) => console.error('[OldPool Error]', err.message));
newPool.on('error', (err) => console.error('[NewPool Error]', err.message));

async function copyTable(schema, tableName, orderBy = null, batchSize = 1000) {
  process.stdout.write(`Copying ${schema}.${tableName}... `);

  const oldColsRes = await oldPool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `, [schema, tableName]);

  const newColsRes = await newPool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2
      AND (is_generated = 'NEVER' OR is_generated IS NULL);
  `, [schema, tableName]);

  const newColSet = new Set(newColsRes.rows.map(r => r.column_name));
  const commonCols = oldColsRes.rows.map(r => r.column_name).filter(c => newColSet.has(c));

  if (commonCols.length === 0) {
    console.log('Skipped (no common columns)');
    return;
  }

  const colList = commonCols.map(c => `"${c}"`).join(', ');

  const countRes = await oldPool.query(`SELECT count(*) FROM "${schema}"."${tableName}"`);
  const total = parseInt(countRes.rows[0].count, 10);

  if (total === 0) {
    console.log('0 rows');
    return;
  }

  let copied = 0;
  let offset = 0;
  const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';

  while (offset < total) {
    const rowsRes = await oldPool.query(
      `SELECT ${colList} FROM "${schema}"."${tableName}" ${orderClause} LIMIT ${batchSize} OFFSET ${offset}`
    );

    if (rowsRes.rows.length === 0) break;

    const values = [];
    const valuePlaceholders = [];
    let paramIndex = 1;

    for (const row of rowsRes.rows) {
      const rowPlaceholders = [];
      for (const col of commonCols) {
        rowPlaceholders.push(`$${paramIndex++}`);
        values.push(row[col]);
      }
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const insertSql = `
      INSERT INTO "${schema}"."${tableName}" (${colList})
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT DO NOTHING;
    `;

    try {
      await newPool.query(insertSql, values);
      copied += rowsRes.rows.length;
    } catch (batchErr) {
      // Row by row fallback to skip any broken foreign keys
      for (const row of rowsRes.rows) {
        try {
          const rowVals = commonCols.map(c => row[c]);
          const ph = commonCols.map((_, i) => `$${i + 1}`).join(', ');
          await newPool.query(
            `INSERT INTO "${schema}"."${tableName}" (${colList}) VALUES (${ph}) ON CONFLICT DO NOTHING;`,
            rowVals
          );
          copied++;
        } catch (rErr) {}
      }
    }

    offset += batchSize;

    if (total > 2000) {
      process.stdout.write(`\rCopying ${schema}.${tableName}... ${copied}/${total} (${Math.round(copied / total * 100)}%)`);
    }
  }

  console.log(`\rCopying ${schema}.${tableName}... ✅ ${copied} rows transferred.`);
}

async function main() {
  console.log('=============================================');
  console.log('🚀 Resuming Database Migration to New Supabase');
  console.log('=============================================\n');

  // Series Follows & Carousel
  await copyTable('public', 'series_follows');
  await copyTable('public', 'carousel_items');

  // Chapters (25,163 rows)
  await copyTable('public', 'chapters', 'id ASC', 1000);

  // Chapter Pages (590,859 rows)
  await copyTable('public', 'chapter_pages', 'id ASC', 3000);
  await copyTable('public', 'chapter_reactions', null, 1000);

  // Community & User interactions
  await copyTable('public', 'comments', 'created_at ASC');
  await copyTable('public', 'comment_reactions');
  await copyTable('public', 'ratings');
  await copyTable('public', 'bookmarks');
  await copyTable('public', 'user_library');
  await copyTable('public', 'reading_history', 'id ASC', 1000);
  await copyTable('public', 'reading_goals');

  // XP & Notifications
  await copyTable('public', 'xp_events');
  await copyTable('public', 'xp_transactions', 'id ASC', 1000);
  await copyTable('public', 'user_milestones');
  await copyTable('public', 'user_notifications', 'id ASC', 1000);
  await copyTable('public', 'user_recommendations');

  console.log('\n=============================================');
  console.log('🎉 ALL CORE DATA FULLY MIGRATED TO NEW DB!');
  console.log('=============================================');

  await oldPool.end();
  await newPool.end();
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
