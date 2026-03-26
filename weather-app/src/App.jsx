import { WeatherProvider } from './context/WeatherContext'
import WeatherCanvas from './components/WeatherCanvas'
import Header from './components/Header'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <WeatherProvider>
      <WeatherCanvas />
      <Header />
      <Dashboard />
    </WeatherProvider>
  )
}
