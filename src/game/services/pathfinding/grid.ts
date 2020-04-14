import { ICoord } from './coord';

export enum GridType {
  cardinal,
  hex,
  intercardinal
}

export default class Grid {
  public static toCoordMap<T>(
    coords: ICoord[],
    value: T,
    map: Map<number, Map<number, T>> = new Map<number, Map<number, T>>()
  ) {
    coords.forEach(({ x: x, y: y }) => {
      if (!map.has(y)) {
        map.set(y, new Map<number, T>());
      }
      map.get(y)!.set(x, value);
    });
    return map;
  }

  public walkableTiles: number[];
  public unwalkableCoords: Map<number, Map<number, boolean>>;
  public unstoppableCoords: Map<number, Map<number, boolean>>;
  public type: GridType;
  public costs: Map<number, number>;
  public extraCosts: Map<number, Map<number, number>>;

  get tiles() {
    return this.pTiles;
  }
  set tiles(tiles) {
    this.pTiles = tiles;

    for (const row of tiles) {
      for (const x in row) {
        if (!this.costs.get(row[x])) {
          this.costs.set(row[x], 1);
        }
      }
    }
  }

  get isCardinal() {
    return this.type === GridType.cardinal;
  }
  get isHex() {
    return this.type === GridType.hex;
  }
  get isIntercardinal() {
    return this.type === GridType.intercardinal;
  }

  private pTiles: number[][];

  constructor({
    tiles = [],
    walkableTiles = [],
    unwalkableCoords = new Map<number, Map<number, boolean>>(),
    unstoppableCoords = new Map<number, Map<number, boolean>>(),
    type = GridType.cardinal
  }: {
    tiles: number[][],
    walkableTiles?: number[],
    unwalkableCoords?: Map<number, Map<number, boolean>>,
    unstoppableCoords?: Map<number, Map<number, boolean>>,
    type?: GridType
  }) {
    this.costs = new Map<number, number>();
    this.extraCosts = new Map<number, Map<number, number>>();
    this.unwalkableCoords = unwalkableCoords;
    this.unstoppableCoords = unstoppableCoords;
    this.type = type;

    this.pTiles = [];
    this.tiles = tiles;
    this.walkableTiles = walkableTiles;
  }

  public inGrid(x: number, y: number) {
    return x >= 0 &&
      y >= 0 &&
      y < this.tiles.length &&
      x < this.tiles[y].length;
  }

  public isCoordStoppable(x: number, y: number) {
    const unstoppable = this.unstoppableCoords.has(y) &&
      this.unstoppableCoords.get(y)!.has(x);
    return !unstoppable && this.isCoordWalkable(x, y);
  }

  public isCoordWalkable(x: number, y: number) {
    const unwalkable = this.unwalkableCoords.has(y) &&
      this.unwalkableCoords.get(y)!.has(x);
    return !unwalkable && this.walkableTiles.indexOf(this.tiles[y][x]) !== -1;
  }

  public getCoordCost(x: number, y: number): number {
    const extraCost = this.extraCosts.has(y) && this.extraCosts.get(y)!.get(x);
    return extraCost || this.costs.get(this.tiles[y][x])!;
  }

  public setTileCost(tile: number, cost: number) {
    this.costs.set(tile, cost);
  }

  public addExtraCost(x: number, y: number, cost: number) {
    this.addCoord(this.extraCosts, x, y, cost);
  }
  public removeExtraCost(x: number, y: number) {
    this.removeCoord(this.extraCosts, x, y);
  }
  public clearExtraCosts() {
    this.clearCoords(this.extraCosts);
  }

  public addUnwalkableCoord(x: number, y: number) {
    this.addCoord(this.unwalkableCoords, x, y, true);
  }
  public removeUnwalkableCoord(x: number, y: number) {
    this.removeCoord(this.unwalkableCoords, x, y);
  }
  public clearUnwalkableCoords() {
    this.clearCoords(this.unwalkableCoords);
  }

  public addUnstoppableCoord(x: number, y: number) {
    this.addCoord(this.unstoppableCoords, x, y, true);
  }
  public removeUnstoppableCoord(x: number, y: number) {
    this.removeCoord(this.unstoppableCoords, x, y);
  }
  public clearUnstoppableCoords() {
    this.clearCoords(this.unstoppableCoords);
  }

  private addCoord<T>(map: Map<number, Map<number, T>>, x: number, y: number, value: T) {
    if (!map.has(y)) {
      map.set(y, new Map<number, T>());
    }
    map.get(y)!.set(x, value);
  }

  private removeCoord<T>(map: Map<number, Map<number, T>>, x: number, y: number) {
    if (map.has(y)) {
      map.get(y)!.delete(x);
    }
  }

  private clearCoords<T>(map: Map<number, T>) {
    map.clear();
  }
}
