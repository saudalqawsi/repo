'use client'
import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

/**
 * Pop-up map for pinning the work site. Looks the stated district up on OpenStreetMap,
 * outlines it, and lets the customer tap the exact spot.
 */
const RIYADH: [number, number] = [24.7136, 46.6753]
// Riyadh and its surroundings: keeps lookups inside the service area
const VIEWBOX = '46.2,25.2,47.3,24.3'

export type Pin = { lat: number; lng: number }

export function SiteMap({
  query,
  initial,
  locale,
  labels,
  onUse,
  onClose,
}: {
  query: string
  initial: Pin | null
  locale: 'ar' | 'en'
  labels: { title: string; hint: string; notFound: string; use: string; close: string; searching: string }
  onUse: (p: Pin) => void
  onClose: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const [pin, setPin] = useState<Pin | null>(initial)
  const [status, setStatus] = useState<'searching' | 'found' | 'notfound'>('searching')

  useEffect(() => {
    let map: import('leaflet').Map | null = null
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !box.current) return
      map = L.map(box.current, { zoomControl: true, attributionControl: true }).setView(initial ? [initial.lat, initial.lng] : RIYADH, initial ? 16 : 11)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(map)
      setTimeout(() => map?.invalidateSize(), 150)
      const icon = L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [28, 38], iconAnchor: [14, 36] })
      let marker: import('leaflet').Marker | null = initial ? L.marker([initial.lat, initial.lng], { icon }).addTo(map) : null
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const p = { lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }
        if (marker) marker.setLatLng(e.latlng)
        else marker = L.marker(e.latlng, { icon }).addTo(map!)
        setPin(p)
      })

      const q = query.trim()
      if (!q) {
        setStatus('notfound')
        return
      }
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
            q: q.replace(/^(حي|district of|district)\s+/i, '').replace(/\s*(district|neighbourhood|neighborhood)$/i, ''),
          })
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const hits = (await res.json()) as { lat: string; lon: string; category: string; addresstype: string; geojson?: GeoJSON.Geometry }[]
        if (cancelled || !map) return
        // prefer the district boundary over streets or shops that share its name
        const AREA = ['neighbourhood', 'suburb', 'quarter', 'city_district', 'district', 'residential']
        const hit = hits.find((h) => AREA.includes(h.addresstype) && (h.category === 'boundary' || h.category === 'place')) ?? hits.find((h) => h.category === 'boundary' || h.category === 'place') ?? hits[0]
        if (!hit) {
          setStatus('notfound')
          return
        }
        if (hit.geojson && (hit.geojson.type === 'Polygon' || hit.geojson.type === 'MultiPolygon')) {
          const area = L.geoJSON(hit.geojson as GeoJSON.GeoJsonObject, {
            style: { color: '#dc9f00', weight: 3, fillColor: '#f5b400', fillOpacity: 0.16 },
            interactive: false,
          }).addTo(map)
          map.invalidateSize()
          if (!initial) map.fitBounds(area.getBounds(), { padding: [24, 24] })
        } else if (!initial) {
          map.invalidateSize()
          map.setView([+hit.lat, +hit.lon], 15)
        }
        setStatus('found')
      } catch {
        if (!cancelled) setStatus('notfound')
      }
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
    // the map is built once per opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="map-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="map-dialog" role="dialog" aria-modal="true" aria-labelledby="map-h" tabIndex={-1} ref={dialog}>
        <div className="map-head">
          <h3 id="map-h">{labels.title}</h3>
          <button type="button" className="icon-btn" aria-label={labels.close} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <p className="map-hint" role="status">
          {status === 'searching' ? labels.searching : status === 'found' ? labels.hint : labels.notFound}
        </p>
        <div className="map-box" ref={box} />
        <div className="map-foot">
          <span className="small muted" dir="ltr">{pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : ''}</span>
          <button type="button" className="btn btn-primary btn-sm" disabled={!pin} onClick={() => pin && onUse(pin)}>
            {labels.use}
          </button>
        </div>
      </div>
    </div>
  )
}
