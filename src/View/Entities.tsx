import React from "react"
import game from "game"
import Entity from "./Entity"
import { useStateDesigner } from "state-designer"

export interface Props {}

const Entities: React.FC<Props> = ({ children }) => {
  const { data } = useStateDesigner(game)

  return (
    <div style={{ position: "absolute", top: 0, left: 0 }}>
      {Array.from(data.entities.values()).map((entity) => (
        <Entity key={entity.id} entity={entity} />
      ))}
    </div>
  )
}

export default Entities
