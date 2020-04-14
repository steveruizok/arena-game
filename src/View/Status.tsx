import React from "react"
import game from "game"
import { useStateDesigner } from "state-designer"

export interface Props {}

const Status: React.FC<Props> = () => {
  const { data, whenIn } = useStateDesigner(game)

  const selectedEntity = data.selectedEntity
    ? data.entities.find((e) => e.data.id === data.selectedEntity)
    : undefined

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
