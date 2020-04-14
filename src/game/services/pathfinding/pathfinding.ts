import { Coord, ICoord } from "./coord"
import Grid from "./grid"
import { Node } from "./node"
import { Search } from "./search"

export default class Pathfinding {
  public static async findPath(
    grid: Grid,
    start: ICoord,
    end: ICoord,
    opts: {
      costThreshold?: number
      endOnUnstoppable?: boolean
    } = {}
  ) {
    if (Coord.equals(start, end)) {
      return [start]
    } else if (!grid.isCoordStoppable(end.x, end.y) && !opts.endOnUnstoppable) {
      return null
    }

    const search = new Search({
      start,
      end,
      opts,
    })
    const startNode = Pathfinding.coordinateToNode(
      search,
      null,
      start.x,
      start.y,
      start.z,
      0
    )
    search.push(startNode)

    await Pathfinding.calculate(search, grid)

    const node = search.nodeQueue.pop()
    const path = node ? node.formatPath() : null

    return path
  }

  public static findPathSync(
    grid: Grid,
    start: ICoord,
    end: ICoord,
    opts: {
      costThreshold?: number
      endOnUnstoppable?: boolean
    } = {}
  ) {
    if (Coord.equals(start, end)) {
      return [start]
    } else if (!grid.isCoordStoppable(end.x, end.y) && !opts.endOnUnstoppable) {
      return null
    }

    const search = new Search({
      start,
      end,
      opts,
    })
    const startNode = Pathfinding.coordinateToNode(
      search,
      null,
      start.x,
      start.y,
      start.z,
      0
    )
    search.push(startNode)

    Pathfinding.calculateSync(search, grid)

    const node = search.nodeQueue.pop()
    const path = node ? node.formatPath() : null

    return path
  }

  public static async findWalkable(
    grid: Grid,
    coords: ICoord | ICoord[],
    opts: {
      costThreshold?: number
    } = {}
  ) {
    coords = coords instanceof Array ? coords : [coords]
    const { x: startX, y: startY, z: startZ } = coords[0]
    const search = new Search({
      start: { x: startX, y: startY, z: startZ },
      opts,
    })
    coords.forEach(({ x, y }) => {
      const node = Pathfinding.coordinateToNode(search, null, x, y, 0, 0)
      search.push(node)
    })

    await Pathfinding.calculate(search, grid)

    return search.traversedNodes
      .filter((node) => grid.isCoordWalkable(node.x, node.y))
      .map((node) => ({ x: node.x, y: node.y }))
  }

  public static calculate(search: Search, grid: Grid) {
    return new Promise((resolve) => {
      while (true) {
        // fully traversed
        if (search.nodeQueue.size() === 0) {
          resolve(search)
          return
        }

        let node = search.nodeQueue.peek()

        // path found
        if (Coord.equals(search.end, node)) {
          resolve(search)
          return
        }

        node = search.nodeQueue.pop()

        node.visited = true
        // cardinal
        if (grid.inGrid(node.x, node.y - 1)) {
          Pathfinding.checkAdjacentNode(search, grid, node, 0, -1)
        }
        // hex & intercardinal
        if (!grid.isCardinal && grid.inGrid(node.x + 1, node.y - 1)) {
          Pathfinding.checkAdjacentNode(search, grid, node, 1, -1)
        }
        // cardinal
        if (grid.inGrid(node.x + 1, node.y)) {
          Pathfinding.checkAdjacentNode(search, grid, node, 1, 0)
        }
        // intercardinal
        if (grid.isIntercardinal && grid.inGrid(node.x + 1, node.y + 1)) {
          Pathfinding.checkAdjacentNode(search, grid, node, 1, 1)
        }
        // cardinal
        if (grid.inGrid(node.x, node.y + 1)) {
          Pathfinding.checkAdjacentNode(search, grid, node, 0, 1)
        }
        // hex & intercardinal
        if (!grid.isCardinal && grid.inGrid(node.x - 1, node.y + 1)) {
          Pathfinding.checkAdjacentNode(search, grid, node, -1, 1)
        }
        // cardinal
        if (grid.inGrid(node.x - 1, node.y)) {
          Pathfinding.checkAdjacentNode(search, grid, node, -1, 0)
        }
        // intercardinal
        if (grid.isIntercardinal && grid.inGrid(node.x - 1, node.y - 1)) {
          Pathfinding.checkAdjacentNode(search, grid, node, -1, -1)
        }
      }
    })
  }

