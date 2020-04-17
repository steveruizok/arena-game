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
  const { tiles, entities } = data.ui

  const selectedEntity = data.entities.get(entities.selected || "")

  return (
    <OverlaysContainer>
      <svg width={320} height={320} viewBox={"0 0 320 320"}>
        {selectedEntity &&
          Array.from(data.map.values()).map((tile, i) => (
            <CellHighlight
              key={i}
              x={tile.position.x}
              y={tile.position.y}
              color={
                selectedEntity.vision.positions.includes(tile.id)
                  ? "var(--highlight)"
                  : "var(--indent)"
              }
            />
          ))}
        {tiles.inPath.map((tile, i) => (
          <CellHighlight
            key={i}
            x={tile.position.x}
            y={tile.position.y}
            color="var(--highlight)"
          />
        ))}
        {tiles.inRange.map((tile, i) => (
          <CellHighlight
            key={i}
            x={tile.position.x}
            y={tile.position.y}
            color="var(--range)"
          />
        ))}
        {isIn("aiming.selected") && <TargetingLine />}
        {tiles.hovered && (
          <Cursor
            x={tiles.hovered.position.x}
            y={tiles.hovered.position.y}
            color={tiles.hovered.entity ? "var(--entity)" : "var(--position)"}
          />
        )}
        {selectedEntity && (
          <Cursor
            x={selectedEntity.position.x}
            y={selectedEntity.position.y}
            color={"var(--selected)"}
          />
        )}
      </svg>
    </OverlaysContainer>
  )
}

export default Overlays

const TargetingLine = () => {
  const { data } = useStateDesigner(game)

  const selected = data.entities.get(data.ui.entities.selected || "")
  const targeted = data.entities.get(data.ui.entities.targeted || "")

  if (!selected || !targeted) {
    console.warn("Shouldn't be in Targeting Line!")
    return <path />
  }

  const { x: x1, y: y1 } = selected.position
  const { x: x2, y: y2 } = targeted.position

  return (
    <g>
      <line
        x1={16 + x1 * 32}
        y1={16 + y1 * 32}
        x2={16 + x2 * 32}
        y2={16 + y2 * 32}
        strokeWidth={1}
        stroke={"var(--target)"}
      />
    </g>
  )
}

const CellHighlight: React.FC<{ color: string; x: number; y: number }> = ({
  color,
  x,
  y,
}) => {
  return (
    <g transform={`translate(${x * 32} ${y * 32})`}>
      <rect height={32} width={32} fill={color} />
    </g>
  )
}

const Cursor: React.FC<{ color: string; x: number; y: number }> = ({
  color,
  x,
  y,
}) => {
  return (
    <g
      transform={`translate(${x * 32} ${y * 32})`}
      fill="none"
      strokeLinejoin="bevel"
    >
      <rect
        x={1.5}
        y={1.5}
        height={29}
        width={29}
        stroke={"black"}
        strokeWidth="3"
        strokeDashoffset={5}
        strokeDasharray={"10 19"}
      />
      <rect
        x={1.5}
        y={1.5}
        height={29}
        width={29}
        stroke={color}
        strokeWidth="1"
        strokeDashoffset={4}
        strokeDasharray={"8 21"}
      />
    </g>
  )
}
