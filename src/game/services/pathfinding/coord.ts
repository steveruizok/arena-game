export interface ICoord {
  x: number
  y: number
  z: number
}

export class Coord {
  public static equals(a?: ICoord, b?: ICoord): boolean {
    return !!a && !!b && a.x === b.x && a.y === b.y && a.z === b.z
  }
}
