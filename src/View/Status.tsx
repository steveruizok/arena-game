import React from "react"
import game from "game/game"
import { useStateDesigner } from "state-designer"

export interface Props {}

const Status: React.FC<Props> = () => {
  const { data, isIn, whenIn } = useStateDesigner(game)

  const { selected } = data.ui.entities

  return (
    <div style={{ marginTop: 32 }}>
      <div>
        {whenIn({
          selecting: "Selecting Entity",
          selected: "Entity Selected",
        })}
      </div>
      <div>
        {whenIn({
          idle: "Idle",
          moving: "Moving",
          turning: "Turning",
          aiming: "Aiming",
        })}
      </div>
      <div>
        {whenIn({
          "aiming.selecting": "Selecting Target",
          "aiming.selected": "Has Target",
        })}
      </div>
    </div>
  )
}

export default Status