  public static calculateSync(search: Search, grid: Grid) {
    while (true) {
      // fully traversed
      if (search.nodeQueue.size() === 0) {
        return search
      }

      let node = search.nodeQueue.peek()

      // path found
      if (Coord.equals(search.end, node)) {
        return search
      }

      node = search.nodeQueue.pop()

      node.visited = true
      // cardinal
      if (grid.inGrid(node.x, node.y - 1)) {
        Pathfinding.checkAdjacentNode(search, grid, node, 0, -1)
      }
      // hex & intercardinal
      if (!grid.isCardinal && grid.inGrid(node.x + 1, node.y - 1)) {
        Pathfinding.checkAdjacentNode(search, grid, node, 1, -1)
      }
      // cardinal
      if (grid.inGrid(node.x + 1, node.y)) {
        Pathfinding.checkAdjacentNode(search, grid, node, 1, 0)
      }
      // intercardinal
      if (grid.isIntercardinal && grid.inGrid(node.x + 1, node.y + 1)) {
        Pathfinding.checkAdjacentNode(search, grid, node, 1, 1)
      }
      // cardinal
      if (grid.inGrid(node.x, node.y + 1)) {
        Pathfinding.checkAdjacentNode(search, grid, node, 0, 1)
      }
      // hex & intercardinal
      if (!grid.isCardinal && grid.inGrid(node.x - 1, node.y + 1)) {
        Pathfinding.checkAdjacentNode(search, grid, node, -1, 1)
      }
      // cardinal
      if (grid.inGrid(node.x - 1, node.y)) {
        Pathfinding.checkAdjacentNode(search, grid, node, -1, 0)
      }
      // intercardinal
      if (grid.isIntercardinal && grid.inGrid(node.x - 1, node.y - 1)) {
        Pathfinding.checkAdjacentNode(search, grid, node, -1, -1)
      }
    }
  }

  public static checkAdjacentNode(
    search: Search,
    grid: Grid,
    sourceNode: Node,
    x: number,
    y: number
  ): void {
    const adjacentX = sourceNode.x + x
    const adjacentY = sourceNode.y + y
    const adjacentCost = grid.getCoordCost(adjacentX, adjacentY)

    if (
      grid.isCoordWalkable(adjacentX, adjacentY) &&
      Pathfinding.canAfford(sourceNode, adjacentCost, search.costThreshold)
    ) {
      const adjacentNode = Pathfinding.coordinateToNode(
        search,
        sourceNode,
        adjacentX,
        adjacentY,
        0,
        adjacentCost
      )

      if (!adjacentNode.visited) {
        search.push(adjacentNode)
      } else if (sourceNode.cost + adjacentCost < adjacentNode.cost) {
        adjacentNode.cost = sourceNode.cost + adjacentCost
        adjacentNode.parent = sourceNode
        search.nodeQueue.updateItem(adjacentNode)
      }
    }
  }

  public static canAfford(
    sourceNode: Node,
    cost: number,
    costThreshold?: number
  ): boolean {
    if (costThreshold != null) {
      return sourceNode.cost + cost <= costThreshold
    }
    return true
  }

  public static coordinateToNode(
    search: Search,
    parent: Node | null,
    x: number,
    y: number,
    z: number,
    cost: number
  ): Node {
    if (search.cache.has(y)) {
      if (search.cache.get(y)!.has(x)) {
        return search.cache.get(y)!.get(x)!
      }
    } else {
      search.cache.set(y, new Map<number, Node>())
    }

    const node = new Node(
      parent,
      x,
      y,
      z,
      parent ? parent.cost + cost : cost,
      search.isPathing
        ? Pathfinding.getDistance(x, y, search.end!.x, search.end!.y)
        : 1
    )

    search.cacheNode(node)
    return node
  }

  public static getDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const dx = Math.abs(x1 - x2)
    const dy = Math.abs(y1 - y2)
    return dx + dy
  }
}
