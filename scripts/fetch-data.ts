#!/usr/bin/env npx tsx
// ============================================================
// Data Pipeline - Fetch all GeoJSON from Haifa Open Data Portal
// Run with: npm run fetch-data
// ============================================================

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data')

interface DataSource {
  targetFile: string
  sourceUrl: string
  description: string
}

const DATA_SOURCES: DataSource[] = [
  {
    targetFile: 'zoning.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/8fda51da-f8ff-4152-aeae-bf103bb038db/resource/cf56f53d-8597-41c1-99fb-02e46288a623/download/gis.geojson',
    description: 'ייעודי קרקע (Zoning/Land Use)',
  },
  {
    targetFile: 'conservation-buildings.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/8d223d06-d28c-4216-b98d-b8f5f3eacfe8/resource/7b36d661-964c-44a2-9c9f-560850de2bdf/download/gis.geojson',
    description: 'מבנים לשימור (Conservation Buildings)',
  },
  {
    targetFile: 'preservation-areas.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/260f7a25-10b2-4181-8c05-b73c14f978f4/resource/c12cb7c0-9bbb-4b46-9f49-2520767232fd/download/gis.geojson',
    description: 'מתחמים לשימור (Preservation Areas)',
  },
  {
    targetFile: 'neighborhoods.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/f0266e51-1908-4aae-82fa-92b03beaea95/resource/c9f1cf02-41ad-47b4-9e94-1c8a52726d8a/download/gis.geojson',
    description: 'שכונות העיר (Neighborhoods)',
  },
  {
    targetFile: 'quarters.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/21196d1d-2a3e-4aee-bf26-fd4a3356e9d2/resource/b427bfce-b30b-44e2-8009-1984490b38ee/download/gis.geojson',
    description: 'רובעים (Quarters)',
  },
  {
    targetFile: 'sub-quarters.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/3f6c5323-291d-4004-b820-1c0389df0cce/resource/1e96257d-ddf9-442d-ac9e-81f3b764733b/download/gis.geojson',
    description: 'תתי-רובעים (Sub-Quarters)',
  },
  {
    targetFile: 'streets.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/3f09f600-769f-49d7-a4e6-1654c69f74f7/resource/ab5d1f2e-0e65-4c5a-be6b-9d7d9ae24270/download/gis.geojson',
    description: 'רחובות (Streets)',
  },
  {
    targetFile: 'archaeological-sites.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/814f72dc-7c23-4eb2-aee5-f4510d68d89c/resource/ab35f693-ddf5-4576-bab9-318acb43142c/download/gis.geojson',
    description: 'אתרי עתיקות (Archaeological Sites)',
  },
  {
    targetFile: 'unesco-core.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/82cdfd8c-846b-4edc-be6f-c34c0afee159/resource/ca2569a5-bf30-414c-9435-cf19e825b427/download/gis.geojson',
    description: 'הכרזת אונסקו - אזור ליבה (UNESCO Core)',
  },
  {
    targetFile: 'unesco-buffer.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/24c64626-8737-4eaf-a32a-9893f3fd148c/resource/3bd66a3b-8726-4078-9cce-19d866aa174d/download/gis.geojson',
    description: 'הכרזת אונסקו - אזור חיץ (UNESCO Buffer)',
  },
  {
    targetFile: 'statistical-areas.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/50d460c7-387d-4b5c-af64-c5a3b546465b/resource/1f833338-c0a5-4809-b247-4ff56196efb7/download/gis.geojson',
    description: 'אזורים סטטיסטיים (Statistical Areas)',
  },
  {
    targetFile: 'preservation-surveys-completed.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/ab18373f-28bf-49b1-b7e0-e278f9e530be/resource/e54faa66-5e36-4692-b8c0-72ea479666d5/download/gis.geojson',
    description: 'סקרי שימור - הושלם (Preservation Surveys Completed)',
  },
  {
    targetFile: 'preservation-surveys-in-progress.geojson',
    sourceUrl: 'https://opendata.haifa.muni.il/dataset/87e987a6-3072-4a6f-a652-6c591ae1429d/resource/80aae268-238f-4f81-a409-acf4019d738a/download/gis.geojson',
    description: 'סקרי שימור - בביצוע (Preservation Surveys In Progress)',
  },
]

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)

    const request = (urlStr: string) => {
      https.get(urlStr, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            request(redirectUrl)
            return
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${urlStr}`))
          return
        }

        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      }).on('error', (err) => {
        fs.unlink(destPath, () => {}) // Clean up partial file
        reject(err)
      })
    }

    request(url)
  })
}

async function main() {
  console.log('🏗️  Haifa Building Rights - Data Pipeline')
  console.log('==========================================\n')

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`)
  }

  let successCount = 0
  let failCount = 0

  for (const source of DATA_SOURCES) {
    const destPath = path.join(OUTPUT_DIR, source.targetFile)
    process.stdout.write(`⬇️  ${source.description}... `)

    try {
      await downloadFile(source.sourceUrl, destPath)

      // Verify it's valid JSON
      const content = fs.readFileSync(destPath, 'utf-8')
      const json = JSON.parse(content)
      const featureCount = json.features?.length || 0

      console.log(`✅ (${featureCount} features, ${(content.length / 1024).toFixed(0)}KB)`)
      successCount++
    } catch (err) {
      console.log(`❌ Error: ${(err as Error).message}`)
      failCount++
    }
  }

  // Generate manifest.json with freshness timestamps
  const manifest: Record<string, unknown> = {
    fetchedAt: new Date().toISOString(),
    fetchedAtLocal: new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }),
    successCount,
    failCount,
    files: {} as Record<string, { features: number; sizeKB: number }>,
  }

  for (const source of DATA_SOURCES) {
    const destPath = path.join(OUTPUT_DIR, source.targetFile)
    try {
      const content = fs.readFileSync(destPath, 'utf-8')
      const json = JSON.parse(content)
      ;(manifest.files as Record<string, unknown>)[source.targetFile] = {
        features: json.features?.length || 0,
        sizeKB: Math.round(content.length / 1024),
        description: source.description,
      }
    } catch {
      // File may not exist if download failed
    }
  }

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
  console.log(`\n📋 Manifest written to ${manifestPath}`)

  console.log(`\n==========================================`)
  console.log(`✅ ${successCount} files downloaded successfully`)
  if (failCount > 0) {
    console.log(`❌ ${failCount} files failed`)
  }
  console.log(`📁 Output: ${OUTPUT_DIR}`)
}

main().catch(console.error)
