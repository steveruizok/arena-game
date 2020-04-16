import { createStateDesigner } from "state-designer"
import range from "lodash-es/range"
import pull from "lodash-es/pull"
import last from "lodash-es/last"
import { castDraft } from "immer"

import shots from "./shots"
import createMob from "./mob"
import Pathfinding, { Grid, GridType } from "./services/pathfinding"
import { Entity, Cell, M, Position, Direction } from "./types"
import {
  getOffsetDirection,
  getOffsetAngle,
  getTurnDistance,
  getOffsetFacing,
  directionAngles,
  getDistanceBetweenPositions,
  wrap,
} from "./utils"

const cells: Cell[][] = range(10).map((y) =>
  range(10).map((x) => ({ position: { y, x, z: 0 } }))
)

const grid = new Grid({
  tiles: cells.map((row) => row.map(() => 1)),
  walkableTiles: [1],
  type: GridType.intercardinal,
})

export default createStateDesigner({
  data: {
    turn: 0,
    activeEntity: 0,
    entities: [] as M<Entity>[],
    grid: cells as Cell[][],
    path: [] as Position[],
    inRange: [] as Position[],
    hoveredPosition: undefined as Position | undefined,
    hoveredEntity: undefined as string | undefined,
    selectedEntity: undefined as string | undefined,
    targetedEntity: undefined as string | undefined,
  },
  on: {
    ADVANCED_TURN: [
      {
        do: ["runEntityTurn", (data) => data.activeEntity++],
      },
      {
        do: "updateVision",
        wait: 0.025,
      },
      {
        if: "movingEntitiesRemain",
        send: "ADVANCED_TURN",
        wait: 0.025,
      },
      {
        unless: "movingEntitiesRemain",
        do: "finishTurn",
        wait: 0.025,
      },
    ],
    ENTITY_SPAWNED: { get: "newMob", do: ["addEntity", "updateVision"] },
    HOVERED_CELL: "setHoveredPosition",
    HOVERED_ENTITY: "setHoveredEntity",
    UNHOVERED_ENTITY: "clearHoveredEntity",
  },
  initial: "selecting",
  states: {
    selecting: {
      onEnter: "clearSelectedEntity",
      on: {
        COMMAND_CLICKED_CELL: {
          do: "spawnMob",
        },
        CLICKED_ENTITY: {
          get: "entity",
          unless: "entityIsDead",
          do: "setSelectedEntity",
          to: "selected",
        },
      },
    },
    selected: {
      onEnter: "updateVision",
      initial: "idle",
      states: {
        idle: {
          on: {
            CANCELLED: {
              do: "clearSelectedEntity",
              to: "selecting",
            },
            CLICKED_ENTITY: [
              {
                get: "entity",
                if: "isSelectedEntity",
                do: "clearSelectedEntity",
                to: "selecting",
              },
              {
                get: "entity",
                unless: "entityIsDead",
                do: "setSelectedEntity",
                to: "selected",
              },
            ],
          },
        },
        moving: {
          initial: "selecting",
          onEnter: {
            get: "selectedEntity",
            do: "setPath",
          },
          onExit: "clearPath",
          states: {
            selecting: {
              on: {
                HOVERED_CELL: {
                  get: "selectedEntity",
                  do: "setPath",
                },
                HOVERED_ENTITY: [
                  {
                    if: "isSelectedEntity",
                    do: "clearPath",
                  },
                  {
                    get: "selectedEntity",
                    unless: "isSelectedEntity",
                    do: "setPath",
                  },
                ],
                CLICKED_ENTITY: [
                  { if: "isSelectedEntity", to: "idle" },
                  {
                    to: "animating",
                  },
                ],
                CLICKED_CELL: {
                  to: "animating",
                },
              },
            },
            animating: {
              onEnter: {
                get: "selectedEntity",
                do: ["advanceAlongPath", "updateVision"],
              },
              on: {
                CANCELLED: { to: "selecting" },
                COMPLETED_STEP: [
                  { if: "pathIsEmpty", to: "selecting" },
                  {
                    get: "selectedEntity",
                    do: ["advanceAlongPath", "updateVision"],
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
            HOVERED_CELL: {
              get: "selectedEntity",
              do: ["setTurnDirection", "updateVision"],
            },
            CLICKED_BOARD: { to: "idle" },
            CANCELLED: { to: "idle" },
            TOGGLED_TURN: { to: "idle" },
          },
        },
        aiming: {
          initial: "selecting",
          onExit: "clearInRange",
          onEnter: [
            { get: "selectedEntity", do: "setInRange" },
            {
              get: "hoveredEntity",
              if: ["entityExists", "hoveredEntityIsVisibleToSelectedEntity"],
              do: "setTargetedEntity",
              to: "selected",
            },
          ],
          states: {
            selecting: {
              onEnter: () => {},
              on: {
                HOVERED_ENTITY: {
                  get: "hoveredEntity",
                  unless: ["isSelectedEntity", "entityIsDead"],
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
                HOVERED_CELL: {
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
                    get: "entity",
                    if: "entityIsDead",
                    do: "clearTargetedEntity",
                    to: "selecting",
                  },
                ],
              },
            },
          },
          on: {
            TOGGLED_AIM: { to: "idle" },
            CANCELLED: { to: "idle" },
          },
        },
      },
      on: {
        TOGGLED_TURN: { to: "turning" },
        TOGGLED_MOVE: { to: "moving" },
        TOGGLED_AIM: { to: "aiming" },
      },
    },
  },
  results: {
    newMob(data, options: { position: Position; facing: Direction }) {
      const { position, facing } = options
      const entity = createMob(position, facing)
      return entity
    },
    entity(data, id) {
      return data.entities.find((e) => e.data.id === id)
    },
    entityInPosition(data, position: Position) {
      const { x, y } = position
      return data.entities.find(
        (e) => e.data.position.x === x && e.data.position.y === y
      )
    },
    hoveredEntity(data) {
      return data.entities.find((m) => m.data.id === data.hoveredEntity)
    },
    selectedEntity(data) {
      return data.entities.find((m) => m.data.id === data.selectedEntity)
    },
  },
  conditions: {
    movingEntitiesRemain(data) {
      return data.activeEntity <= data.entities.length - 1
    },
    pathIsEmpty(data) {
      return data.path.length === 0
    },
    entityIsDead(data, id, entity: M<Entity>) {
      return entity.data.health.dead
    },
    isSelectedEntity(data, id: string) {
      return id === data.selectedEntity
    },
    positionHasEntity(data, _, entityInPosition?: M<Entity>) {
      return entityInPosition !== undefined
    },
    entityExists(data, _, entity: M<Entity>) {
      return entity !== undefined
    },
    hoveredEntityIsInRangeOfSelectedEntity(data) {
      const selected = data.entities.find(
        (m) => m.data.id === data.selectedEntity
      )

      const hovered = data.entities.find(
        (m) => m.data.id === data.hoveredEntity
      )

      if (!hovered || !selected) {
        console.error("No hovered/selected!")
        return false
      }

      return (
        getDistanceBetweenPositions(
          selected.data.position,
          hovered.data.position
        ) < selected.data.attack.ranged.range
      )
    },
    hoveredEntityIsVisibleToSelectedEntity(data) {
      const selected = data.entities.find(
        (m) => m.data.id === data.selectedEntity
      )

      const hovered = data.hoveredEntity

      if (!hovered || !selected) {
        console.error("No hovered/selected!")
        return false
      }

      return false
      // return selected.data.vision.entities.includes(hovered)
    },
  },
  actions: {
    // MISC
    setHoveredPosition(data, position: Position) {
      data.hoveredPosition = position
    },
    setHoveredEntity(data, id: string) {
      data.hoveredEntity = id

      const hovered = data.entities.find((m) => m.data.id === id)

      data.hoveredPosition = hovered?.data.position
    },
    clearHoveredEntity(data) {
      data.hoveredEntity = undefined
    },

    // PATHFINDING
    setPath(data, _, selectedEntity: M<Entity>) {
      grid.clearUnwalkableCoords()

      for (let entity of data.entities) {
        console.log(entity.data.health.dead)
        if (!entity.data.health.dead) {
          grid.addUnwalkableCoord(
            entity.data.position.x,
            entity.data.position.y
          )
        }
      }

      const from = selectedEntity.data.position
      const to = data.hoveredPosition

      if (to === undefined) {
        console.error("Missing hoveredPosition!")
        return
      }

      const path = Pathfinding.findPathSync(grid, from, to)

      data.path = path ? path.slice(1) : []
    },
    clearPath(data) {
      data.path = []
    },

    // ENTITIES
    spawnMob(data, position: Position) {
      const entity = createMob(position, "n")
      data.entities.push(entity)
    },
    addEntity(data, _, entity: M<Entity>) {
      data.entities.push(entity)
    },
    removeEntity(data, id: string) {
      const index = data.entities.findIndex((e) => e.data.id === id)
      data.entities.splice(index, 1)
    },
    updateVision(data) {
      for (let entity of data.entities) {
        const { position, vision, id } = entity.data

        const cells: Position[] = []
        const entities: string[] = []

        const facingAngle = directionAngles[vision.facing]

        for (let row of data.grid) {
          for (let cell of row) {
            if (
              cell.position.x === position.x &&
              cell.position.y === position.y
            ) {
              continue
            }
            const offsetAngle = getOffsetAngle(position, cell.position)
            const theta = wrap(facingAngle - offsetAngle - 180, 0, 360) - 180

            if (Math.abs(theta) < 64) {
              cells.push({ ...cell.position })
            }
          }
        }

        for (let entity of data.entities) {
          if (entity.data.id === id) {
            continue
          }
          const offsetAngle = getOffsetAngle(position, entity.data.position)
          const theta = wrap(facingAngle - offsetAngle - 180, 0, 360) - 180

          if (Math.abs(theta) < 64) {
            entities.push(entity.data.id)
          }
        }

        entity.send("UPDATED_VISION", { cells, entities })
      }
    },

    // SELECTED ENTITY
    setSelectedEntity(data, id: string) {
      data.selectedEntity = id
      const selected = data.entities.find((m) => m.data.id === id)
    },
    clearSelectedEntity(data) {
      data.selectedEntity = undefined
    },

    // MOVEMENT
    advanceAlongPath(data, _, selectedEntity: M<Entity>) {
      let next = data.path[0]

      if (next === undefined) {
        console.error("Path is empty! Can't advance.")
        return
      }

      const offsetDirection = getOffsetDirection(
        selectedEntity.data.position,
        next
      )
      const turnDistance = getTurnDistance(
        selectedEntity.data.vision.facing,
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
            selectedEntity.data.vision.facing,
            turnDistance
          )
          selectedEntity.send("TURNED_TO", nextDirection)
        }
        selectedEntity.send("MOVED_TO", { ...data.path.shift() })
      } else {
        const nextDirection = getOffsetFacing(
          selectedEntity.data.vision.facing,
          turnDistance > 1 ? 1 : -1
        )
        selectedEntity.send("TURNED_TO", nextDirection)
      }
    },
    moveEntity(data, position: Position, selectedEntity: M<Entity>) {
      selectedEntity.send("MOVED_TO", { ...position })
    },

    // TURNING
    setTurnDirection(data, position: Position, selectedEntity: M<Entity>) {
      const direction = getOffsetDirection(
        selectedEntity.data.position,
        position
      )

      selectedEntity.send("TURNED_TO", direction)
    },

    // AIMING
    setTargetedEntity(data, _, entity: M<Entity>) {
      data.targetedEntity = entity.data.id
    },
    clearTargetedEntity(data) {
      data.targetedEntity = undefined
    },
    setInRange(data, _, entity: M<Entity>) {
      const { position, attack } = entity.data

      const inRange: Position[] = []

      for (let pos of entity.data.vision.positions) {
        if (pos.x === position.x && pos.y === position.y) {
          continue
        }
        const distance = getDistanceBetweenPositions(position, pos)

        if (distance < attack.ranged.range) {
          inRange.push(pos)
        }
      }

      data.inRange = inRange
    },
    clearInRange(data) {
      data.inRange = []
    },
    shootEntity(data) {
      const selectedEntity = data.entities.find(
        (m) => m.data.id === data.selectedEntity
      )
      const targetedEntity = data.entities.find(
        (m) => m.data.id === data.targetedEntity
      )

      if (!selectedEntity || !targetedEntity) {
        console.warn("Missing some entities here")
        return
      }

      const { ranged } = selectedEntity.data.attack

      const didHit = Math.random() < ranged.accuracy

      const from = selectedEntity.data.position
      const to = targetedEntity.data.position

      shots.send("FIRED_SHOT", { from, to })

      if (didHit) {
        setTimeout(() => {
          selectedEntity.send("SHOT_RANGED", 1)
          targetedEntity.send("RECEIVED_DAMAGE", ranged.damage)
        }, 500)
      }
    },

    // GAME TURN
    finishTurn(data) {
      data.activeEntity = 0
      data.turn++
    },
    runEntityTurn(data) {
      data.entities[data.activeEntity].send("TURN")
    },
  },
})
