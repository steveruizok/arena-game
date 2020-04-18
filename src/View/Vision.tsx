import React from "react"
import game from "game"
import { BlockerInView } from "game/types"
import styled from "@emotion/styled"
import { useStateDesigner } from "state-designer"
import { transform } from "framer-motion"

export interface Props {
  width?: number
  height?: number
  fov?: number
}

const Container = styled.div({
  backgroundColor: "var(--surface)",
  border: "1px solid var(--highlight)",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
})

const colors = {
  entity: "238, 232, 220",
  wall: "107, 224, 232",
  corpse: "121, 122, 119",
}

const VisionCanvas: React.FC<Props> = ({
  width = 320,
  height = 128,
  fov = 128,
  children,
}) => {
  const { data } = useStateDesigner(game)
  const rCanvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const cvs = rCanvas.current
    const ctx = cvs?.getContext("2d")
    if (!ctx) return

    const { inView } = data.ui.tiles

    paintRaycastVision(ctx, width, height, fov, inView)
  }, [data.ui.tiles.inView])

  return (
    <Container style={{ width, height }}>
      <canvas
        ref={rCanvas}
        width={256}
        height={height - 32}
        style={{ imageRendering: "pixelated" }}
      />
    </Container>
  )
}

export default VisionCanvas

function paintRaycastVision(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fov: number,
  inView: BlockerInView[]
) {
  const cw = 256
  const ch = height - 32
  const cm = ch / 2
  const lw = cw / fov

  ctx.clearRect(0, 0, cw, ch)

  if (inView.length === 0) return

  // Ceiling and floor
  ctx.fillStyle = "rgb(70, 71, 72)"
  ctx.fillRect(0, 0, width, cm)
  ctx.fillStyle = "rgb(101, 102, 101)"
  ctx.fillRect(0, cm, width, cm)

  // Ceiling and floor shadows
  const g = ctx.createLinearGradient(0, 0, ch, cw)
  g.addColorStop(0, "rgba(0,0,0,0)")
  g.addColorStop(0.5, "rgba(0,0,0,.3)")
  g.addColorStop(1, "rgba(0,0,0,0)")

  ctx.fillStyle = g
  ctx.fillRect(0, 0, cw, ch)

  // Paint blocking items (walls, entities)
  for (let i = 0; i < inView.length; i++) {
    const { angle, distance, type } = inView[i]

    if (type === "corpse") continue

    const d = transform(distance, [0, 16], [1, 0], {
      ease: (t) => t * (2 - t),
    })

    const lh = (d * ch) / 2
    const lX = lw * (angle + 64)

    ctx.beginPath()

    ctx.moveTo(lX, cm - lh)
    ctx.lineTo(lX, cm + lh)

    ctx.lineWidth = lw
    ctx.strokeStyle = `rgb(58, 59, 60)`
    ctx.stroke()
    ctx.strokeStyle = `rgba(${colors[type] || ""},${d})`
    ctx.stroke()
  }

  // Paint non-blocking items (corpses)
  for (let i = 0; i < inView.length; i++) {
    const { angle, distance, type } = inView[i]

    if (type !== "corpse") continue

    const d = transform(distance, [0, 16], [1, 0], {
      ease: (t) => t * (2 - t),
    })

    const lh = (d * ch) / 2
    const lX = lw * (angle + 64)

    ctx.moveTo(lX, cm + lh - 12)
    ctx.lineTo(lX, cm + lh)

    ctx.lineWidth = lw
    ctx.strokeStyle = `rgb(58, 59, 60)`
    ctx.stroke()
    ctx.strokeStyle = `rgba(${colors[type] || ""},${d})`
    ctx.stroke()
  }
}
