import { Direction, Cell, Position, M, Entity } from "./types"
import game from "./index"

export const directions: Direction[] = [
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
  "nw",
]

const dturns = [1, 2, 3, 4, -3, -2, -1, 0]

const turnDistances = directions.reduce((acc, cur) => {
  acc[cur] = [...cycleArray(dturns, "right")]
  return acc
}, {} as Record<Direction, number[]>)

export const directionAngles = Object.fromEntries(
  directions.map((d, index) => [d, index * 45])
)

export function getCell(position: Position): Cell | undefined {
  const { x, y, z } = position
  return game.data.grid[y] && game.data.grid[y][x]
}

export function offsetPosition(position: Position, direction: Direction) {
  let { x, y, z } = position

  switch (direction) {
    case "n":
      y--
      break
    case "s":
      y++
      break
    case "e":
      x++
      break
    case "w":
      x--
      break
    case "ne":
      y--
      x++
      break
    case "nw":
      y--
      x--
      break
    case "sw":
      y++
      x--
      break
    case "se":
      y++
      x++
      break
  }

  return { x, y, z }
}

export const directionOffsets = {
  n: [-1, 0],
  ne: [-1, 1],
  e: [0, 1],
  se: [1, 1],
  s: [1, 0],
  sw: [1, -1],
  w: [0, -1],
  nw: [-1, -1],
}

export function getEntityAtPosition(position: Position): M<Entity> | undefined {
  const { x, y } = position
  const entities = game.data.entities
  return entities.find(
    (e) => e.data.position.y === y && e.data.position.x === x
  )
}

export function getOffsetAngle(from: Position, to: Position) {
  return wrap(
    (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90,
    0,
    360
  )
}

export function getTurnDistance(from: Direction, to: Direction) {
  const index = directions.indexOf(to)
  return turnDistances[from][index]
}

export function getOffsetDirection(from: Position, to: Position) {
  const angle = getOffsetAngle(from, to)
  const index = wrap(Math.round(angle / 45), 0, 8)
  return directions[index]
}

export function getOffsetFacing(from: Direction, offset: number) {
  const index = directions.indexOf(from)
  const next = index + offset
  return directions[wrap(next, 0, directions.length)]
}

export function getDistanceBetweenPositions(a: Position, b: Position) {
  const { x: x1, y: y1 } = a
  const { x: x2, y: y2 } = b

  return Math.hypot(x2 - x1, y2 - y1)
}

// GENERIC

export function wrap(v: number, min: number, max: number) {
  const rangeSize = max - min
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

export function cycleArray<T>(array: T[], direction: "left" | "right"): T[] {
  if (array.length === 0) {
    return array
  }

  if (direction === "left") {
    const t = array.shift()
    array.push(t as T)
  }

  if (direction === "right") {
    const t = array.pop()
    array.unshift(t as T)
  }

  return array
}
