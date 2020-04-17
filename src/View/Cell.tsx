import React from "react"
import game from "game"
import { Position, Tile } from "game/types"
import { directionAngles } from "game/utils"

export interface Props {
  tile: Tile
}

const Cell: React.FC<Props> = ({ tile, children }) => {
  const { position, terrain } = tile
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
        backgroundColor:
          terrain === "none" ? "rgb(77, 79, 80)" : "rgb(77, 223, 234)",
      }}
    ></div>
  )
}

export default Cell
