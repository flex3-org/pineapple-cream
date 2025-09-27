
import { useEffect, useRef, useState } from "react"
import { Button } from "../components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import type { Note } from "./notes-app"

interface GraphViewProps {
  notes: Note[]
}

interface Node {
  id: string
  title: string
  x: number
  y: number
  vx: number
  vy: number
  connections: string[]
  size: number
  color: string
}

export function GraphView({ notes }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create nodes from notes with physics simulation
    const nodes: Node[] = notes.map((note, index) => {
      const angle = (index / notes.length) * 2 * Math.PI
      const radius = Math.min(canvas.width, canvas.height) / 6
      const centerX = canvas.width / (2 * window.devicePixelRatio)
      const centerY = canvas.height / (2 * window.devicePixelRatio)

      // Color based on tags
      let color = "#3b82f6" // default blue
      if (note.tags.includes("daily")) color = "#10b981" // green
      if (note.tags.includes("research")) color = "#8b5cf6" // purple
      if (note.tags.includes("book")) color = "#f59e0b" // amber
      if (note.tags.includes("meeting")) color = "#ef4444" // red

      return {
        id: note.id,
        title: note.title,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
        vx: 0,
        vy: 0,
        connections: note.tags,
        size: Math.max(8, Math.min(16, note.content.length / 100)),
        color,
      }
    })

    // Physics simulation
    const simulate = () => {
      const centerX = canvas.width / (2 * window.devicePixelRatio)
      const centerY = canvas.height / (2 * window.devicePixelRatio)

      nodes.forEach((node) => {
        // Reset forces
        let fx = 0
        let fy = 0

        // Repulsion from other nodes
        nodes.forEach((other) => {
          if (node.id !== other.id) {
            const dx = node.x - other.x
            const dy = node.y - other.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance > 0) {
              const force = 500 / (distance * distance)
              fx += (dx / distance) * force
              fy += (dy / distance) * force
            }
          }
        })

        // Attraction to connected nodes
        nodes.forEach((other) => {
          if (node.id !== other.id) {
            const sharedTags = node.connections.filter((tag) => other.connections.includes(tag))
            if (sharedTags.length > 0) {
              const dx = other.x - node.x
              const dy = other.y - node.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              if (distance > 0) {
                const force = 0.1 * sharedTags.length
                fx += (dx / distance) * force
                fy += (dy / distance) * force
              }
            }
          }
        })

        // Attraction to center
        const centerDx = centerX - node.x
        const centerDy = centerY - node.y
        fx += centerDx * 0.001
        fy += centerDy * 0.001

        // Apply forces
        node.vx += fx * 0.1
        node.vy += fy * 0.1

        // Damping
        node.vx *= 0.9
        node.vy *= 0.9

        // Update position
        node.x += node.vx
        node.y += node.vy

        // Boundary constraints
        const margin = 50
        if (node.x < margin) node.x = margin
        if (node.x > canvas.width / window.devicePixelRatio - margin)
          node.x = canvas.width / window.devicePixelRatio - margin
        if (node.y < margin) node.y = margin
        if (node.y > canvas.height / window.devicePixelRatio - margin)
          node.y = canvas.height / window.devicePixelRatio - margin
      })
    }

    // Animation loop
    const animate = () => {
      simulate()

      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)

      // Apply transformations
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      // Draw connections
      ctx.strokeStyle = "rgba(100, 100, 100, 0.2)"
      ctx.lineWidth = 1
      nodes.forEach((node) => {
        nodes.forEach((otherNode) => {
          if (node.id !== otherNode.id) {
            const sharedTags = node.connections.filter((tag) => otherNode.connections.includes(tag))
            if (sharedTags.length > 0) {
              ctx.strokeStyle = `rgba(100, 100, 100, ${Math.min(0.5, sharedTags.length * 0.2)})`
              ctx.lineWidth = sharedTags.length
              ctx.beginPath()
              ctx.moveTo(node.x, node.y)
              ctx.lineTo(otherNode.x, otherNode.y)
              ctx.stroke()
            }
          }
        })
      })

      // Draw nodes
      nodes.forEach((node) => {
        // Node circle
        ctx.fillStyle = node.color
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI)
        ctx.fill()

        // Node border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 2
        ctx.stroke()

        // Node label
        ctx.fillStyle = "#ffffff"
        ctx.font = "12px system-ui"
        ctx.textAlign = "center"
        const truncatedTitle = node.title.length > 20 ? node.title.substring(0, 20) + "..." : node.title
        ctx.fillText(truncatedTitle, node.x, node.y + node.size + 15)
      })

      ctx.restore()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Mouse interactions
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)))
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("wheel", handleWheel)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("wheel", handleWheel)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [notes, zoom, pan, isDragging, dragStart])

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab"
        style={{
          background: "hsl(var(--background))",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      />

      {/* Controls */}
      <div className="absolute top-4 left-4 bg-card border border-border rounded-lg p-4 shadow-lg">
        <h3 className="font-semibold text-sm mb-2">Graph View</h3>
        <p className="text-xs text-muted-foreground mb-3">{notes.length} notes connected by shared tags</p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Default</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Daily</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Research</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>Books</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((prev) => Math.min(3, prev * 1.2))}
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((prev) => Math.max(0.1, prev * 0.8))}
            className="h-7 w-7 p-0"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetView} className="h-7 w-7 p-0">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Drag to pan</p>
          <p>• Scroll to zoom</p>
          <p>• Nodes attract by shared tags</p>
        </div>
      </div>
    </div>
  )
}
