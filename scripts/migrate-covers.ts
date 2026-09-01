import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Step 1: Create series_covers table
  console.log('Step 1: Creating series_covers table...');
  const { error: createErr } = await supabase.rpc('exec_sql' as any, {
    sql: `
      CREATE TABLE IF NOT EXISTS series_covers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `
  });
  
  // If rpc doesn't work, try raw REST approach
  // We'll use the supabase client to do it step by step
  
  // Step 2: Check if we can query the table
  console.log('Step 2: Checking if series_covers table exists...');
  const { data: testData, error: testErr } = await supabase
    .from('series_covers')
    .select('id')
    .limit(1);
  
  if (testErr) {
    console.log('Table does not exist yet or is not accessible:', testErr.message);
    console.log('');
    console.log('⚠️  Please run the migration SQL manually in the Supabase SQL Editor:');
    console.log('   File: supabase/migrations/20260709120000_create_series_covers.sql');
    process.exit(1);
  }
  
  console.log('✅ series_covers table exists and is accessible');
  
  // Step 3: Count existing covers chapters
  console.log('Step 3: Checking for existing "covers" chapters...');
  const { data: coversChapters, error: coversErr } = await supabase
    .from('chapters')
    .select('id, series_id, slug')
    .eq('slug', 'covers')
    .eq('chapter_number', 0);
  
  if (coversErr) {
    console.error('Error querying covers chapters:', coversErr);
    process.exit(1);
  }
  
  console.log(`Found ${coversChapters?.length ?? 0} covers chapters`);
  
  if (coversChapters && coversChapters.length > 0) {
    // Step 4: For each covers chapter, migrate its pages to series_covers
    for (const ch of coversChapters) {
      console.log(`  Migrating covers for chapter ${ch.id} (series: ${ch.series_id})...`);
      
      const { data: pages, error: pagesErr } = await supabase
        .from('chapter_pages')
        .select('image_url, page_number, created_at')
        .eq('chapter_id', ch.id)
        .order('page_number');
      
      if (pagesErr) {
        console.error(`  Error fetching pages for chapter ${ch.id}:`, pagesErr);
        continue;
      }
      
      if (pages && pages.length > 0) {
        console.log(`  Found ${pages.length} cover images to migrate`);
        
        for (const page of pages) {
          // Check if already migrated
          const { data: existing } = await supabase
            .from('series_covers')
            .select('id')
            .eq('series_id', ch.series_id)
            .eq('image_url', page.image_url)
            .maybeSingle();
          
          if (!existing) {
            const { error: insertErr } = await supabase
              .from('series_covers')
              .insert({
                series_id: ch.series_id,
                image_url: page.image_url,
                position: page.page_number,
                created_at: page.created_at,
              });
            
            if (insertErr) {
              console.error(`  Error inserting cover: ${insertErr.message}`);
            } else {
              console.log(`    ✅ Migrated: ${page.image_url.substring(0, 80)}...`);
            }
          } else {
            console.log(`    ⏭️  Already exists: ${page.image_url.substring(0, 80)}...`);
          }
        }
      }
      
      // Step 5: Delete the covers chapter (cascade deletes pages)
      console.log(`  Deleting covers chapter ${ch.id}...`);
      const { error: deleteErr } = await supabase
        .from('chapters')
        .delete()
        .eq('id', ch.id);
      
      if (deleteErr) {
        console.error(`  Error deleting chapter: ${deleteErr.message}`);
      } else {
        console.log(`  ✅ Deleted covers chapter ${ch.id}`);
      }
    }
  }
  
  // Step 6: Verify
  console.log('');
  console.log('Step 6: Verification...');
  const { data: remainingCovers } = await supabase
    .from('chapters')
    .select('id')
    .eq('slug', 'covers')
    .eq('chapter_number', 0);
  
  const { data: seriesCoversData, error: scErr } = await supabase
    .from('series_covers')
    .select('id');
  
  console.log(`  Remaining covers chapters: ${remainingCovers?.length ?? 0}`);
  console.log(`  Series covers records: ${seriesCoversData?.length ?? 'error: ' + scErr?.message}`);
  console.log('');
  console.log('✅ Migration complete!');
}

run().catch(console.error);
