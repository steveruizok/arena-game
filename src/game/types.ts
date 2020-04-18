import { StateDesigner } from "state-designer"
import createMob from "./services/ai/mob"

export type Direction = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"

export type Point = {
  x: number
  y: number
  z: number
}

export interface Position extends Point {
  id: string
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
    positions: Set<string>
    entities: Set<string>
    facing: Direction
    angles: {
      blocking?: TileInView
      items: Map<string, TileInView>
    }[]
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

export type TileInView = {
  angle: number
  distance: number
  tile: Tile
  blocking: boolean
  type: "wall" | "floor" | "entity" | "corpse"
}

export type BlockerInView = {
  angle: number
  distance: number
  type: "wall" | "entity" | "corpse"
}

export type HitTestEvent = {
  point: Point
  angle: number
  distance: number
}

export type HitTest = (event: HitTestEvent) => boolean
