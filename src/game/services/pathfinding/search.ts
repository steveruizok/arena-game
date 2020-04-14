import { ICoord } from "./coord"
import { Node } from "./node"

const Heap = require("heap")

export class Search {
  public start: ICoord
  public end?: ICoord
  public costThreshold?: number
  public endOnUnstoppable?: boolean

  public cache: Map<number, Map<number, Node>>
  public unwalked: Map<number, Map<number, Node>>
  public nodeQueue: {
    pop(): Node
    push(_: Node): void
    size(): number
    peek(): Node
    updateItem(_: Node): void
  }

  get isPathing(): boolean {
    return !!this.end
  }

  get traversedNodes(): ICoord[] {
    const nodes: ICoord[] = []
    this.cache.forEach((map, y) => {
      map.forEach((node, x) => {
        nodes.push({ x, y, z: 0 })
      })
    })

    return nodes
  }

  constructor({
    start,
    end,
    opts = {},
  }: {
    start: ICoord
    end?: ICoord
    opts: {
      costThreshold?: number
      endOnUnstoppable?: boolean
    }
  }) {
    this.start = start
    this.end = end
    this.costThreshold = opts.costThreshold

    this.cache = new Map<number, Map<number, Node>>()
    this.unwalked = new Map<number, Map<number, Node>>()
    this.nodeQueue = new Heap((a: Node, b: Node) => {
      return a.guessTotalCost - b.guessTotalCost
    })
  }

  public push(node: Node): void {
    this.nodeQueue.push(node)
  }

  public cacheNode(node: Node): void {
    this.cache.get(node.y)!.set(node.x, node)
  }
}
