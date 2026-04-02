import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { RISK_LEVELS } from '../../utils/riskScoring.js'

const NODE_RADIUS = 36
const COLORS = {
  node: '#00e5c8',
  nodeStroke: 'rgba(0,229,200,0.4)',
  nodeFill: '#141920',
}

export default function Graph({ drugs, pairScores, onSelectPair, onSelectDrug, selectedPair }) {
  const svgRef = useRef(null)
  const simRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current) return
    const container = svgRef.current.parentElement
    const W = container.clientWidth  || 400
    const H = container.clientHeight || 500

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove()

    if (drugs.length === 0) {
      renderEmpty(svgRef.current, W, H)
      return
    }

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H)

    // Defs: glow filter
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Build nodes and links
    const nodes = drugs.map((d, i) => ({
      id: d.generic,
      label: d.display,
      brand: d.brand,
      x: W / 2 + Math.cos((i / drugs.length) * 2 * Math.PI) * 120,
      y: H / 2 + Math.sin((i / drugs.length) * 2 * Math.PI) * 120,
    }))

    const links = pairScores.map(ps => ({
      source: ps.drugA,
      target: ps.drugB,
      score: ps.score,
      riskLevel: ps.riskLevel,
      coAdminCount: ps.coAdminCount ?? 0,
    }))

    // Force simulation
    if (simRef.current) simRef.current.stop()
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(160))
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(NODE_RADIUS + 20))
    simRef.current = sim

    // Edge group
    const edgeG = svg.append('g').attr('class', 'edges')
    const linkSel = edgeG.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.riskLevel.color)
      .attr('stroke-width', d => Math.max(1.5, Math.min(6, Math.log10(d.coAdminCount + 1) * 2)))
      .attr('stroke-opacity', d => d.score > 0 ? 0.7 : 0.3)
      .attr('cursor', 'pointer')
      .attr('filter', 'url(#glow)')
      .on('click', (event, d) => {
        onSelectPair?.({ drugA: d.source.id, drugB: d.target.id })
        event.stopPropagation()
      })
      .on('mouseenter', function(event, d) {
        d3.select(this).attr('stroke-opacity', 1).attr('stroke-width',
          parseFloat(d3.select(this).attr('stroke-width')) + 2)
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .attr('stroke-opacity', d.score > 0 ? 0.7 : 0.3)
          .attr('stroke-width', Math.max(1.5, Math.min(6, Math.log10(d.coAdminCount + 1) * 2)))
      })

    // Add edge labels for high-risk pairs
    const edgeLabelSel = edgeG.selectAll('text.edge-label')
      .data(links.filter(l => l.score >= 30))
      .join('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.riskLevel.color)
      .attr('font-size', 10)
      .attr('font-family', 'var(--font-mono)')
      .attr('pointer-events', 'none')
      .text(d => d.score > 0 ? `${d.score}` : '')

    // Node group
    const nodeG = svg.append('g').attr('class', 'nodes')
    const nodeSel = nodeG.selectAll('g.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x; d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )
      .on('click', (event, d) => {
        onSelectDrug?.(d.id)
        event.stopPropagation()
      })

    // Halo
    nodeSel.append('circle')
      .attr('r', NODE_RADIUS + 10)
      .attr('fill', 'var(--teal-dim)')
      .attr('filter', 'url(#glow)')
      .attr('opacity', 0.5)

    // Node circle
    nodeSel.append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', 'var(--bg-card)')
      .attr('stroke', COLORS.node)
      .attr('stroke-width', 1.5)

    // Drug label (brand - first word)
    nodeSel.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', 'var(--text-primary)')
      .attr('font-size', 11)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-weight', 500)
      .attr('pointer-events', 'none')
      .text(d => {
        const name = d.brand || d.label.split('(')[0].trim()
        const words = name.split(' ')
        return words[0].length > 9 ? words[0].slice(0, 9) + '…' : words[0]
      })

    nodeSel.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.1em')
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', 9)
      .attr('font-family', 'var(--font-mono)')
      .attr('pointer-events', 'none')
      .text(d => {
        const generic = d.id
        return generic.length > 12 ? generic.slice(0, 12) + '…' : generic
      })

    // Entrance animation
    nodeSel.attr('opacity', 0)
      .transition()
      .delay((d, i) => i * 80)
      .duration(400)
      .attr('opacity', 1)

    // Tick
    sim.on('tick', () => {
      linkSel
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      edgeLabelSel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2)

      nodeSel.attr('transform', d =>
        `translate(${clamp(d.x, NODE_RADIUS, W - NODE_RADIUS)},${clamp(d.y, NODE_RADIUS, H - NODE_RADIUS)})`
      )
    })

    // Click background to deselect
    svg.on('click', () => onSelectPair?.(null))

    return () => sim.stop()
  }, [drugs, pairScores])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      role="img"
      aria-label="Drug interaction constellation graph"
    />
  )
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

function renderEmpty(svgEl, W, H) {
  const svg = d3.select(svgEl).attr('width', W).attr('height', H)
  svg.append('text')
    .attr('x', W / 2).attr('y', H / 2 - 12)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-muted)')
    .attr('font-size', 14)
    .attr('font-family', 'var(--font-mono)')
    .text('Add drugs to see the constellation')

  svg.append('text')
    .attr('x', W / 2).attr('y', H / 2 + 16)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--border-dim)')
    .attr('font-size', 11)
    .attr('font-family', 'var(--font-mono)')
    .text('Nodes = drugs · Edges = interactions')
}
