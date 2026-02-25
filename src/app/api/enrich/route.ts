import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

// Turf imports - use individual modules for tree-shaking
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point as turfPoint } from '@turf/helpers'
import pointToLineDistance from '@turf/point-to-line-distance'

/**
 * Server-side Spatial Enrichment API
 * Performs proper point-in-polygon checks against Haifa GeoJSON layers
 * Usage: /api/enrich?lng=34.99&lat=32.79&gush=10769&helka=15
 */

interface SpatialCache {
  neighborhoods: GeoJSON.FeatureCollection
  quarters: GeoJSON.FeatureCollection
  subQuarters: GeoJSON.FeatureCollection
  conservationBuildings: GeoJSON.FeatureCollection
  preservationAreas: GeoJSON.FeatureCollection
  archaeologicalSites: GeoJSON.FeatureCollection
  unescoCore: GeoJSON.FeatureCollection
  unescoBuffer: GeoJSON.FeatureCollection
  streets: GeoJSON.FeatureCollection
  zoning: GeoJSON.FeatureCollection | null
}

let cache: SpatialCache | null = null

function loadCache(): SpatialCache {
  if (cache) return cache

  const dataDir = path.join(process.cwd(), 'public', 'data')
  const load = (file: string): GeoJSON.FeatureCollection => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'))
    } catch {
      return { type: 'FeatureCollection', features: [] }
    }
  }

  // Load zoning data (55MB) only on server side - never sent to browser
  let zoning: GeoJSON.FeatureCollection | null = null
  try {
    zoning = load('zoning.geojson')
  } catch {
    console.warn('Could not load zoning.geojson - zoningType lookups will be unavailable')
  }

  cache = {
    neighborhoods: load('neighborhoods.geojson'),
    quarters: load('quarters.geojson'),
    subQuarters: load('sub-quarters.geojson'),
    conservationBuildings: load('conservation-buildings.geojson'),
    preservationAreas: load('preservation-areas.geojson'),
    archaeologicalSites: load('archaeological-sites.geojson'),
    unescoCore: load('unesco-core.geojson'),
    unescoBuffer: load('unesco-buffer.geojson'),
    streets: load('streets.geojson'),
    zoning,
  }
  return cache
}

function checkPointInFeatures(
  point: GeoJSON.Feature<GeoJSON.Point>,
  features: GeoJSON.Feature[]
): GeoJSON.Feature | null {
  for (const f of features) {
    if (!f.geometry) continue
    const geomType = f.geometry.type
    if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      try {
        if (booleanPointInPolygon(point, f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)) {
          return f
        }
      } catch {
        // Skip invalid geometries
      }
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const lng = Number(params.get('lng'))
  const lat = Number(params.get('lat'))
  const gush = params.get('gush')
  const helka = params.get('helka')

  if (isNaN(lng) || isNaN(lat)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const point = turfPoint([lng, lat])
  const data = loadCache()

  const result: Record<string, unknown> = {}

  // 1. Neighborhood (using SchName - the correct field, not SHEM_YISHU which is always "חיפה")
  const neighborhoodHit = checkPointInFeatures(point, data.neighborhoods.features)
  if (neighborhoodHit) {
    result.neighborhood = neighborhoodHit.properties?.SchName || null
    result.rovaCode = neighborhoodHit.properties?.ROVA || null
    result.tatRovaCode = neighborhoodHit.properties?.TAT_ROVA || null
  } else {
    result.neighborhood = null
  }

  // 2. Quarter
  const quarterHit = checkPointInFeatures(point, data.quarters.features)
  if (quarterHit) {
    result.quarter = (quarterHit.properties?.ezorname || '').trim() || null
  } else {
    result.quarter = null
  }

  // 3. Sub-quarter
  const subQuarterHit = checkPointInFeatures(point, data.subQuarters.features)
  if (subQuarterHit) {
    result.subQuarter = (subQuarterHit.properties?.ezorname || '').trim() || null
  } else {
    result.subQuarter = null
  }

  // 4. Conservation buildings
  result.isConservationBuilding = checkPointInFeatures(point, data.conservationBuildings.features) !== null

  // 5. Preservation areas
  result.isInPreservationArea = checkPointInFeatures(point, data.preservationAreas.features) !== null

  // 6. Archaeological sites
  result.isArchaeologicalSite = checkPointInFeatures(point, data.archaeologicalSites.features) !== null

  // 7. UNESCO core
  result.isUnescoCore = checkPointInFeatures(point, data.unescoCore.features) !== null

  // 8. UNESCO buffer
  result.isUnescoBuffer = checkPointInFeatures(point, data.unescoBuffer.features) !== null

  // 9. Nearest street (within 50m)
  let nearestStreet: string | null = null
  let minDist = Infinity
  for (const f of data.streets.features) {
    if (!f.geometry || (f.geometry.type !== 'LineString' && f.geometry.type !== 'MultiLineString')) continue
    try {
      const dist = pointToLineDistance(point, f as GeoJSON.Feature<GeoJSON.LineString>, { units: 'meters' })
      if (dist < minDist && dist < 50) {
        minDist = dist
        nearestStreet = f.properties?.STREET_NAM || null
      }
    } catch {
      // Skip invalid geometries
    }
  }
  result.streetName = nearestStreet

  // 10. Zoning type (lookup by Gush+Helka from zoning.geojson)
  result.zoningType = null
  result.planningScheme = null
  result.planningDocLink = null

  if (gush && helka && data.zoning) {
    const gushNum = Number(gush)
    const helkaNum = Number(helka)
    const zoningFeature = data.zoning.features.find(
      (f) => f.properties?.Gush === gushNum && f.properties?.Helka === helkaNum
    )
    if (zoningFeature) {
      result.zoningType = zoningFeature.properties?.Yeud_Desc || null
      result.planningScheme = zoningFeature.properties?.Taba_Yeud?.trim() || null
      result.planningDocLink = zoningFeature.properties?.internet || zoningFeature.properties?.ToSite || null
    }
  }

  return NextResponse.json(result)
}
