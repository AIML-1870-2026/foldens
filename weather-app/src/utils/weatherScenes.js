export function getTimeOfDay(dt, timezone) {
  // dt is Unix timestamp (seconds), timezone is offset in seconds
  const localTime = new Date((dt + timezone) * 1000)
  const hour = localTime.getUTCHours()
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 19) return 'day'
  if (hour >= 19 && hour < 21) return 'dusk'
  return 'night'
}

export function getSkyGradient(ctx, timeOfDay, conditionCode) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const grad = ctx.createLinearGradient(0, 0, 0, h)

  const isStormy = conditionCode >= 200 && conditionCode < 300
  const isRainy = conditionCode >= 300 && conditionCode < 600
  const isFoggy = conditionCode >= 700 && conditionCode < 800
  const isCloudy = conditionCode >= 801 && conditionCode <= 804

  if (timeOfDay === 'dawn') {
    if (isStormy) {
      grad.addColorStop(0, '#1a1a3e')
      grad.addColorStop(0.5, '#2d1b3d')
      grad.addColorStop(1, '#1a1a2e')
    } else {
      grad.addColorStop(0, '#0f0c29')
      grad.addColorStop(0.3, '#302b63')
      grad.addColorStop(0.6, '#ff6b6b')
      grad.addColorStop(1, '#ffd89b')
    }
  } else if (timeOfDay === 'day') {
    if (isStormy) {
      grad.addColorStop(0, '#1a1a3e')
      grad.addColorStop(0.5, '#2d2d52')
      grad.addColorStop(1, '#3d3d60')
    } else if (isRainy) {
      grad.addColorStop(0, '#2c3e50')
      grad.addColorStop(0.5, '#3d5a6f')
      grad.addColorStop(1, '#4a6d80')
    } else if (isFoggy) {
      grad.addColorStop(0, '#8ca0b3')
      grad.addColorStop(0.5, '#b0c4d4')
      grad.addColorStop(1, '#c8d8e8')
    } else if (isCloudy) {
      grad.addColorStop(0, '#2c3e60')
      grad.addColorStop(0.5, '#3d5070')
      grad.addColorStop(1, '#507090')
    } else {
      grad.addColorStop(0, '#0a1628')
      grad.addColorStop(0.3, '#1a3a6e')
      grad.addColorStop(0.7, '#2563a8')
      grad.addColorStop(1, '#38bdf8')
    }
  } else if (timeOfDay === 'dusk') {
    if (isStormy) {
      grad.addColorStop(0, '#1a1a3e')
      grad.addColorStop(0.5, '#3d1f2d')
      grad.addColorStop(1, '#2d1a1a')
    } else {
      grad.addColorStop(0, '#0f0c29')
      grad.addColorStop(0.3, '#6b2d5e')
      grad.addColorStop(0.6, '#e96c3d')
      grad.addColorStop(1, '#f5a623')
    }
  } else {
    // night
    if (isStormy) {
      grad.addColorStop(0, '#050510')
      grad.addColorStop(0.5, '#0d0d25')
      grad.addColorStop(1, '#1a1a3e')
    } else {
      grad.addColorStop(0, '#020408')
      grad.addColorStop(0.5, '#0a0e1a')
      grad.addColorStop(1, '#0f172a')
    }
  }
  return grad
}

export function createParticles(conditionCode, width, height) {
  const particles = []
  const isMobile = width < 768

  if (conditionCode >= 200 && conditionCode < 300) {
    // Thunderstorm - rain particles
    const count = isMobile ? 80 : 150
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 6 + Math.random() * 4,
        length: 15 + Math.random() * 10,
        opacity: 0.4 + Math.random() * 0.4,
        angle: 15 + Math.random() * 10,
        type: 'rain'
      })
    }
  } else if (conditionCode >= 300 && conditionCode < 600) {
    // Rain/drizzle
    const count = isMobile ? 60 : 120
    const speed = conditionCode >= 500 ? 8 : 5
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: speed + Math.random() * 3,
        length: conditionCode >= 500 ? 18 + Math.random() * 10 : 8 + Math.random() * 6,
        opacity: 0.3 + Math.random() * 0.4,
        angle: 10 + Math.random() * 15,
        type: 'rain'
      })
    }
  } else if (conditionCode >= 600 && conditionCode < 700) {
    // Snow
    const count = isMobile ? 50 : 100
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.5 + Math.random() * 1.5,
        radius: 2 + Math.random() * 3,
        drift: (Math.random() - 0.5) * 0.5,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.02 + Math.random() * 0.03,
        opacity: 0.5 + Math.random() * 0.5,
        type: 'snow'
      })
    }
  }

  return particles
}

