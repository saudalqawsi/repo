'use client'
import { useEffect, useRef, useState } from 'react'
import type { Map as LMap, Marker, GeoJSON as LGeoJSON } from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Map shown right under the site field. It looks the stated district up on OpenStreetMap,
 * outlines it, and lets the customer tap the exact spot.
 */
const RIYADH: [number, number] = [24.7136, 46.6753]
// Riyadh and its surroundings: keeps lookups inside the service area
const VIEWBOX = '46.2,25.2,47.3,24.3'
const AREA = ['neighbourhood', 'suburb', 'quarter', 'city_district', 'district', 'residential']

export type Pin = { lat: number; lng: number }
type Hit = { lat: string; lon: string; category: string; addresstype: string; geojson?: GeoJSON.Geometry }

export function SiteMap({
  query,
  pin,
  locale,
  labels,
  onPin,
}: {
  query: string
  pin: Pin | null
  locale: 'ar' | 'en'
  labels: { hint: string; notFound: string; searching: string; pinned: string; empty: string }
  onPin: (p: Pin) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const areaRef = useRef<LGeoJSON | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const onPinRef = useRef(onPin)
  onPinRef.current = onPin
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'notfound'>('idle')

  // build the map once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !box.current) return
      LRef.current = L
      const map = L.map(box.current, { scrollWheelZoom: true, touchZoom: true, doubleClickZoom: true, zoomSnap: 0.5 }).setView(pin ? [pin.lat, pin.lng] : RIYADH, pin ? 16 : 11)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(map)
      const icon = L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [28, 38], iconAnchor: [14, 36] })
      if (pin) markerRef.current = L.marker([pin.lat, pin.lng], { icon }).addTo(map)
      map.on('click', (e) => {
        if (markerRef.current) markerRef.current.setLatLng(e.latlng)
        else markerRef.current = L.marker(e.latlng, { icon }).addTo(map)
        onPinRef.current({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) })
      })
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 120)
      setReady(true)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // the map is built once; later changes go through the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // outline the district whenever the site text settles
  useEffect(() => {
    if (!ready) return
    const q = query
      .trim()
      .replace(/^(حي|district of|district)\s+/i, '')
      .replace(/\s*(district|neighbourhood|neighborhood)$/i, '')
    if (q.length < 2 || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(q)) {
      setStatus('idle')
      return
    }
    setStatus('searching')
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const url =
          'https://nominatim.openstreetmap.org/search?' +
          new URLSearchParams({
            format: 'jsonv2',
            polygon_geojson: '1',
            countrycodes: 'sa',
            viewbox: VIEWBOX,
            bounded: '1',
            limit: '8',
            'accept-language': locale,
            q,
          })
        const hits = (await (await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })).json()) as Hit[]
        const map = mapRef.current
        const L = LRef.current
        if (!map || !L) return
        areaRef.current?.remove()
        areaRef.current = null
        // prefer the district boundary over streets or shops that share its name
        const hit =
          hits.find((h) => AREA.includes(h.addresstype) && (h.category === 'boundary' || h.category === 'place')) ??
          hits.find((h) => h.category === 'boundary' || h.category === 'place') ??
          hits[0]
        if (!hit) {
          setStatus('notfound')
          return
        }
        map.invalidateSize()
        if (hit.geojson && (hit.geojson.type === 'Polygon' || hit.geojson.type === 'MultiPolygon')) {
          areaRef.current = L.geoJSON(hit.geojson as GeoJSON.GeoJsonObject, {
            style: { color: '#dc9f00', weight: 3, fillColor: '#f5b400', fillOpacity: 0.16 },
            interactive: false,
          }).addTo(map)
          if (!markerRef.current) map.fitBounds(areaRef.current.getBounds(), { padding: [16, 16] })
        } else if (!markerRef.current) {
          map.setView([+hit.lat, +hit.lon], 15)
        }
        setStatus('found')
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setStatus('notfound')
      }
    }, 700)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query, ready, locale])

  const msg = pin
    ? labels.pinned
    : status === 'searching'
      ? labels.searching
      : status === 'found'
        ? labels.hint
        : status === 'notfound'
          ? labels.notFound
          : labels.empty
  return (
    <div className="map-inline">
      <div className="map-box" ref={box} />
      <p className="map-hint" role="status">
        <span>{msg}</span>
        {pin ? <span className="small muted" dir="ltr">{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span> : null}
      </p>
    </div>
  )
}
