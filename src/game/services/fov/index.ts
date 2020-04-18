import { Data } from "game"
import range from "lodash-es/range"
import { Entity, Position, BlockerInView, TileInView } from "game/types"
import { castRayBetweenPoints, castRayInAngle } from "game/services/raycast"
import {
  directionAngles,
  getTile,
  positionToId,
  getOffsetAngle,
  wrap,
  getDistanceBetweenPositions,
} from "game/utils"

export function setEntityVision(data: Data, _: any, entity: Entity) {
  const { position, vision } = entity

  const results: {
    blocking?: TileInView
    items: Map<string, TileInView>
  }[] = range(128).map((i) => ({
    blocking: undefined,
    items: new Map([]),
  }))

  const tilesInView: TileInView[] = []
  const blockersInView: BlockerInView[] = []
  const entitiesInView: Set<string> = new Set([])
  const positionsInView: Set<string> = new Set(positionToId(entity.position))

  const facingAngle = directionAngles[vision.facing]

  for (let i = 0; i < 128; i++) {
    const a = facingAngle - 64 + i
    castRayInAngle(position, a, 20, (event) => {
      const { point, distance, angle } = event

      const tile = getTile(data, {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
        z: 0,
      })

      if (tile === undefined) {
        return true
      }

      const tileInView: TileInView = {
        tile,
        distance,
        angle: angle - facingAngle,
        type: "floor",
        blocking: false,
      }

      // Test for entity
      const tEntity = data.entities.get(tile.entity || "")

      if (tEntity !== undefined) {
        if (tEntity.id === entity.id) {
          tileInView.blocking = false
        } else {
          if (tEntity.health.dead) {
            tileInView.blocking = false
            tileInView.type = "corpse"
          } else {
            tileInView.blocking = true
            tileInView.type = "entity"

            entitiesInView.add(tEntity.id)
          }
        }
      }

      // Test for wall
      if (tile.terrain === "wall") {
        tileInView.blocking = true
        tileInView.type = "wall"
      }

      if (tileInView.blocking) {
        results[i].blocking = tileInView
      } else {
        if (!results[i].items.has(tileInView.type)) {
          results[i].items.set(tileInView.type, tileInView)
        }
      }

      tilesInView[i] = tileInView
      positionsInView.add(tile.id)
      return tileInView.blocking
    })
  }

  entity.vision.angles = results
  data.ui.tiles.tilesInView = tilesInView
  entity.vision.positions = positionsInView
  entity.vision.entities = entitiesInView

  data.ui.tiles.inView = Array.from(blockersInView.values())
}
