import React from "react"
import game from "game/game"
import { Position, Tile } from "game/types"
import { directionAngles } from "game/utils"

export interface Props {
  tile: Tile
  visible: boolean
}

const Cell: React.FC<Props> = ({ tile, visible, children }) => {
  const { position } = tile
  const { x, y } = position

  return (
    <div
      onMouseEnter={() => game.send("HOVERED_TILE", tile)}
      onMouseLeave={() => game.send("UNHOVERED_TILE", tile)}
      onClick={(e) => {
        if (e.metaKey) {
          game.send("COMMAND_CLICKED_TILE", tile)
        } else {
          game.send("CLICKED_TILE", tile)
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
