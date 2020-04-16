import { createStateDesigner } from "state-designer"
import { Position, Tile, Entity } from "game/types"

export const map = new Map<Position, Tile>([])

for (let z = 0; z < 1; z++) {
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const position = { x, y, z }
      map.set(position, { position })
    }
  }
}

export default createStateDesigner({
  data: map,
  on: {
    ADDED_ENTITY: {
      get: "tileFromEntity",
      do: "addEntityToTile",
    },
    MOVED_ENTITY: {
      get: "tilesFromMove",
      do: "moveEntityBetweenTiles",
    },
    REMOVED_ENTITY: {
      get: "tileFromEntity",
      do: "removeEntityFromTile",
    },
  },
  results: {
    tileFromEntity(data, entity: Entity) {
      return data.get(entity.position)
    },
    tilesFromMove(data, move: Move) {
      const from = data.get(move.entity.position)
      const to = data.get(move.to)

      return [from, to]
    },
  },
  conditions: {
    tileIsEmpty(data, _, tile: Tile) {
      return tile.entity === undefined
    },
  },
  actions: {
    moveEntityBetweenTiles(data, move: Move, tiles: Tile[]) {
      const { entity } = move
      const [from, to] = tiles

      from.entity = undefined
      to.entity = entity
    },
    removeEntityFromTile(data, _, tile: Tile) {
      tile.entity = undefined
    },
    addEntityToTile(data, entity: Entity, tile: Tile) {
      tile.entity = entity
    },
  },
})

/* ---------------------- Types --------------------- */

type Move = {
  entity: Entity
  to: Position
}
