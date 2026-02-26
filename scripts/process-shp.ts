/**
 * Convert HFP/2666 SHP files (EPSG:2039 Israel TM Grid) to GeoJSON (EPSG:4326 WGS84)
 * Usage: npx tsx scripts/process-shp.ts
 * Output: public/data/hfp2666-districts.geojson
 */
import * as shapefile from 'shapefile'
import proj4 from 'proj4'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Israel TM Grid (EPSG:2039) definition
const EPSG_2039 = '+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444445 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +units=m +no_defs'

function transformCoords(coords: number[]): number[] {
  return proj4(EPSG_2039, 'EPSG:4326', [coords[0], coords[1]])
}

function transformRing(ring: number[][]): number[][] {
  return ring.map(transformCoords)
}

function transformGeometry(geometry: { type: string; coordinates: unknown }): { type: string; coordinates: unknown } {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as number[][][]
    return {
      type: 'Polygon',
      coordinates: coords.map(transformRing),
    }
  }
  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as number[][][][]
    return {
      type: 'MultiPolygon',
      coordinates: coords.map(polygon => polygon.map(transformRing)),
    }
  }
  return geometry
}

async function main() {
  // MVT_PLAN has the plan zones: NUM=100 is main plan area, others are exclusions
  const shpPath = join(__dirname, '..', 'docs', '2666', 'shp-files', 'MVT_PLAN.shp')
  const outPath = join(__dirname, '..', 'public', 'data', 'hfp2666-districts.geojson')

  console.log('Reading SHP file:', shpPath)

  const source = await shapefile.open(shpPath)
  const features: Array<{
    type: 'Feature'
    geometry: { type: string; coordinates: unknown }
    properties: Record<string, unknown>
  }> = []

  let result = await source.read()
  while (!result.done) {
    const feature = result.value
    if (feature.geometry) {
      features.push({
        type: 'Feature',
        geometry: transformGeometry(feature.geometry),
        properties: feature.properties || {},
      })
    }
    result = await source.read()
  }

  console.log(`Processed ${features.length} features`)

  // Log properties for inspection
  for (const f of features) {
    console.log('Feature properties:', JSON.stringify(f.properties))
  }

  const geojson = {
    type: 'FeatureCollection',
    features,
  }

  writeFileSync(outPath, JSON.stringify(geojson, null, 2))
  console.log('Written to:', outPath)
}

main().catch(console.error)
