import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const seriesId = '8083a55e-69b3-4987-bd78-312c9a2eac9c';
  console.log(`Restoring covers for series ${seriesId}...`);

  // Step 1: Recreate the "Covers" chapter
  const chapterNumber = 0;
  const title = 'Covers & Illustrations';
  const slug = 'taboo-son-of-the-lonely-frost-sovereign-covers-illustrations';

  // Check if it already exists to prevent duplicate insertion
  const { data: existingChapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('series_id', seriesId)
    .eq('chapter_number', chapterNumber)
    .maybeSingle();

  let chapterId = existingChapter?.id;

  if (!chapterId) {
    console.log(`Creating chapter: "${title}" (Chapter ${chapterNumber})...`);
    const { data: newChapter, error: createErr } = await supabase
      .from('chapters')
      .insert({
        series_id: seriesId,
        chapter_number: chapterNumber,
        title,
        slug,
        chapter_type: 'image',
        status: 'published',
        uploaded_by: 'vnr610',
      })
      .select('id')
      .single();

    if (createErr) {
      console.error('Error creating chapter:', createErr);
      return;
    }
    chapterId = newChapter.id;
    console.log(`✅ Created chapter with ID: ${chapterId}`);
  } else {
    console.log(`✅ Chapter already exists with ID: ${chapterId}`);
  }

  // Step 2: Define all the cover image/video URLs
  const coverUrls = [
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/bb37ace1-24da-47b0-a83e-9237c2e07f6a.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/761a57ba-e9bf-4fa6-acda-fde8ac310eb4.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/cd433243-7667-430f-8c39-3f99b28a07d6.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/de52a05a-8429-499b-8e4d-ef5f077fab78.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/af9284b7-319e-4862-b647-d2977778efcf.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/b1d3b983-3315-4fbb-a49d-9f41bafaa132.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/9d83c4cd-67c2-4aca-9ea3-006c9b12b998.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/941914e7-59aa-4a06-bfa9-f7333ead98b5.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/847ece76-5c43-4574-8b21-dc215c2e480a.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/f8cf02be-2822-4836-81b0-e458c25bfd0e.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/a4b6d2f1-3dc4-4541-9a31-6072015ffd97.png',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/829e1a2f-3867-412f-8721-af513497ad8c.mp4',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/d6091e12-2979-45b0-bc64-4fa6f5f28d2a.mp4',
    'https://edvqhmvqbtujzcfqkrbe.supabase.co/storage/v1/object/public/comment-media/8a440e3d-b3d0-4103-a131-77c6d8572fa5/62aa0c24-1b1d-4b39-837f-c366f1930dbe.mp4'
  ];

  console.log(`Inserting ${coverUrls.length} pages...`);

  // Delete existing pages in this chapter to avoid duplicates if rerun
  await supabase
    .from('chapter_pages')
    .delete()
    .eq('chapter_id', chapterId);

  const pagesData = coverUrls.map((url, index) => ({
    chapter_id: chapterId,
    page_number: index + 1,
    image_url: url,
  }));

  const { error: pagesErr } = await supabase.from('chapter_pages').insert(pagesData);

  if (pagesErr) {
    console.error('Error inserting pages:', pagesErr);
    return;
  }

  console.log('🎉 Successfully restored all covers and illustrations!');
}

main();
