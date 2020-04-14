import { StateDesigner } from "state-designer"
import createMob from "./mob"

export type Point = { x: 0; y: 0; z: 0 }

export type Direction = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"

export interface Position {
  x: number
  y: number
  z: number
}

export interface Cell {
  position: Position
}

export type AdjacentCells = Record<Direction, Cell | undefined>

export type Entity = {
  id: string
  position: Position
  health: {
    current: number
    max: number
    dead: boolean
  }
  attack: {
    melee: {
      damage: number
      accuracy: number
    }
    ranged: {
      damage: number
      range: number
      accuracy: number
    }
  }
  vision: {
    cells: Position[]
    entities: string[]
    facing: Direction
  }
}

export type Blocking =
  | {
      type: "none"
      content: undefined
    }
  | {
      type: "void"
      content: undefined
    }
  | {
      type: "entity"
      content: M<Entity>
    }

export type M<D> = StateDesigner<D, any, any, any, any>

export type Shot = {
  id: string
  from: Position
  to: Position
  hit: boolean
  done: boolean
}
