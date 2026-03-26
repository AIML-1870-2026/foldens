import { useMemo } from 'react'
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useWeather } from '../hooks/useWeather'
import GlassCard from './GlassCard'
import styles from './Forecast.module.css'

function aggregateDays(list, units) {
  const days = {}
  for (const item of list) {
    const date = new Date(item.dt * 1000)
    const key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!days[key]) {
      days[key] = {
        day: key,
        shortDay: date.toLocaleDateString('en-US', { weekday: 'short' }),
        temps: [],
        icons: [],
        precip: 0,
        conditionIds: [],
      }
    }
    days[key].temps.push(item.main.temp)
    days[key].icons.push(item.weather[0].icon)
    days[key].conditionIds.push(item.weather[0].id)
    if (item.rain?.['3h']) days[key].precip += item.rain['3h']
    if (item.snow?.['3h']) days[key].precip += item.snow['3h']
  }

  return Object.values(days).slice(0, 5).map(d => ({
    ...d,
    high: Math.round(Math.max(...d.temps)),
    low: Math.round(Math.min(...d.temps)),
    icon: d.icons[Math.floor(d.icons.length / 2)], // midday icon
    precipMm: parseFloat(d.precip.toFixed(1)),
  }))
}

const CustomDot = ({ cx, cy, payload }) => {
  if (!cx || !cy) return null
  return (
    <image
      href={`https://openweathermap.org/img/wn/${payload.icon}@2x.png`}
      x={cx - 16}
      y={cy - 28}
      width={32}
      height={32}
    />
  )
}

const CustomTooltip = ({ active, payload, label, units }) => {
  if (!active || !payload || !payload.length) return null
  const isImperial = units === 'imperial'
  const tempUnit = isImperial ? '°F' : '°C'
  const high = payload.find(p => p.name === 'high')
  const low = payload.find(p => p.name === 'low')
  const precip = payload.find(p => p.name === 'precipMm')

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTitle}>{label}</div>
      {high && <div className={styles.tooltipRow}><span>High</span><span>{high.value}{tempUnit}</span></div>}
      {low && <div className={styles.tooltipRow}><span>Low</span><span>{low.value}{tempUnit}</span></div>}
      {precip && precip.value > 0 && (
        <div className={styles.tooltipRow}><span>Precip</span><span>{precip.value} mm</span></div>
      )}
    </div>
  )
}

export default function Forecast() {
  const { forecast, units, loading } = useWeather()

  const days = useMemo(() => {
    if (!forecast) return []
    return aggregateDays(forecast.list, units)
  }, [forecast, units])

  if (loading && !forecast) {
    return <GlassCard title="5-Day Forecast" loading={true} className={styles.card} />
  }

  if (!forecast || days.length === 0) {
    return (
      <GlassCard title="5-Day Forecast" className={styles.card}>
        <div className={styles.empty}>No forecast data</div>
      </GlassCard>
    )
  }

  const isImperial = units === 'imperial'
  const tempUnit = isImperial ? '°F' : '°C'
  const allTemps = days.flatMap(d => [d.high, d.low])
  const minTemp = Math.min(...allTemps) - 3
  const maxTemp = Math.max(...allTemps) + 3

  return (
    <GlassCard title="5-Day Forecast" className={styles.card}>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={days} margin={{ top: 32, right: 16, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="shortDay"
              tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="temp"
              domain={[minTemp, maxTemp]}
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}${tempUnit}`}
            />
            <YAxis
              yAxisId="precip"
              orientation="right"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}mm`}
            />
            <Tooltip content={<CustomTooltip units={units} />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />
            <Area
              yAxisId="temp"
              type="monotone"
              dataKey="high"
              fill="url(#tempGradient)"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: '#F59E0B', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 2 }}
            />
            <Area
              yAxisId="temp"
              type="monotone"
              dataKey="low"
              fill="transparent"
              stroke="#60A5FA"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4, fill: '#60A5FA', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 2 }}
            />
            <Bar
              yAxisId="precip"
              dataKey="precipMm"
              fill="rgba(96, 165, 250, 0.3)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.dayList}>
        {days.map(day => (
          <div key={day.day} className={styles.dayRow}>
            <span className={styles.dayName}>{day.shortDay}</span>
            <img
              src={`https://openweathermap.org/img/wn/${day.icon}.png`}
              alt=""
              className={styles.dayIcon}
            />
            <div className={styles.dayBar}>
              <div
                className={styles.dayBarFill}
                style={{
                  width: `${((day.high - day.low) / (maxTemp - minTemp)) * 100}%`,
                  marginLeft: `${((day.low - minTemp) / (maxTemp - minTemp)) * 100}%`,
                }}
              />
            </div>
            <span className={styles.dayLow}>{day.low}{tempUnit}</span>
            <span className={styles.dayHigh}>{day.high}{tempUnit}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
