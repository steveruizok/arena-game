import { StateDesigner } from "state-designer"
import createMob from "./services/ai/mob"

export type Point = { x: 0; y: 0; z: 0 }

export type Direction = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"

export interface Position {
  id: string
  x: number
  y: number
  z: number
}

export type AdjacentCells = Record<Direction, Position | undefined>

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
    positions: string[]
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

export type RawShot = {
  from: Position
  to: Position
  hit: boolean
}

// Map

export type Coord = { x: number; y: number; z: number }

export type Tile = {
  id: string
  position: Position
  entity?: string
  terrain: "none" | "wall"
}
