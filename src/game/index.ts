import { createStateDesigner } from "state-designer"
import range from "lodash-es/range"
import uniqueId from "lodash-es/uniqueId"
import { setEntityVision } from "game/services/fov"
import Pathfinding, { Grid, GridType } from "game/services/pathfinding"
import {
  Position,
  Tile,
  Entity,
  Direction,
  BlockerInView,
  TileInView,
} from "game/types"
import {
  getOffsetDirection,
  getOffsetAngle,
  getTurnDistance,
  getOffsetFacing,
  directionAngles,
  positionToId,
  getTile,
  getPosition,
  getDistanceBetweenPositions,
  wrap,
} from "game/utils"
import config from "game/config"

// Initial data

export const entities = new Map<string, Entity>([])

export const map = new Map<string, Tile>([])

const pathTiles = range(config.map.size.y).map((y) =>
  range(config.map.size.x).map((p) => 1)
)

for (let z = 0; z < config.map.size.z; z++) {
  for (let y = 0; y < config.map.size.y; y++) {
    for (let x = 0; x < config.map.size.x; x++) {
      const id = positionToId({ x, y, z })
      const position = { id, x, y, z }

      const isWall = !(
        x > 0 &&
        x < config.map.size.x - 1 &&
        y > 0 &&
        y < config.map.size.y - 1
      )

      const terrain = isWall ? "wall" : "none"

      if (terrain === "wall") {
        pathTiles[y][x] = 0
      }

      map.set(id, {
        id,
        position,
        terrain,
      })
    }
  }
}

const pathGrid = new Grid({
  tiles: pathTiles,
  walkableTiles: [1],
  type: GridType.intercardinal,
})

// Game machine

const data = {
  map,
  entities,
  ui: {
    entities: {
      hovered: undefined as string | undefined,
      selected: undefined as string | undefined,
      targeted: undefined as string | undefined,
    },
    tiles: {
      hovered: undefined as Tile | undefined,
      tilesInView: [] as TileInView[],
      inView: [] as BlockerInView[],
      inRange: [] as Tile[],
      inPath: [] as Tile[],
    },
  },
}

export type Data = typeof data

