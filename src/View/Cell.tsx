import React from "react"
import game from "game"
import { Position } from "game/types"
import { directionAngles } from "game/utils"

export interface Props {
  position: Position
  visible: boolean
}

const Cell: React.FC<Props> = ({ position, visible, children }) => {
  const { x, y } = position

  return (
    <div
      onMouseEnter={() => game.send("HOVERED_CELL", position)}
      onMouseLeave={() => game.send("UNHOVERED_CELL", position)}
      onClick={(e) => {
        if (e.metaKey) {
          game.send("COMMAND_CLICKED_CELL", position)
        } else {
          game.send("CLICKED_CELL", position)
        }
      }}
      style={{
        position: "absolute",
        top: y * 32,
        left: x * 32,
        width: 32,
        height: 32,
        backgroundColor: visible
          ? "rgba(255,255,255,.2)"
          : "rgba(255,255,255,.05)",
      }}
    ></div>
  )
}

export default Cell