export function updateParticles(particles, conditionCode, width, height, delta) {
  const dt = delta / 16.67 // normalize to 60fps

  for (const p of particles) {
    if (p.type === 'rain') {
      const rad = (p.angle * Math.PI) / 180
      p.x += Math.sin(rad) * p.speed * dt
      p.y += Math.cos(rad) * p.speed * dt
      if (p.y > height + p.length) {
        p.y = -p.length
        p.x = Math.random() * (width + 100) - 50
      }
    } else if (p.type === 'snow') {
      p.driftAngle += p.driftSpeed * dt
      p.x += Math.sin(p.driftAngle) * p.drift + 0.2 * dt
      p.y += p.speed * dt
      if (p.y > height + 10) {
        p.y = -10
        p.x = Math.random() * width
      }
      if (p.x > width + 10) p.x = -10
      if (p.x < -10) p.x = width + 10
    }
  }
}

function drawClouds(ctx, cloudOffset, width, height, opacity = 1) {
  ctx.save()
  ctx.globalAlpha = 0.55 * opacity

  // Far clouds (lighter, move slower)
  for (let i = 0; i < 4; i++) {
    const x = ((cloudOffset * 0.3 + i * (width / 3)) % (width + 300)) - 150
    const y = 60 + i * 30
    drawCloud(ctx, x, y, 180 + i * 30, 0.4 + i * 0.05)
  }

  ctx.globalAlpha = 0.7 * opacity

  // Near clouds (darker, move faster)
  for (let i = 0; i < 3; i++) {
    const x = ((cloudOffset * 0.7 + i * (width / 2.5) + 100) % (width + 400)) - 200
    const y = 100 + i * 50
    drawCloud(ctx, x, y, 220 + i * 40, 0.55 + i * 0.05, true)
  }

  ctx.restore()
}

function drawCloud(ctx, x, y, size, darkness, near = false) {
  const color = near
    ? `rgba(${Math.floor(200 * (1 - darkness))}, ${Math.floor(200 * (1 - darkness))}, ${Math.floor(220 * (1 - darkness))}, 0.85)`
    : `rgba(240, 240, 255, 0.7)`

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.bezierCurveTo(x - size * 0.1, y - size * 0.3, x + size * 0.1, y - size * 0.4, x + size * 0.2, y - size * 0.3)
  ctx.bezierCurveTo(x + size * 0.2, y - size * 0.5, x + size * 0.5, y - size * 0.5, x + size * 0.5, y - size * 0.3)
  ctx.bezierCurveTo(x + size * 0.7, y - size * 0.45, x + size * 0.9, y - size * 0.35, x + size, y - size * 0.2)
  ctx.bezierCurveTo(x + size * 1.1, y - size * 0.3, x + size * 1.2, y - size * 0.15, x + size * 1.1, y)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawStars(ctx, width, height, alpha) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha

  // Use a seeded deterministic star field
  const starData = []
  const seed = 42
  for (let i = 0; i < 200; i++) {
    const sx = ((seed * (i * 7 + 13)) % 9973) / 9973
    const sy = ((seed * (i * 11 + 7)) % 9973) / 9973
    const ssize = ((seed * (i * 3 + 5)) % 100) / 100
    starData.push({ x: sx * width, y: sy * height * 0.6, r: 0.5 + ssize * 1.5 })
  }

  for (const star of starData) {
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fill()
  }

  ctx.restore()
}

