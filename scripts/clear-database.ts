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

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...');
  
  try {
    // Delete in correct order due to foreign key constraints
    console.log('Deleting chapter pages...');
    const { error: pagesError } = await supabase.from('chapter_pages').delete().gte('page_number', 0);
    if (pagesError) console.error('Error deleting pages:', pagesError);
    else console.log('✅ Chapter pages deleted');

    console.log('Deleting chapters...');
    const { error: chaptersError } = await supabase.from('chapters').delete().gte('chapter_number', 0);
    if (chaptersError) console.error('Error deleting chapters:', chaptersError);
    else console.log('✅ Chapters deleted');

    console.log('Deleting bookmarks...');
    const { error: bookmarksError } = await supabase.from('bookmarks').delete().not('id', 'is', null);
    if (bookmarksError) console.error('Error deleting bookmarks:', bookmarksError);
    else console.log('✅ Bookmarks deleted');

    console.log('Deleting ratings...');
    const { error: ratingsError } = await supabase.from('ratings').delete().not('id', 'is', null);
    if (ratingsError) console.error('Error deleting ratings:', ratingsError);
    else console.log('✅ Ratings deleted');

    console.log('Deleting series genres...');
    const { error: seriesGenresError } = await supabase.from('series_genres').delete().not('series_id', 'is', null);
    if (seriesGenresError) console.error('Error deleting series genres:', seriesGenresError);
    else console.log('✅ Series genres deleted');

    console.log('Deleting series...');
    const { error: seriesError } = await supabase.from('series').delete().not('id', 'is', null);
    if (seriesError) console.error('Error deleting series:', seriesError);
    else console.log('✅ Series deleted');

    console.log('✨ Database cleanup completed!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

clearDatabase();
