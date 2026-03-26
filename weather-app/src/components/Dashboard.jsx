import CurrentWeather from './CurrentWeather'
import Forecast from './Forecast'
import AirQuality from './AirQuality'
import SnowDayCalculator from './SnowDayCalculator'
import WeatherMap from './WeatherMap'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  return (
    <main className={styles.dashboard}>
      <div className={styles.grid}>
        <CurrentWeather />
        <Forecast />
        <AirQuality />
        <SnowDayCalculator />
      </div>
      <div className={styles.mapWrapper}>
        <WeatherMap />
      </div>
    </main>
  )
}
