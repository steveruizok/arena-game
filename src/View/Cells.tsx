import React from "react"
import Cell from "./Cell"
import game from "game/game"
import styled from "@emotion/styled"
import { useStateDesigner } from "state-designer"

const CellsContainer = styled.div({
  position: "absolute",
  top: 0,
  left: 0,
  CellsTemplateColumns: "repeat(10, min-content)",
  "& > div": {
    borderTop: "1px solid rgba(255,255,255,.1)",
    borderLeft: "1px solid rgba(255,255,255,.1)",
    borderRight: "1px solid rgba(0,0,0,.5)",
    borderBottom: "1px solid rgba(0,0,0,.5)",
  },
})

export interface Props {}

const Cells: React.FC<Props> = ({ children }) => {
  const { data } = useStateDesigner(game)

  const selectedEntity = data.ui.entities.selected

  const visiblePositions = selectedEntity?.vision.positions || []

  return (
    <CellsContainer>
      {Array.from(data.map.values()).map((tile, i) => {
        const visible = selectedEntity
          ? visiblePositions.includes(tile.position)
          : true
        return <Cell key={i} visible={visible} tile={tile} />
      })}
    </CellsContainer>
  )
}

export default Cells
