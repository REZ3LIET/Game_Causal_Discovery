import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import CausalNode from './CausalNode'

const nodeTypes = { causal: CausalNode }

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function EdgesOverlay({ edges, nodes, onDeleteEdge }) {
  const [hovered, setHovered] = useState(null)
  const svgRef = useRef(null)
  const [centers, setCenters] = useState({})

  const getNodeCenter = useCallback((nodeId) => {
    const el = document.querySelector(`[data-id="${nodeId}"]`)
    if (!el || !svgRef.current) return null
    const nodeRect = el.getBoundingClientRect()
    const svgRect = svgRef.current.getBoundingClientRect()
    return {
      x: nodeRect.left + nodeRect.width / 2 - svgRect.left,
      y: nodeRect.top + nodeRect.height / 2 - svgRect.top,
    }
  }, [])

  useEffect(() => {
    const update = () => {
      const map = {}
      nodes.forEach((n) => { const c = getNodeCenter(n.id); if (c) map[n.id] = c })
      setCenters(map)
    }
    update()
    const observer = new MutationObserver(update)
    const container = document.querySelector('.react-flow__nodes')
    if (container) observer.observe(container, { attributes: true, subtree: true, attributeFilter: ['style'] })
    window.addEventListener('resize', update)
    return () => { observer.disconnect(); window.removeEventListener('resize', update) }
  }, [nodes, getNodeCenter])

  if (edges.length === 0) return null

  return (
    <svg
      ref={svgRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}
      onMouseLeave={() => setHovered(null)}
    >
      <defs>
        <marker id="ov-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#7c6af7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        <marker id="ov-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      {edges.map((edge) => {
        const s = centers[edge.source], t = centers[edge.target]
        if (!s || !t) return null
        const isHot = hovered === edge.id
        const dx = t.x - s.x, dy = t.y - s.y
        const len = Math.hypot(dx, dy)
        if (len < 2) return null
        const r = 30
        const sx = s.x + (dx / len) * r, sy = s.y + (dy / len) * r
        const tx = t.x - (dx / len) * r, ty = t.y - (dy / len) * r
        const mx = (sx + tx) / 2, my = (sy + ty) / 2
        return (
          <g key={edge.id} style={{ cursor: 'pointer', pointerEvents: 'all' }}
            onClick={() => onDeleteEdge(edge.id)}
            onMouseEnter={() => setHovered(edge.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <line x1={sx} y1={sy} x2={tx} y2={ty} stroke="transparent" strokeWidth={24} />
            <line x1={sx} y1={sy} x2={tx} y2={ty}
              stroke={isHot ? '#f87171' : '#7c6af7'} strokeWidth={isHot ? 2.5 : 2}
              markerEnd={isHot ? 'url(#ov-arrow-hot)' : 'url(#ov-arrow)'}
            />
            {isHot && (
              <g transform={`translate(${mx},${my})`}>
                <circle r="9" fill="#16161a" stroke="#f87171" strokeWidth="1"/>
                <text textAnchor="middle" dominantBaseline="central" fill="#f87171" fontSize="10" fontWeight="500">✕</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function Inner({ level, interventions, nodes, edges, setNodes, setEdges }) {
  const [sourceNode, setSourceNode] = useState(null)
  const { fitView } = useReactFlow()

  // Re-fit after nodes load (fixes delayed appearance)
  useEffect(() => {
    if (nodes.length === 0) return
    const t = setTimeout(() => fitView({ padding: 0.4, duration: 200 }), 50)
    return () => clearTimeout(t)
  }, [nodes.length, fitView])

  const handleNodeClick = useCallback((clickedId) => {
    if (sourceNode === null) {
      setSourceNode(clickedId)
    } else if (sourceNode === clickedId) {
      setSourceNode(null)
    } else {
      const edgeId = `${sourceNode}->${clickedId}`
      const alreadyExists = edges.some((e) => e.source === sourceNode && e.target === clickedId)
      if (!alreadyExists) {
        setEdges((eds) => [...eds, { id: edgeId, source: sourceNode, target: clickedId }])
      }
      setSourceNode(null)
    }
  }, [sourceNode, edges, setEdges])

  const handlePaneClick = useCallback(() => setSourceNode(null), [])

  const handleDeleteEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId))
  }, [setEdges])

  const nodesWithState = useMemo(() =>
    nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        intervened: interventions.some((iv) => iv.variable === n.id),
        selectState:
          sourceNode === n.id ? 'source'
          : sourceNode !== null ? 'target-eligible'
          : 'none',
        onNodeClick: handleNodeClick,
      },
    })),
    [nodes, interventions, sourceNode, handleNodeClick]
  )

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border relative">
      <ReactFlow
        nodes={nodesWithState}
        edges={[]}
        onNodesChange={(changes) =>
          setNodes((ns) => ns.map((n) => {
            const c = changes.find((ch) => ch.id === n.id && ch.type === 'position')
            if (c?.position) return { ...n, position: c.position }
            return n
          }))
        }
        onEdgesChange={() => {}}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      <EdgesOverlay edges={edges} nodes={nodes} onDeleteEdge={handleDeleteEdge} />

      {/* Active source indicator — minimal, only shown when drawing */}
      {sourceNode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted bg-surface/90 px-3 py-1 rounded-full border border-border pointer-events-none whitespace-nowrap z-20">
          click target to draw <span className="text-accent font-mono">{sourceNode} →</span> edge · click {sourceNode} again to cancel
        </div>
      )}
    </div>
  )
}

export default function GraphEditor(props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  )
}