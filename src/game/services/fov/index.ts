import { Data } from "game"
import { Entity, Position, BlockerInView } from "game/types"
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

  const blockersInView: Set<BlockerInView> = new Set([])
  const entitiesInView: Set<string> = new Set([])
  const positionsInView: Set<string> = new Set(positionToId(entity.position))

  const facingAngle = directionAngles[vision.facing]

  for (let i = facingAngle - 64; i < facingAngle + 64; i++) {
    castRayInAngle(position, i, 20, (event) => {
      const { point, distance, angle } = event

      const tile = getTile(data, {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
        z: 0,
      })

      if (tile === undefined) {
        return true
      }

      const tEntity = data.entities.get(tile.entity || "")

      if (tEntity !== undefined) {
        positionsInView.add(tile.position.id)

        if (tEntity.id === entity.id) return false

        if (tEntity.health.dead) {
          blockersInView.add({
            type: "corpse",
            distance,
            angle: angle - facingAngle,
          })
          return false
        } else {
          blockersInView.add({
            type: "entity",
            distance,
            angle: angle - facingAngle,
          })
          entitiesInView.add(tEntity.id)
          return true
        }
      }

      if (tile.terrain === "wall") {
        blockersInView.add({
          type: "wall",
          distance,
          angle: angle - facingAngle,
        })

        return true
      }

      positionsInView.add(tile.position.id)
      return false
    })
  }

  entity.vision.positions = Array.from(positionsInView.values())
  entity.vision.entities = Array.from(entitiesInView.values())
  data.ui.tiles.inView = Array.from(blockersInView.values())
}
