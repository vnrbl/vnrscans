import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database contents...\n');
  
  try {
    // List all tables by trying to query them
    console.log('Attempting to check tables...\n');

    // Check series
    const { data: series, error: seriesError, count } = await supabase
      .from('series')
      .select('*', { count: 'exact' });
    
    if (seriesError) {
      console.error('Series table error:', seriesError.message);
    } else {
      console.log(`📚 Series count: ${count || 0}`);
      if (series && series.length > 0) {
        console.log('Found series:');
        series.slice(0, 5).forEach(s => console.log(`  - ${s.title} (${s.slug})`));
        if (series.length > 5) console.log(`  ... and ${series.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

checkDatabase();
