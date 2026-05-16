import { Handle, Position } from '@xyflow/react'

export default function CausalNode({ id, data }) {
  const { label, intervened, selectState, onNodeClick } = data

  const isSource = selectState === 'source'
  const isEligible = selectState === 'target-eligible'

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onNodeClick(id) }}
      className={`
        relative flex items-center justify-center
        w-14 h-14 rounded-full
        font-mono font-medium text-lg
        border-2 transition-all duration-150 select-none cursor-pointer
        ${isSource
          ? 'bg-accent/30 border-accent text-accent shadow-[0_0_20px_4px_rgba(124,106,247,0.4)] scale-110'
          : isEligible
          ? 'bg-success/10 border-success text-success hover:bg-success/20 scale-105'
          : intervened
          ? 'bg-accent/20 border-accent text-accent shadow-[0_0_16px_2px_rgba(124,106,247,0.3)]'
          : 'bg-node border-border text-white hover:border-accent/60 hover:scale-105'
        }
      `}
    >
      {label}
      <Handle type="source" position={Position.Top}    id="s-top"    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Left}   id="s-left"   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right}  id="s-right"  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Top}    id="t-top"    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Left}   id="t-left"   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Right}  id="t-right"  style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}