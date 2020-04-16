import { createStateDesigner } from "state-designer"
import range from "lodash-es/range"
import uniqueId from "lodash-es/uniqueId"
import Pathfinding, { Grid, GridType } from "./services/pathfinding"
import { Position, Tile, Entity, Direction } from "game/types"
import {
  getOffsetDirection,
  getOffsetAngle,
  getTurnDistance,
  getOffsetFacing,
  directionAngles,
  getDistanceBetweenPositions,
  wrap,
} from "game/utils"

// Initial data

const MAP_SIZE = {
  x: 10,
  y: 10,
  z: 1,
}

export const entities = new Map<string, Entity>([])

export const map = new Map<Position, Tile>([])

for (let z = 0; z < MAP_SIZE.z; z++) {
  for (let y = 0; y < MAP_SIZE.y; y++) {
    for (let x = 0; x < MAP_SIZE.x; x++) {
      const position = { x, y, z }
      map.set(position, {
        position,
      })
    }
  }
}

function getPosition(position: Position): Position {
  return Array.from(state.data.map.keys()).find(
    (p) => p.x === position.x && p.y === position.y && p.z === position.z
  ) as Position
}

function getTile(position: Position) {
  const pos = getPosition(position)
  return state.data.map.get(pos)
}

function swapTileEntities(from: Tile, to: Tile) {
  let t = from.entity
  from.entity = to.entity
  to.entity = t

  for (let tile of [from, to]) {
    const { entity } = tile
    const { x, y } = tile.position
    if (entity === undefined) {
      pathGrid.removeUnwalkableCoord(x, y)
    } else {
      entity.position = tile.position
      pathGrid.addUnwalkableCoord(x, y)
    }
  }
}

const pathGrid = new Grid({
  tiles: range(MAP_SIZE.y).map((y) => range(MAP_SIZE.x).map((x) => 1)),
  walkableTiles: [1],
  type: GridType.intercardinal,
})

// Game machine

