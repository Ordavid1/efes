import Graphic from '@arcgis/core/Graphic'
import Polygon from '@arcgis/core/geometry/Polygon'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'

interface FillSymbolOptions {
  color?: number[]
  outline?: { color?: number[]; width?: number }
}

/**
 * Convert a GeoJSON-like Feature (Polygon/MultiPolygon) to an ArcGIS Graphic
 * for use in GraphicsLayer (e.g. selected parcel highlight).
 *
 * Accepts both GeoJSON.Feature and ParcelFeature (which has a slightly
 * different type union for geometry). Uses runtime type checks on
 * geometry.type to extract rings safely.
 */
export function geojsonFeatureToGraphic(
  // Accept any feature-like object — we validate geometry.type at runtime
  feature: { geometry: { type: string; coordinates?: unknown }; properties?: unknown },
  symbol?: FillSymbolOptions
): Graphic {
  const geom = feature.geometry

  let rings: number[][][]

  if (geom.type === 'Polygon') {
    rings = geom.coordinates as number[][][]
  } else if (geom.type === 'MultiPolygon') {
    rings = (geom.coordinates as number[][][][]).flat()
  } else {
    throw new Error(`Unsupported geometry type: ${geom.type}`)
  }

  const polygon = new Polygon({
    rings,
    spatialReference: { wkid: 4326 },
  })

  return new Graphic({
    geometry: polygon,
    symbol: new SimpleFillSymbol(
      symbol || {
        color: [30, 58, 95, 0.3],
        outline: { color: [30, 58, 95, 0.9], width: 3 },
      }
    ),
    attributes: (feature.properties as Record<string, unknown>) || {},
  })
}
