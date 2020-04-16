import { createStateDesigner } from "state-designer"
import uniqueId from "lodash-es/uniqueId"
import random from "lodash-es/random"
import game from "./index"
import {
  getCell,
  offsetPosition,
  getEntityAtPosition,
  getOffsetAngle,
  directionAngles,
  directions,
  wrap,
} from "./utils"
import {
  Direction,
  AdjacentCells,
  Blocking,
  Position,
  M,
  Tile,
  Entity,
} from "./types"

function createMob(position: Position, initialFacing: Direction) {
  const { x, y, z } = position

  return createStateDesigner({
    data: {
      id: uniqueId("entity_"),
      position: { x, y, z } as Position,
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
    },
    on: {
      UPDATED_VISION: {
        do: "setVision",
      },
      RECEIVED_DAMAGE: [
        "reduceHealthByDamage",
        {
          if: "killed",
          do: "die",
          to: "dead",
        },
      ],
      TURNED_TO: {
        do: "setFacing",
      },
      MOVED_TO: {
        do: "setPosition",
      },
    },
    initial: "moving",
    states: {
      moving: {
        on: {
          TURN: [
            {
              get: "blocking",
              if: "cannotMoveForward",
              to: "blocked",
            },
            { do: ["moveForward", "finishTurn"] },
          ],
        },
      },
      blocked: {
        onEnter: [
          {
            get: "blocking",
            if: "blockedByWall",
            to: "turningAround",
          },
          {
            get: "blocking",
            if: "blockedByEntity",
            to: "fighting",
          },
        ],
      },
      turning: {
        onEnter: {
          do: ["turnLeft", "finishTurn"],
          to: "moving",
        },
      },
      turningAround: {
        onEnter: {
          do: ["turnLeft", "turnLeft", "turnLeft", "turnLeft", "finishTurn"],
          to: "moving",
        },
      },
      fighting: {
        onEnter: [
          {
            get: "blocking",
            if: "blockedByEntity",
            do: ["attackBlockingEntity", "finishTurn"],
          },
        ],
        on: {
          TURN: [
            {
              get: "blocking",
              unless: "blockedByEntity",
              do: "finishTurn",
              to: "moving",
            },
            {
              get: "blocking",
              if: "blockedByEntity",
              do: ["attackBlockingEntity", "finishTurn"],
            },
          ],
        },
      },
      dead: {},
    },
    results: {
      visibleCells(data) {},
      adjacentCells(data) {
        const { x, y, z } = data.position

        return {
          n: getCell({ x, y: y - 1, z }),
          ne: getCell({ x: x + 1, y: y - 1, z }),
          e: getCell({ x: x + 1, y, z }),
          se: getCell({ x: x + 1, y: y + 1, z }),
          s: getCell({ x, y: y + 1, z }),
          sw: getCell({ x: x - 1, y: y + 1, z }),
          w: getCell({ x: x - 1, y, z }),
          nw: getCell({ x: x - 1, y: y - 1, z }),
        }
      },
      blocking(data): Blocking {
        const { position, vision } = data
        const next = offsetPosition(position, vision.facing)
        const cell = getCell(next)

        if (!cell)
          return {
            type: "void",
            content: undefined,
          }

        const blockingEntity = getEntityAtPosition(next)

        if (blockingEntity && !blockingEntity.isIn("dead")) {
          return {
            type: "entity",
            content: blockingEntity,
          }
        }

        return {
          type: "none",
          content: undefined,
        }
      },
    },
    conditions: {
      killed(data) {
        return data.health.current <= 0
      },
      cannotMoveForward(_, __, blocking: Blocking) {
        return blocking.type !== "none"
      },
      blockedByWall(_, __, blocking: Blocking) {
        return blocking.type === "void"
      },
      blockedByEntity(_, __, blocking: Blocking) {
        return blocking.type === "entity"
      },
    },
    actions: {
      // Movement
      moveForward(data) {
        const { position, vision } = data
        const next = offsetPosition(position, vision.facing)
        data.position = next
      },
      setPosition(data, position: Position) {
        data.position = position
      },

      // Turning
      turnLeft(data) {
        const index = directions.indexOf(data.vision.facing)
        const nextIndex = index === 0 ? directions.length - 1 : index - 1
        data.vision.facing = directions[nextIndex]
      },
      setFacing(data, direction: Direction) {
        data.vision.facing = direction
      },

      // Combat
      die(data) {
        data.health.dead = true
        game.send("ENTITY_KILLED", data.id)
      },
      reduceHealthByDamage(data, damage) {
        data.health.current -= damage
      },
      attackBlockingEntity(data, _, blocking: Blocking) {
        const { damage } = data.attack.melee
        if (blocking.type === "entity") {
          const entity = blocking.content as any
          entity.send("RECEIVED_DAMAGE", damage)
        }
      },

      // Vision
      setVision(data, payload: { cells: Position[]; entities: string[] }) {
        const { cells, entities } = payload

        data.vision.positions = cells
        // data.vision.entities = entities
      },

      // Game
      finishTurn(data) {
        game.send("FINISHED_TURN", data.id)
      },
    },
  })
}

export default createMob
