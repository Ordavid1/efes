declare module 'shapefile' {
  interface Feature {
    type: string
    geometry: { type: string; coordinates: unknown } | null
    properties: Record<string, unknown>
  }
  interface Source {
    read(): Promise<{ done: boolean; value: Feature }>
  }
  export function open(filename: string): Promise<Source>
}
