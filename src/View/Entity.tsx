import React from "react"
import game from "game"
import * as DS from "game/types"
import { motion, useAnimation } from "framer-motion"
import { useStateDesigner } from "state-designer"
import { directionAngles, getTurnDistance, wrap } from "game/utils"

const transition = {
  type: "spring",
  stiffness: 500,
  damping: 300,
  restDelta: 1,
  restSpeed: 1,
}

export interface Props {
  entity: DS.M<DS.Entity>
}

const Entity: React.FC<Props> = ({ entity, children }) => {
  const { data, isIn } = useStateDesigner(entity)
  const { position, vision, health } = data

  const prevFacing = React.useRef(vision.facing)
  const angle = React.useRef(directionAngles[vision.facing])

  const animation = useAnimation()
  const counterAnimation = useAnimation()

  React.useEffect(() => {
    const { x, y } = position

    animation.set({
      y: y * 32,
      x: x * 32,
      rotate: angle.current,
    })

    // Counter rotate HealthBar
    counterAnimation.set({
      rotate: -angle.current,
    })
  }, [])

  React.useEffect(() => {
    // Determine rotation
    const turn = getTurnDistance(prevFacing.current, vision.facing)
    angle.current = angle.current + turn * 45
    prevFacing.current = vision.facing

    // Position
    const { x, y } = position

    animation.start({
      y: y * 32,
      x: x * 32,
      rotate: angle.current,
    })

    // Counter rotate HealthBar
    counterAnimation.start({
      rotate: -angle.current,
    })
  }, [position, vision.facing])

  return (
    <motion.div
      onMouseEnter={() => game.send("HOVERED_ENTITY", entity.data.id)}
      onMouseLeave={() => game.send("UNHOVERED_ENTITY", entity.data.id)}
      onClick={() => game.send("CLICKED_ENTITY", entity.data.id)}
      style={{
        position: "absolute",
        height: 31,
        width: 31,
        opacity: isIn("dead") ? 0.3 : 1,
        zIndex: isIn("dead") ? 1 : 10,
      }}
      initial={false}
      animate={animation}
      transition={transition}
      onAnimationComplete={() => game.send("COMPLETED_STEP")}
    >
      <motion.div
        style={{ position: "absolute", height: 31, width: 31 }}
        initial={false}
        animate={counterAnimation}
        transition={transition}
      >
        {!isIn("dead") && <HealthBar value={health.current / health.max} />}
      </motion.div>
      <EntitySprite state={isIn("fighting") ? "fighting" : "idle"} />
    </motion.div>
  )
}

export default Entity

const HealthBar: React.FC<{ value: number }> = ({ value }) => {
  const width = 16
  const rightEdge = Math.max(0, width * value)

  return (
    <svg height={32} width={32}>
      <g transform={`translate(${(32 - width) / 2}, .5)`}>
        <rect height={3} width={width} stroke="#000" strokeWidth={1} />
        <rect
          x={0.5}
          y={0.5}
          height={2}
          width={width - 1}
          fill="var(--damage)"
          strokeWidth={1}
        />
        <rect
          x={0.5}
          y={0.5}
          height={2}
          width={rightEdge}
          fill="var(--health)"
          strokeWidth={1}
        />
        <line
          x1={rightEdge}
          y1={0.5}
          x2={rightEdge}
          y2={2.5}
          strokeWidth={1}
          stroke="#000"
        />
      </g>
    </svg>
  )
}

const r = 8
const ir = 4
const b = 1 / 6
const c = 2 * Math.PI * ir
const q = c * b

const EntitySprite: React.FC<{ state: "idle" | "fighting" }> = ({ state }) => (
  <svg height={32} width={32}>
    <g>
      <circle
        cx={16}
        cy={16}
        r={r}
        fill={state === "fighting" ? "#faa" : "var(--text)"}
        stroke="#000"
        strokeWidth={1}
      />
      <circle
        cx={16}
        cy={16}
        r={ir}
        fill={"none"}
        stroke={"rgba(0,0,0,.5)"}
        strokeWidth={ir * 1.75}
        strokeDashoffset={c * (b / 2) + c / 4}
        strokeDasharray={`${q} ${c - q}`}
      />
    </g>
  </svg>
)