const state = createStateDesigner({
  data: {
    map,
    entities,
    ui: {
      entities: {
        hovered: undefined as Entity | undefined,
        selected: undefined as Entity | undefined,
        targeted: undefined as Entity | undefined,
      },
      tiles: {
        hovered: undefined as Tile | undefined,
        inRange: [] as Tile[],
        inPath: [] as Tile[],
      },
    },
  },
  on: {
    ADDED_ENTITY: {
      get: "tileFromEntity",
      do: ["addEntityToTile", "addEntityToEntities"],
    },
    MOVED_ENTITY: {
      get: "tilesFromMove",
      do: "moveEntityBetweenTiles",
    },
    REMOVED_ENTITY: {
      get: "tileFromEntity",
      do: ["removeEntityFromTile", "removeEntityFromEntities"],
    },
    HOVERED_TILE: { get: "tileFromTile", do: "setHoveredTile" },
    HOVERED_ENTITY: [
      { get: "entityFromEntity", do: "setHoveredEntity" },
      { get: "tileFromEntity", do: "setHoveredTile" },
    ],
    UNHOVERED_ENTITY: "clearHoveredEntity",
  },
  initial: "selecting",
  states: {
    selecting: {
      on: {
        CLICKED_ENTITY: {
          get: "entityFromEntity",
          unless: "entityIsDead",
          do: "setSelectedEntity",
          to: "selected",
        },
      },
    },
    selected: {
      on: {
        TOGGLED_TURN: { to: "turning" },
        TOGGLED_MOVE: { to: "moving" },
        TOGGLED_AIM: { to: "aiming" },
      },
      onExit: "clearSelectedEntity",
      onEnter: {
        get: "selectedEntity",
        do: "setEntityVision",
      },
      initial: "idle",
      states: {
        idle: {
          on: {
            CANCELLED: { to: "selecting" },
            CLICKED_ENTITY: [
              {
                get: "entityFromEntity",
                if: "entityIsSelected",
                to: "selecting",
              },
              {
                get: "entityFromEntity",
                unless: "entityIsDead",
                do: "setSelectedEntity",
                to: "selected",
              },
            ],
          },
        },
        moving: {
          initial: "selecting",
          onExit: "clearPath",
          states: {
            selecting: {
              on: {
                HOVERED_TILE: {
                  get: "selectedEntity",
                  do: "setPathToTile",
                },
                HOVERED_ENTITY: [
                  {
                    if: "entityIsSelected",
                    do: "clearPath",
                  },
                  {
                    get: "selectedEntity",
                    unless: "entityIsSelected",
                    do: "setPathToTile",
                  },
                ],
                CLICKED_ENTITY: [
                  { if: "entityIsSelected", to: "idle" },
                  {
                    to: "animating",
                  },
                ],
                CLICKED_TILE: {
                  to: "animating",
                },
              },
            },
            animating: {
              onEnter: {
                get: "selectedEntity",
                do: ["advanceAlongPath", "setEntityVision"],
              },
              on: {
                CANCELLED: { to: "selecting" },
                COMPLETED_STEP: [
                  { if: "pathIsEmpty", to: "selecting" },
                  {
                    get: "selectedEntity",
                    do: ["advanceAlongPath", "setEntityVision"],
                  },
                ],
              },
            },
          },
          on: {
            TOGGLED_MOVE: { to: "idle" },
            CANCELLED: {
              do: "clearPath",
              to: "idle",
            },
          },
        },
        turning: {
          on: {
            CANCELLED: { to: "idle" },
            CLICKED_BOARD: { to: "idle" },
            HOVERED_TILE: {
              get: "selectedEntity",
              do: ["turnEntity", "setEntityVision"],
            },
          },
        },
        aiming: {
          on: {
            CANCELLED: { to: "idle" },
          },
        },
      },
    },
  },
  results: {
    // Tiles
    tileFromEntity(data, entity: Entity) {
      return data.map.get(entity.position)
    },
    tilesFromMove(data, move: Move) {
      const from = data.map.get(move.entity.position)
      const to = data.map.get(move.to)

      return [from, to]
    },
    tileFromTile(data, tile: Tile) {
      return tile
    },
    // Entities
    entityFromId(data, id: string) {
      return data.entities.get(id)
    },
    entityFromEntity(data, entity: Entity) {
      return entity
    },
    selectedEntity(data) {
      return data.ui.entities.selected
    },
    hoveredEntity(data) {
      return data.ui.entities.hovered
    },
    targetedEntity(data) {
      return data.ui.entities.targeted
    },
  },
  conditions: {
    // Tiles
    tileIsEmpty(data, _, tile: Tile) {
      return tile.entity === undefined
    },
    // Entities
    entityIsDead(data, _, entity: Entity) {
      return entity.health.current <= 0
    },
    entityIsSelected(data, _, entity: Entity) {
      const { selected } = data.ui.entities
      return selected === entity
    },
    pathIsEmpty(data) {
      return data.ui.tiles.inPath.length === 0
    },
  },
  actions: {
    // Tiles
    moveEntityBetweenTiles(data, move: Move, tiles: Tile[]) {
      const [from, to] = tiles
      const { entity } = move

      to.entity = entity
      from.entity = undefined

      entity.position = getPosition(to.position)

      pathGrid.addUnwalkableCoord(to.position.x, to.position.y)
      pathGrid.removeUnwalkableCoord(from.position.x, from.position.y)
    },
    removeEntityFromTile(data, entity: Entity, tile: Tile) {
      tile.entity = undefined
      pathGrid.removeUnwalkableCoord(tile.position.x, tile.position.y)
    },
    addEntityToTile(data, entity: Entity, tile: Tile) {
      tile.entity = entity
    },
    setHoveredTile(data, _, tile: Tile) {
      data.ui.tiles.hovered = tile
    },
    clearHoveredTile(data) {
      data.ui.entities.hovered = undefined
    },
    // Entities
    addEntityToEntities(data, entity: Entity) {
      data.entities.set(entity.id, entity)
      pathGrid.addUnwalkableCoord(entity.position.x, entity.position.y)
    },
    removeEntityFromEntities(data, entity: Entity) {
      data.entities.delete(entity.id)
      pathGrid.removeUnwalkableCoord(entity.position.x, entity.position.y)
    },
    // Moving
    setPathToTile(data, tile: Tile, entity: Entity) {
      const from = entity.position
      const to = tile.position

      if (to === undefined) {
        console.error("Missing hoveredPosition!")
        return
      }

      const positions = Pathfinding.findPathSync(pathGrid, from, to)
      const path: Tile[] = []

      if (positions !== null) {
        for (let i = 1; i < positions.length; i++) {
          const pos = getPosition(positions[i])
          const tile = data.map.get(pos)
          if (tile === undefined) {
            throw new Error("Couldn't find that tile!")
          } else {
            path.push(tile)
          }
        }
      }

      data.ui.tiles.inPath = path
    },
    clearPath(data) {
      data.ui.tiles.inPath = []
    },
    advanceAlongPath(data, _, entity: Entity) {
      const { inPath } = data.ui.tiles

      let next = inPath[0]

      if (next === undefined) {
        console.error("Path is empty! Can't advance.")
        return
      }

      const offsetDirection = getOffsetDirection(entity.position, next.position)

      const turnDistance = getTurnDistance(
        entity.vision.facing,
        offsetDirection
      )

      const absTurnDistance = Math.abs(turnDistance)

      /* 
      If there's no turn distance, then the entity is
      already facing the right direction and can movee. 
      If there's an adjacent turn (like n to nw) then
      it can move and turn at the same time. If it's
      a bigger turn, turn the entity until it can move.
      */
      if (absTurnDistance <= 1) {
        if (absTurnDistance === 1) {
          const nextDirection = getOffsetFacing(
            entity.vision.facing,
            turnDistance
          )
          entity.vision.facing = nextDirection
        }

        // Move entity between positions
        const to = inPath.shift()
        const from = data.map.get(entity.position)

        if (to && from) {
          to.entity = entity
          from.entity = undefined

          entity.position = getPosition(to.position)

          pathGrid.addUnwalkableCoord(to.position.x, to.position.y)
          pathGrid.removeUnwalkableCoord(from.position.x, from.position.y)
        } else {
          throw new Error("Can't move entity — to or from is missing!")
        }
      } else {
        const nextDirection = getOffsetFacing(
          entity.vision.facing,
          turnDistance > 1 ? 1 : -1
        )
        entity.vision.facing = nextDirection
      }
    },
    // Turning
    turnEntity(data, tile: Tile, entity: Entity) {
      const direction = getOffsetDirection(entity.position, tile.position)

      entity.vision.facing = direction
    },
    // Vision
    setEntityVision(data, _, entity: Entity) {
      const { position, vision } = entity

      const positionsInView: Position[] = []
      const entitiesInView: string[] = []

      const facingAngle = directionAngles[vision.facing]

      Array.from(data.map.entries()).forEach(([tPos, tile]) => {
        const offsetAngle = getOffsetAngle(position, tPos)
        const theta = wrap(facingAngle - offsetAngle - 180, 0, 360) - 180

        if (Math.abs(theta) < 64) {
          positionsInView.push(tPos)

          const { entity } = tile
          if (entity !== undefined) {
            entitiesInView.push(entity.id)
          }
        }
      })

      entity.vision.positions = positionsInView
      entity.vision.entities = entitiesInView
    },
    // Health
    reduceEntityHealthByDamage(data, attack: Attack) {
      const { entity, damage } = attack
      entity.health.current -= damage
    },
    // UI
    setSelectedEntity(data, entity: Entity) {
      data.ui.entities.selected = entity
    },
    clearSelectedEntity(data) {
      data.ui.entities.selected = undefined
    },
    setHoveredEntity(data, entity: Entity) {
      data.ui.entities.hovered = entity
    },
    clearHoveredEntity(data) {
      data.ui.entities.hovered = undefined
    },
    setTargetedEntity(data, _, entity: Entity) {
      data.ui.entities.targeted = entity
    },
    clearTargetedEntity(data, _, entity: Entity) {
      data.ui.entities.targeted = entity
    },
    setEntityTilesInRange(data, _, entity: Entity) {
      const { position, attack } = entity

      const tilesInRange: Tile[] = []

      entity.vision.tiles.forEach((tile) => {
        const distance = getDistanceBetweenPositions(position, tile.position)

        if (distance < attack.ranged.range) {
          tilesInRange.push(tile)
        }
      })

      data.ui.tiles.inRange = tilesInRange
    },
    clearTilesInRange(data) {
      data.ui.tiles.inRange = []
    },
  },
})

export function getNewEntity(
  position: Position,
  initialFacing: Direction
): Entity {
  const pos = getPosition(position)

  return {
    id: uniqueId("entity_"),
    position: pos,
    health: {
      current: 10,
      max: 10,
      dead: false,
    },
    attack: {
      melee: {
        damage: 3,
        accuracy: 0.85,
      },
      ranged: {
        damage: 3,
        range: 6,
        accuracy: 0.85,
      },
    },
    vision: {
      facing: initialFacing,
      tiles: [] as Tile[],
      positions: [] as Position[],
      entities: [] as string[],
    },
  }
}

// Types

type Move = {
  entity: Entity
  to: Position
}

type Turn = {
  entity: Entity
  direction: Direction
}

type Attack = {
  entity: Entity
  damage: number
}

export default state
