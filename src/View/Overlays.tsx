import React from "react"
import game from "game"
import config from "game/config"
import styled from "@emotion/styled"
import { Tile } from "game/types"
import { useStateDesigner } from "state-designer"

const OverlaysContainer = styled.div({
  position: "absolute",
  top: 0,
  left: 0,
  width: 320,
  height: 320,
})

export interface Props {}

const Overlays: React.FC<Props> = ({ children }) => {
  const { data, isIn } = useStateDesigner(game)
  const { tiles, entities } = data.ui
  const { size } = config.map

  const selectedEntity = data.entities.get(entities.selected || "")

  const tilesInMap = Array.from(data.map.values()).map((tile, i) => (
    <CellTile key={i} tile={tile} />
  ))

  const tilesInPath = tiles.inPath.map((tile, i) => (
    <CellHighlight
      key={i}
      x={tile.position.x}
      y={tile.position.y}
      color="var(--highlight)"
    />
  ))

  const tilesInRange = React.useMemo(() => {
    return tiles.inRange.map((tile, i) => (
      <CellHighlight
        key={i}
        x={tile.position.x}
        y={tile.position.y}
        color="var(--range)"
      />
    ))
  }, [tiles.inRange])

  const tilesInView = React.useMemo(() => {
    return (
      selectedEntity &&
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
      ))
    )
  }, [selectedEntity, selectedEntity?.vision.positions])

  return (
    <OverlaysContainer>
      <svg
        width={size.x * 32}
        height={size.y * 32}
        viewBox={`0 0 ${size.x * 32} ${size.y * 32}`}
      >
        <defs>
          <rect id="tile" height={32} width={32} />
        </defs>
        <clipPath id="tileClip">
          <rect id="tile" height={32} width={32} />
        </clipPath>
        {tilesInMap}
        {tilesInView}
        {tilesInPath}
        {tilesInRange}
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
    <g pointerEvents="none">
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

const CellTile: React.FC<{ tile: Tile }> = ({ tile }) => {
  const { x, y } = tile.position
  const color = tile.terrain === "none" ? "var(--floor)" : "var(--wall)"

  const isHovered = React.useRef(false)

  return (
    <g
      transform={`translate(${x * 32} ${y * 32})`}
      onMouseEnter={() => {
        isHovered.current = true
        requestAnimationFrame(() => {
          if (isHovered.current) {
            game.send("HOVERED_TILE", tile)
          }
        })
      }}
      onMouseLeave={() => {
        isHovered.current = false
        requestAnimationFrame(() => {
          if (!isHovered.current) {
            game.send("UNHOVERED_TILE", tile)
          }
        })
      }}
      onClick={(e) => {
        if (e.metaKey) {
          game.send("ADDED_WALL", tile)
        } else {
          game.send("CLICKED_TILE", tile)
        }
      }}
    >
      <g clipPath="url(#tileClip)">
        <use fill={color} xlinkHref="#tile" />
        <polyline
          points={"0,32 0,0 32,0"}
          strokeWidth={2}
          stroke="var(--highlight)"
          strokeLinecap="square"
          fill="none"
        />
        <polyline
          points={"32,0 32,32 0,32"}
          strokeWidth={2}
          stroke="var(--shadow)"
          strokeLinecap="square"
          fill="none"
        />
      </g>
    </g>
  )
}

const CellHighlight: React.FC<{ color: string; x: number; y: number }> = ({
  color,
  x,
  y,
}) => {
  return (
    <g transform={`translate(${x * 32} ${y * 32})`} pointerEvents="none">
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
      pointerEvents="none"
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
