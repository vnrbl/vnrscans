import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

console.log('🔑 Using service role key for deletion...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceDelete() {
  console.log('🗑️  Force deleting all series...\n');
  
  try {
    // Get all series first
    const { data: series, error: fetchError } = await supabase.from('series').select('id,slug,title');
    
    if (fetchError) {
      console.error('❌ Error fetching series:', fetchError);
      return;
    }

    if (!series || series.length === 0) {
      console.log('✅ No series found. Database is already clean!');
      return;
    }

    console.log(`Found ${series.length} series to delete:\n`);

    // Delete each series one by one
    for (const s of series) {
      console.log(`Deleting: ${s.title} (${s.slug})`);
      
      // Get chapters for this series
      const { data: chapters } = await supabase.from('chapters').select('id').eq('series_id', s.id);
      
      if (chapters && chapters.length > 0) {
        const chapterIds = chapters.map(c => c.id);
        
        // Delete chapter pages
        for (const chapterId of chapterIds) {
          await supabase.from('chapter_pages').delete().eq('chapter_id', chapterId);
        }
        
        // Delete chapters
        await supabase.from('chapters').delete().eq('series_id', s.id);
      }
      
      // Delete related data
      await supabase.from('bookmarks').delete().eq('series_id', s.id);
      await supabase.from('ratings').delete().eq('series_id', s.id);
      await supabase.from('series_genres').delete().eq('series_id', s.id);
      
      // Delete the series itself
      const { error } = await supabase.from('series').delete().eq('id', s.id);
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Deleted`);
      }
    }

    console.log('\n✨ All series deletion completed!');

    // Verify
    const { data: remaining } = await supabase.from('series').select('id');
    console.log(`\nRemaining series: ${remaining?.length || 0}`);

  } catch (error) {
    console.error('❌ Error during deletion:', error);
  }
}

forceDelete();
