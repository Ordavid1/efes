import { NextRequest, NextResponse } from 'next/server'

/**
 * GovMap WFS Proxy
 * Proxies requests to the GovMap WFS service to avoid CORS issues
 * Usage: /api/govmap?gush=10769&helka=15
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gush = searchParams.get('gush')
  const helka = searchParams.get('helka')

  if (!gush || !helka) {
    return NextResponse.json(
      { error: 'Missing gush or helka parameter' },
      { status: 400 }
    )
  }

  try {
    // Query GovMap WFS for parcel data
    const wfsUrl = new URL('https://open.govmap.gov.il/geoserver/opendata/wfs')
    wfsUrl.searchParams.set('service', 'WFS')
    wfsUrl.searchParams.set('version', '2.0.0')
    wfsUrl.searchParams.set('request', 'GetFeature')
    wfsUrl.searchParams.set('typeNames', 'opendata:PARCEL_ALL')
    wfsUrl.searchParams.set('outputFormat', 'application/json')
    wfsUrl.searchParams.set('CQL_FILTER', `GUSH_NUM=${gush} AND PARCEL=${helka}`)
    wfsUrl.searchParams.set('maxFeatures', '1')
    wfsUrl.searchParams.set('srsName', 'EPSG:4326')

    const response = await fetch(wfsUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 1 hour - parcel data doesn't change often
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      // If PARCEL_ALL doesn't work, try alternative layer names
      const altUrl = new URL('https://open.govmap.gov.il/geoserver/opendata/wfs')
      altUrl.searchParams.set('service', 'WFS')
      altUrl.searchParams.set('version', '2.0.0')
      altUrl.searchParams.set('request', 'GetFeature')
      altUrl.searchParams.set('typeNames', 'opendata:PARCEL_HOKS')
      altUrl.searchParams.set('outputFormat', 'application/json')
      altUrl.searchParams.set('CQL_FILTER', `GUSH_NUM=${gush} AND PARCEL=${helka}`)
      altUrl.searchParams.set('maxFeatures', '1')
      altUrl.searchParams.set('srsName', 'EPSG:4326')

      const altResponse = await fetch(altUrl.toString())
      if (altResponse.ok) {
        const data = await altResponse.json()
        return NextResponse.json(data)
      }

      return NextResponse.json(
        { error: 'Failed to fetch parcel data from GovMap', status: response.status },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('GovMap proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
  }
}
