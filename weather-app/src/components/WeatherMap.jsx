import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useWeather } from '../hooks/useWeather'
import { API_KEY } from '../utils/api'
import styles from './WeatherMap.module.css'

// Fix leaflet default icon paths broken by Vite bundling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const OVERLAYS = [
  { id: 'precipitation_new', label: 'Rain', icon: '🌧' },
  { id: 'clouds_new', label: 'Clouds', icon: '☁' },
  { id: 'temp_new', label: 'Temp', icon: '🌡' },
  { id: 'wind_new', label: 'Wind', icon: '💨' },
]

function FlyToCity({ coords }) {
  const map = useMap()
  const prevRef = useRef(null)

  useEffect(() => {
    if (!coords) return
    const [lat, lon] = coords
    const prev = prevRef.current
    if (prev && prev[0] === lat && prev[1] === lon) return
    prevRef.current = coords
    map.flyTo([lat, lon], 9, { duration: 1.5, easeLinearity: 0.5 })
  }, [coords, map])

  return null
}

export default function WeatherMap() {
  const { current, units } = useWeather()
  const [activeOverlay, setActiveOverlay] = useState('precipitation_new')

  const coords = current
    ? [current.coord.lat, current.coord.lon]
    : [41.2565, -95.9345] // default: Omaha

  const isImperial = units === 'imperial'
  const temp = current ? `${Math.round(current.main.temp)}°${isImperial ? 'F' : 'C'}` : '--'
  const condition = current ? current.weather[0].description : ''

  const overlayUrl = API_KEY && API_KEY !== 'your_api_key_here'
    ? `https://tile.openweathermap.org/map/${activeOverlay}/{z}/{x}/{y}.png?appid=${API_KEY}`
    : null

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Weather Map</h2>
        <div className={styles.overlayPills}>
          {OVERLAYS.map(o => (
            <button
              key={o.id}
              className={`${styles.pill} ${activeOverlay === o.id ? styles.pillActive : ''}`}
              onClick={() => setActiveOverlay(o.id)}
            >
              <span className={styles.pillIcon}>{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.mapContainer}>
        <MapContainer
          center={coords}
          zoom={9}
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />
          {overlayUrl && (
            <TileLayer
              url={overlayUrl}
              opacity={0.6}
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
            />
          )}
          {current && (
            <Marker position={coords}>
              <Popup className={styles.popup}>
                <div className={styles.popupContent}>
                  <strong>{current.name}, {current.sys.country}</strong>
                  <div>{temp}</div>
                  <div style={{ textTransform: 'capitalize' }}>{condition}</div>
                </div>
              </Popup>
            </Marker>
          )}
          <FlyToCity coords={coords} />
        </MapContainer>
      </div>
    </div>
  )
}