const state = createStateDesigner({
  data,
  on: {
    ADDED_ENTITY: {
      get: "tileFromEntity",
      do: ["addEntityToTile", "addEntityToEntities"],
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
    ADDED_WALL: [
      {
        get: "tileFromTile",
        if: "tileIsEmpty",
        do: "addWallToPosition",
      },
    ],
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
        ADDED_WALL: {
          get: "selectedEntity",
          do: "setEntityVision",
        },
      },
      onExit: ["clearSelectedEntity", "clearTilesInView"],
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
          on: {
            TOGGLED_MOVE: { to: "idle" },
            CANCELLED: {
              do: "clearPath",
              to: "idle",
            },
          },
          states: {
            selecting: {
              onEnter: {
                get: "selectedEntity",
                do: "setPathToHoveredTile",
              },
              on: {
                HOVERED_TILE: {
                  get: "selectedEntity",
                  do: "setPathToHoveredTile",
                },
                CLICKED_TILE: {
                  to: "animating",
                },
                HOVERED_ENTITY: [
                  {
                    get: "hoveredEntity",
                    if: "entityIsSelected",
                    do: "clearPath",
                  },
                  {
                    get: "selectedEntity",
                    unless: ["entityIsDead", "entityIsSelected"],
                    do: "setPathToHoveredTile",
                  },
                ],
                CLICKED_ENTITY: [
                  { if: "entityIsSelected", to: "idle" },
                  {
                    to: "animating",
                  },
                ],
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
        },
        turning: {
          onEnter: {
            get: "selectedEntity",
            do: ["turnEntityToHoveredTile", "setEntityVision"],
          },
          on: {
            CANCELLED: { to: "idle" },
            CLICKED_BOARD: { to: "idle" },
            HOVERED_TILE: {
              get: "selectedEntity",
              do: ["turnEntityToHoveredTile", "setEntityVision"],
            },
          },
        },
        aiming: {
          initial: "selecting",
          onExit: "clearTilesInRange",
          onEnter: [
            {
              get: "selectedEntity",
              do: "setTilesInRangeOfEntity",
            },
            {
              get: "hoveredEntity",
              if: [
                "hoveredEntityIsVisibleToSelectedEntity",
                "hoveredEntityIsInRangeOfSelectedEntity",
              ],
              do: "setTargetedEntity",
              to: "selected",
            },
          ],
          on: {
            TOGGLED_AIM: { to: "idle" },
            CANCELLED: { to: "idle" },
            ADDED_WALL: {
              get: "hoveredEntity",
              unless: ["entityIsSelected", "entityIsDead"],
              if: [
                "hoveredEntityIsVisibleToSelectedEntity",
                "hoveredEntityIsInRangeOfSelectedEntity",
              ],
              do: "setTargetedEntity",
              to: "selected",
            },
          },
          states: {
            selecting: {
              onEnter: { get: "selectedEntity", do: "setEntityVision" },
              on: {
                HOVERED_ENTITY: {
                  get: "hoveredEntity",
                  unless: ["entityIsSelected", "entityIsDead"],
                  if: [
                    "hoveredEntityIsVisibleToSelectedEntity",
                    "hoveredEntityIsInRangeOfSelectedEntity",
                  ],
                  do: "setTargetedEntity",
                  to: "selected",
                },
              },
            },
            selected: {
              on: {
                HOVERED_TILE: {
                  do: "clearTargetedEntity",
                  to: "selecting",
                },
                ENTITY_KILLED: {
                  do: "clearTargetedEntity",
                  to: "selecting",
                },
                CLICKED_ENTITY: [
                  {
                    do: "shootEntity",
                  },
                  {
                    get: "entityFromEntity",
                    unless: "entityIsDead",
                    break: true,
                  },
                  {
                    get: "selectedEntity",
                    do: ["setEntityVision", "clearTargetedEntity"],
                    to: "selecting",
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  results: {
    // Tiles
    tileFromEntity(data, entity: Entity) {
      return data.map.get(positionToId(entity.position))
    },
    tileFromTile(data, tile: Tile) {
      return data.map.get(tile.id)
    },
    // Entities
    entityFromId(data, id: string) {
      return data.entities.get(id)
    },
    entityFromEntity(data, entity: Entity) {
      return data.entities.get(entity.id)
    },
    selectedEntity(data) {
      return data.entities.get(data.ui.entities.selected || "")
    },
    hoveredEntity(data) {
      return data.entities.get(data.ui.entities.hovered || "")
    },
    targetedEntity(data) {
      return data.entities.get(data.ui.entities.targeted || "")
    },
  },
  conditions: {
    // Tiles
    tileIsEmpty(data, _, tile: Tile) {
      return tile.entity === undefined
    },
    // Entities
    entityIsDead(data, _, entity: Entity) {
      return entity.health.dead === true
    },
    entityIsSelected(data, _, entity: Entity) {
      const { selected } = data.ui.entities
      return selected === entity.id
    },
    pathIsEmpty(data) {
      return data.ui.tiles.inPath.length === 0
    },
    // Targeting
    hoveredEntityIsVisibleToSelectedEntity(data) {
      const selected = data.entities.get(data.ui.entities.selected || "")
      const hovered = data.entities.get(data.ui.entities.hovered || "")

      if (!(selected && hovered)) return false

      return selected.vision.entities.has(hovered.id)
    },
    hoveredEntityIsInRangeOfSelectedEntity(data) {
      const selected = data.entities.get(data.ui.entities.selected || "")
      const hovered = data.entities.get(data.ui.entities.hovered || "")

      if (!(selected && hovered)) return false

      return (
        getDistanceBetweenPositions(selected.position, hovered.position) <
        selected.attack.ranged.range
      )
    },
  },
  actions: {
    // Tiles
    addWallToPosition(data, _, tile: Tile) {
      tile.terrain = "wall"
      pathGrid.addUnwalkableCoord(tile.position.x, tile.position.y)
    },
    addEntityToTile(data, entity: Entity, tile: Tile) {
      tile.entity = entity.id
    },
    removeEntityFromTile(data, entity: Entity, tile: Tile) {
      tile.entity = undefined
      pathGrid.removeUnwalkableCoord(tile.position.x, tile.position.y)
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
    setPathToHoveredTile(data, _, entity: Entity) {
      const hovered = data.ui.tiles.hovered || ""

      if (!hovered) return

      const from = entity.position
      const to = hovered.position

      if (to === undefined) {
        console.error("Missing hoveredPosition!")
        return
      }

      const positions = Pathfinding.findPathSync(pathGrid, from, to)
      const path: Tile[] = []

      if (positions !== null) {
        for (let i = 1; i < positions.length; i++) {
          const tile = getTile(data, positions[i])

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
        const from = data.map.get(positionToId(entity.position))

        if (to && from) {
          to.entity = entity.id
          from.entity = undefined

          const pos = getPosition(data, to.position)

          entity.position = pos

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
    turnEntityToHoveredTile(data, _: Tile, entity: Entity) {
      const hovered = data.ui.tiles.hovered || ""

      if (!hovered) return

      const direction = getOffsetDirection(entity.position, hovered.position)

      entity.vision.facing = direction
    },
    // Vision
    setEntityVision,
    // Combat
    shootEntity(data) {
      const selected = data.entities.get(data.ui.entities.selected || "")
      const targeted = data.entities.get(data.ui.entities.targeted || "")

      if (!(selected && targeted)) return false

      const { ranged } = selected.attack

      const didHit = Math.random() < ranged.accuracy

      if (didHit) {
        targeted.health.current -= ranged.damage

        if (targeted.health.current <= 0) {
          targeted.health.dead = true
          data.ui.entities.targeted = undefined
          pathGrid.removeUnwalkableCoord(
            targeted.position.x,
            targeted.position.y
          )
        }
      }
    },
    // UI
    setSelectedEntity(data, entity: Entity) {
      data.ui.entities.selected = entity.id
    },
    clearSelectedEntity(data) {
      data.ui.entities.selected = undefined
    },
    setHoveredEntity(data, entity: Entity) {
      data.ui.entities.hovered = entity.id
    },
    clearHoveredEntity(data) {
      data.ui.entities.hovered = undefined
    },
    setTargetedEntity(data, _, entity: Entity) {
      data.ui.entities.targeted = entity.id
    },
    clearTargetedEntity(data, _, entity: Entity) {
      data.ui.entities.targeted = undefined
    },
    setTilesInRangeOfEntity(data, _, entity: Entity) {
      const { position, attack } = entity

      const tilesInRange: Tile[] = []

      entity.vision.positions.forEach((vPos) => {
        const tile = data.map.get(vPos)
        if (tile) {
          const distance = getDistanceBetweenPositions(position, tile.position)

          if (distance < attack.ranged.range) {
            tilesInRange.push(tile)
          }
        }
      })

      data.ui.tiles.inRange = tilesInRange
    },
    clearTilesInView(data) {
      data.ui.tiles.inView = []
    },
    clearTilesInRange(data) {
      data.ui.tiles.inRange = []
    },
  },
})

export function getNewEntity(
  position: Partial<Position>,
  initialFacing: Direction
): Entity {
  const pos = getPosition(data, position)

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
      positions: new Set<string>([]),
      entities: new Set<string>([]),
      angles: [],
    },
  }
}

export default state