function drawSunMoon(ctx, timeOfDay, width, height) {
  let x, y, isNight = false
  if (timeOfDay === 'dawn') {
    x = width * 0.15
    y = height * 0.7
  } else if (timeOfDay === 'day') {
    x = width * 0.75
    y = height * 0.15
  } else if (timeOfDay === 'dusk') {
    x = width * 0.85
    y = height * 0.6
  } else {
    x = width * 0.8
    y = height * 0.12
    isNight = true
  }

  if (isNight) {
    // Moon glow
    const moonGlow = ctx.createRadialGradient(x, y, 0, x, y, 60)
    moonGlow.addColorStop(0, 'rgba(200, 220, 255, 0.15)')
    moonGlow.addColorStop(1, 'rgba(200, 220, 255, 0)')
    ctx.beginPath()
    ctx.arc(x, y, 60, 0, Math.PI * 2)
    ctx.fillStyle = moonGlow
    ctx.fill()

    // Moon disc
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(230, 240, 255, 0.95)'
    ctx.fill()

    // Moon crescent shadow
    ctx.beginPath()
    ctx.arc(x + 8, y - 3, 18, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
    ctx.fill()
  } else {
    // Sun glow layers
    const glow1 = ctx.createRadialGradient(x, y, 0, x, y, 80)
    glow1.addColorStop(0, 'rgba(255, 220, 100, 0.3)')
    glow1.addColorStop(1, 'rgba(255, 150, 50, 0)')
    ctx.beginPath()
    ctx.arc(x, y, 80, 0, Math.PI * 2)
    ctx.fillStyle = glow1
    ctx.fill()

    const glow2 = ctx.createRadialGradient(x, y, 0, x, y, 40)
    glow2.addColorStop(0, 'rgba(255, 240, 150, 0.5)')
    glow2.addColorStop(1, 'rgba(255, 200, 80, 0)')
    ctx.beginPath()
    ctx.arc(x, y, 40, 0, Math.PI * 2)
    ctx.fillStyle = glow2
    ctx.fill()

    // Sun disc
    ctx.beginPath()
    ctx.arc(x, y, 24, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 245, 180, 0.98)'
    ctx.fill()
  }
}

function drawLightning(ctx, width, height) {
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.fillStyle = 'rgba(220, 220, 255, 0.4)'
  ctx.fillRect(0, 0, width, height)

  // Draw a lightning bolt
  const startX = width * 0.3 + Math.random() * width * 0.4
  const startY = 0
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  let cx = startX
  let cy = startY
  const segments = 8
  for (let i = 0; i < segments; i++) {
    cx += (Math.random() - 0.5) * 80
    cy += height / segments
    ctx.lineTo(cx, cy)
  }
  ctx.strokeStyle = 'rgba(255, 255, 220, 0.95)'
  ctx.lineWidth = 2.5
  ctx.shadowColor = 'rgba(200, 200, 255, 1)'
  ctx.shadowBlur = 20
  ctx.stroke()
  ctx.restore()
}

function drawFog(ctx, width, height, time) {
  ctx.save()
  const fogY = height * 0.3 + Math.sin(time * 0.0003) * 20

  for (let layer = 0; layer < 3; layer++) {
    const grad = ctx.createLinearGradient(0, fogY + layer * 60, 0, fogY + layer * 60 + 120)
    grad.addColorStop(0, 'rgba(200, 210, 220, 0)')
    grad.addColorStop(0.5, `rgba(200, 210, 220, ${0.15 - layer * 0.03})`)
    grad.addColorStop(1, 'rgba(200, 210, 220, 0)')

    ctx.globalAlpha = 0.8
    ctx.fillStyle = grad
    ctx.fillRect(0, fogY + layer * 60, width, 120)
  }
  ctx.restore()
}

export function drawScene(ctx, state, delta) {
  const { conditionCode, timeOfDay, particles, cloudOffset, lightningTimer, lightningActive, time } = state
  const { width, height } = ctx.canvas

  // Sky gradient
  const skyGrad = getSkyGradient(ctx, timeOfDay, conditionCode)
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, width, height)

  // Stars (night and dawn/dusk partially)
  const starAlpha = timeOfDay === 'night' ? 1 : timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.3 : 0
  drawStars(ctx, width, height, starAlpha)

  // Sun or moon
  const isRainy = conditionCode >= 200 && conditionCode < 600
  const isFoggy = conditionCode >= 700 && conditionCode < 800
  const isClearOrFew = conditionCode === 800 || conditionCode === 801
  if (isClearOrFew || (!isRainy && !isFoggy)) {
    drawSunMoon(ctx, timeOfDay, width, height)
  }

  // Clouds
  const cloudOpacity = conditionCode === 800 ? 0.2 : conditionCode === 801 ? 0.5 : conditionCode === 802 ? 0.75 : 1.0
  if (conditionCode !== 800) {
    drawClouds(ctx, cloudOffset, width, height, cloudOpacity)
  }

  // Precipitation
  if (particles && particles.length > 0) {
    ctx.save()
    for (const p of particles) {
      if (p.type === 'rain') {
        const rad = (p.angle * Math.PI) / 180
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + Math.sin(rad) * p.length, p.y + Math.cos(rad) * p.length)
        ctx.strokeStyle = `rgba(174, 214, 241, ${p.opacity})`
        ctx.lineWidth = 1.2
        ctx.stroke()
      } else if (p.type === 'snow') {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220, 235, 255, ${p.opacity})`
        ctx.fill()
      }
    }
    ctx.restore()
  }

  // Fog overlay
  if (isFoggy) {
    drawFog(ctx, width, height, time || 0)
  }

  // Lightning flash
  if (lightningActive && (conditionCode >= 200 && conditionCode < 300)) {
    drawLightning(ctx, width, height)
  }
}
