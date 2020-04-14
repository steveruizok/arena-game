import { createStateDesigner } from "state-designer"
import uniqueId from "lodash-es/uniqueId"
import pull from "lodash-es/pull"
import { Position, Shot } from "./types"

export type RawShot = {
  from: Position
  to: Position
  hit: boolean
}

export default createStateDesigner({
  data: {
    bullets: [] as Shot[],
  },
  on: {
    FIRED_SHOT: {
      do: "createBullet",
    },
    SHOT_LANDED: {
      do: "removeBullet",
    },
  },
  actions: {
    createBullet(data, shot: RawShot) {
      data.bullets = data.bullets.filter((b) => !b.done)
      data.bullets.push({ ...shot, done: false, id: uniqueId() })
    },
    removeBullet(data, id: string) {
      const bullet = data.bullets.find((b) => b.id === id)
      if (bullet !== undefined) {
        bullet.done = true
      }
    },
  },
})
