import { useRef, useEffect, useCallback } from 'react'
import { useWeather } from '../hooks/useWeather'
import {
  getTimeOfDay,
  getSkyGradient,
  createParticles,
  updateParticles,
  drawScene
} from '../utils/weatherScenes'

export default function WeatherCanvas() {
  const { current } = useWeather()
  const canvasRef = useRef(null)
  const stateRef = useRef({
    conditionCode: 800,
    timeOfDay: 'day',
    particles: [],
    cloudOffset: 0,
    lightningTimer: 0,
    lightningCooldown: 5000 + Math.random() * 3000,
    lightningActive: false,
    lightningDuration: 0,
    time: 0,
    // crossfade
    prevConditionCode: null,
    fadeAlpha: 1,
    fadeProgress: 1,
  })
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    // Recreate particles on resize
    const s = stateRef.current
    s.particles = createParticles(s.conditionCode, canvas.width, canvas.height)
  }, [])

  // When weather changes, update scene state
  useEffect(() => {
    if (!current) return
    const s = stateRef.current
    const newCode = current.weather[0].id
    const newTime = getTimeOfDay(current.dt, current.timezone)

    if (newCode !== s.conditionCode) {
      // Start crossfade from previous scene
      s.prevConditionCode = s.conditionCode
      s.fadeProgress = 0
      s.fadeAlpha = 0
    }

    s.conditionCode = newCode
    s.timeOfDay = newTime

    const canvas = canvasRef.current
    if (canvas) {
      s.particles = createParticles(newCode, canvas.width, canvas.height)
    }
  }, [current])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function loop(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const delta = Math.min(timestamp - lastTimeRef.current, 50) // cap at 50ms
      lastTimeRef.current = timestamp

      const s = stateRef.current
      s.time += delta
      s.cloudOffset += delta * 0.04

      // Update particles
      updateParticles(s.particles, s.conditionCode, canvas.width, canvas.height, delta)

      // Lightning logic for thunderstorms
      if (s.conditionCode >= 200 && s.conditionCode < 300) {
        s.lightningTimer += delta
        if (s.lightningActive) {
          s.lightningDuration -= delta
          if (s.lightningDuration <= 0) {
            s.lightningActive = false
            s.lightningCooldown = 5000 + Math.random() * 3000
          }
        } else if (s.lightningTimer >= s.lightningCooldown) {
          s.lightningActive = true
          s.lightningDuration = 80 + Math.random() * 60
          s.lightningTimer = 0
        }
      } else {
        s.lightningActive = false
      }

      // Crossfade progress
      if (s.fadeProgress < 1) {
        s.fadeProgress = Math.min(1, s.fadeProgress + delta / 2000)
        s.fadeAlpha = s.fadeProgress
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw previous scene fading out
      if (s.prevConditionCode !== null && s.fadeProgress < 1) {
        ctx.save()
        ctx.globalAlpha = 1 - s.fadeAlpha
        const prevSkyGrad = getSkyGradient(ctx, s.timeOfDay, s.prevConditionCode)
        ctx.fillStyle = prevSkyGrad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
      }

      // Draw current scene
      ctx.save()
      ctx.globalAlpha = s.fadeAlpha
      drawScene(ctx, {
        conditionCode: s.conditionCode,
        timeOfDay: s.timeOfDay,
        particles: s.particles,
        cloudOffset: s.cloudOffset,
        lightningActive: s.lightningActive,
        time: s.time,
      }, delta)
      ctx.restore()

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
    }
  }, [resize])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
