import { Data } from "game"
import { Entity, Position } from "game/types"
import { castRay } from "game/services/raycast"
import {
  directionAngles,
  getTile,
  positionToId,
  getOffsetAngle,
  wrap,
} from "game/utils"

export function setEntityVision(data: Data, _: any, entity: Entity) {
  const { position, vision } = entity

  const positionsInView: string[] = [positionToId(entity.position)]
  const entitiesInView: string[] = []

  const facingAngle = directionAngles[vision.facing]

  Array.from(data.map.entries()).forEach(([tPos, tile]) => {
    const offsetAngle = getOffsetAngle(position, tile.position)
    const theta = wrap(facingAngle - offsetAngle - 180, 0, 360) - 180

    if (Math.abs(theta) > 64) {
      return
    }

    const result = castRay(position, tile.position, [] as string[], (pos) => {
      const tile = getTile(data, pos)

      if (tile === undefined) {
        return true
      }

      if (tile.terrain === "wall") return true

      if (tile.entity && !(tile.entity === entity.id)) {
        const tEnt = data.entities.get(tile.entity)
        if (tEnt && !(tEnt.health.dead === true)) {
          return true
        }
      }

      return false
    })

    if (result.complete) {
      positionsInView.push(tPos)
      if (tile.entity !== undefined) {
        const tEnt = data.entities.get(tile.entity)
        if (tEnt && !(tEnt.id === entity.id || tEnt.health.dead === true)) {
          entitiesInView.push(tEnt.id)
        }
      }
    }
  })

  entity.vision.positions = positionsInView
  entity.vision.entities = entitiesInView
}
