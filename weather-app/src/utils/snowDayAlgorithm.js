export function calculateSnowDay(current, forecast, units) {
  if (!current || !forecast) return { score: 0, factors: [] }

  const isImperial = units === 'imperial'
  let totalScore = 0
  const factors = []

  // 1. Snowfall (30%) - sum snow.3h over next 12h (4 intervals)
  const next12 = forecast.list.slice(0, 4)
  // OWM always returns snow in mm regardless of units — convert to inches for threshold comparison
  const snowInches = next12.reduce((sum, item) => sum + (item.snow?.['3h'] || 0) / 25.4, 0)
  let snowPoints = 0
  if (snowInches >= 6) snowPoints = 30
  else if (snowInches >= 3) snowPoints = 20
  else if (snowInches >= 1) snowPoints = 10
  const snowDisplay = isImperial ? `${snowInches.toFixed(1)}"` : `${(snowInches * 2.54).toFixed(1)} cm`
  factors.push({ label: 'Snowfall', value: snowPoints, max: 30, detail: snowDisplay })
  totalScore += snowPoints

  // 2. Wind chill / feels_like (20%)
  const feelsLike = current.main.feels_like
  const feelsF = isImperial ? feelsLike : (feelsLike * 9 / 5) + 32
  let chillPoints = 0
  if (feelsF < 0) chillPoints = 20
  else if (feelsF <= 10) chillPoints = 14
  else if (feelsF <= 20) chillPoints = 8
  factors.push({ label: 'Wind Chill', value: chillPoints, max: 20, detail: `${feelsLike.toFixed(0)}°${isImperial ? 'F' : 'C'}` })
  totalScore += chillPoints

  // 3. Wind speed (15%)
  const windSpeed = current.wind.speed
  const windMph = isImperial ? windSpeed : windSpeed * 2.237
  let windPoints = 0
  if (windMph >= 30) windPoints = 15
  else if (windMph >= 20) windPoints = 10
  else if (windMph >= 10) windPoints = 5
  factors.push({ label: 'Wind Speed', value: windPoints, max: 15, detail: `${windSpeed.toFixed(0)} ${isImperial ? 'mph' : 'm/s'}` })
  totalScore += windPoints

  // 4. Visibility (15%)
  const visMeters = current.visibility || 10000
  let visPoints = 0
  if (visMeters < 1000) visPoints = 15
  else if (visMeters < 2000) visPoints = 10
  else if (visMeters < 5000) visPoints = 5
  factors.push({ label: 'Visibility', value: visPoints, max: 15, detail: `${(visMeters / 1000).toFixed(1)} km` })
  totalScore += visPoints

  // 5. Temperature (10%)
  const temp = current.main.temp
  const tempF = isImperial ? temp : (temp * 9 / 5) + 32
  let tempPoints = 0
  if (tempF < 20) tempPoints = 10
  else if (tempF < 28) tempPoints = 8
  else if (tempF <= 35) tempPoints = 5
  factors.push({ label: 'Temperature', value: tempPoints, max: 10, detail: `${temp.toFixed(0)}°${isImperial ? 'F' : 'C'}` })
  totalScore += tempPoints

  // 6. Time factor (10%)
  const now = new Date()
  const hour = now.getHours()
  let timePoints = 0
  if (hour >= 2 && hour < 6) timePoints = 10
  else if (hour >= 18 || hour < 2) timePoints = 8
  const timeDesc = hour >= 2 && hour < 6 ? 'Early morning' : hour >= 18 ? 'Evening' : 'School hours'
  factors.push({ label: 'Timing', value: timePoints, max: 10, detail: timeDesc })
  totalScore += timePoints

  return { score: Math.min(100, totalScore), factors }
}

export function getVerdict(score) {
  if (score >= 81) return { text: 'SNOW DAY! Build a snowman!', emoji: '⛄', level: 'blizzard' }
  if (score >= 61) return { text: 'Looking good! Start the hot cocoa.', emoji: '☕', level: 'high' }
  if (score >= 41) return { text: "It's a coin flip — stay tuned!", emoji: '🎲', level: 'medium' }
  if (score >= 21) return { text: 'Unlikely, but keep your fingers crossed.', emoji: '🤞', level: 'low' }
  return { text: 'Not a chance. Do your homework.', emoji: '📚', level: 'none' }
}
