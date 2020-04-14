import React from "react"
import Cell from "./Cell"
import game from "game"
import find from "lodash-es/find"
import styled from "@emotion/styled"
import { motion } from "framer-motion"
import { useStateDesigner } from "state-designer"

const OverlaysContainer = styled.div({
  position: "absolute",
  top: 0,
  left: 0,
  width: 320,
  height: 320,
  pointerEvents: "none",
})

export interface Props {}

const Overlays: React.FC<Props> = ({ children }) => {
  const { data, isIn } = useStateDesigner(game)

  return (
    <OverlaysContainer>
      <svg width={320} height={320} viewBox={"0 0 320 320"}>
        {isIn("aiming.selected") && <TargetingLine />}
      </svg>
      {data.path.map((position, i) => (
        <CellHighlight
          key={i}
          x={position.x}
          y={position.y}
          color="var(--highlight)"
        />
      ))}
      {data.inRange.map((position, i) => (
        <CellHighlight
          key={i}
          x={position.x}
          y={position.y}
          color="rgba(255, 80, 135, .1)"
        />
      ))}
    </OverlaysContainer>
  )
}

export default Overlays

const Range = () => {
  const { data } = useStateDesigner(game)

  const selectedEntity = data.entities.find(
    (e) => e.data.id === data.selectedEntity
  )

  if (!selectedEntity) {
    console.warn("Shouldn't be in Range!")
    return <path />
  }

  const { x: x1, y: y1 } = selectedEntity.data.position
  const { range } = selectedEntity.data.attack.ranged

  return (
    <circle
      cx={x1 * 32}
      cy={y1 * 32}
      r={range * 32}
      fill="rgba(255, 80, 135, .1)"
    />
  )
}

const TargetingLine = () => {
  const { data } = useStateDesigner(game)

  const selectedEntity = data.entities.find(
    (e) => e.data.id === data.selectedEntity
  )

  const targetedEntity = data.entities.find(
    (e) => e.data.id === data.targetedEntity
  )

  if (!selectedEntity || !targetedEntity) {
    console.warn("Shouldn't be in Targeting Line!")
    return <path />
  }

  const { x: x1, y: y1 } = selectedEntity.data.position
  const { x: x2, y: y2 } = targetedEntity.data.position

  return (
    <line
      x1={16 + x1 * 32}
      y1={16 + y1 * 32}
      x2={16 + x2 * 32}
      y2={16 + y2 * 32}
      strokeWidth={2}
      stroke={"rgba(255, 80, 135, .5)"}
    />
  )
}

const CellHighlight: React.FC<{ color: string; x: number; y: number }> = ({
  color,
  x,
  y,
}) => {
  return (
    <motion.div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        x: x * 32,
        y: y * 32,
        height: 30,
        width: 30,
        backgroundColor: color,
      }}
    />
  )
}
