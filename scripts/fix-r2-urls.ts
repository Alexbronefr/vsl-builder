/**
 * Скрипт для обновления старых R2 URL на новый публичный домен
 * Запуск: npx tsx scripts/fix-r2-urls.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const newPublicUrl = process.env.R2_PUBLIC_URL || 'https://pub-2957c5ffb3b345c6845e8f3653bbb2f0.r2.dev'

if (!newPublicUrl) {
  console.error('Missing R2_PUBLIC_URL')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixR2Urls() {
  console.log('Fetching videos with old R2 URLs...')
  
  // Получаем все видео с hls_manifest_url
  const { data: videos, error } = await supabase
    .from('videos')
    .select('id, hls_manifest_url, name')
    .not('hls_manifest_url', 'is', null)
  
  if (error) {
    console.error('Error fetching videos:', error)
    process.exit(1)
  }
  
  if (!videos || videos.length === 0) {
    console.log('No videos found')
    return
  }
  
  console.log(`Found ${videos.length} videos`)
  
  let updated = 0
  let skipped = 0
  
  for (const video of videos) {
    if (!video.hls_manifest_url) continue
    
    // Проверяем, содержит ли URL старый формат
    if (video.hls_manifest_url.includes('r2.cloudflarestorage.com')) {
      // Извлекаем путь после домена (например, /hls/video-id/master.m3u8)
      const urlParts = video.hls_manifest_url.split('/')
      const pathIndex = urlParts.findIndex(part => part === 'hls')
      
      if (pathIndex !== -1) {
        // Собираем новый URL
        const path = urlParts.slice(pathIndex).join('/')
        const newUrl = `${newPublicUrl.replace(/\/$/, '')}/${path}`
        
        console.log(`Updating video ${video.id} (${video.name}):`)
        console.log(`  Old: ${video.hls_manifest_url}`)
        console.log(`  New: ${newUrl}`)
        
        const { error: updateError } = await supabase
          .from('videos')
          .update({ hls_manifest_url: newUrl })
          .eq('id', video.id)
        
        if (updateError) {
          console.error(`  Error updating: ${updateError.message}`)
        } else {
          updated++
          console.log(`  ✓ Updated`)
        }
      } else {
        console.log(`Skipping video ${video.id}: cannot parse URL`)
        skipped++
      }
    } else {
      console.log(`Skipping video ${video.id}: already using correct URL`)
      skipped++
    }
  }
  
  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`)
}

fixR2Urls().catch(console.error)
