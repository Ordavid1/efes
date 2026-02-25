import { NextRequest, NextResponse } from 'next/server'

/**
 * GovMap WFS BBOX Proxy
 * Returns parcels within a bounding box (for click-to-select)
 * Usage: /api/govmap/bbox?bbox=west,south,east,north
 */
export async function GET(request: NextRequest) {
  const bbox = request.nextUrl.searchParams.get('bbox')

  if (!bbox) {
    return NextResponse.json(
      { error: 'Missing bbox parameter (west,south,east,north)' },
      { status: 400 }
    )
  }

  try {
    const wfsUrl = new URL('https://open.govmap.gov.il/geoserver/opendata/wfs')
    wfsUrl.searchParams.set('service', 'WFS')
    wfsUrl.searchParams.set('version', '2.0.0')
    wfsUrl.searchParams.set('request', 'GetFeature')
    wfsUrl.searchParams.set('typeNames', 'opendata:PARCEL_ALL')
    wfsUrl.searchParams.set('outputFormat', 'application/json')
    wfsUrl.searchParams.set('bbox', `${bbox},EPSG:4326`)
    wfsUrl.searchParams.set('maxFeatures', '1')
    wfsUrl.searchParams.set('srsName', 'EPSG:4326')

    const response = await fetch(wfsUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch parcel data from GovMap', status: response.status },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('GovMap bbox proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
  }
}
