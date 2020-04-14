import React from "react"
import Cell from "./Cell"
import game from "game"
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
  const { data, isIn } = useStateDesigner(game)

  let visibleCells = [] as any[]

  const selectedEntity = data.entities.find(
    (e) => e.data.id === data.selectedEntity
  )

  if (selectedEntity) {
    visibleCells = selectedEntity.data.vision.cells
  }

  return (
    <CellsContainer>
      {data.grid.map((row, y) =>
        row.map((cell, x) => {
          const visible = selectedEntity
            ? visibleCells.find((c) => c.y === y && c.x === x)
            : true

          return (
            <Cell
              key={`${y},${x}`}
              visible={visible}
              position={cell.position}
            />
          )
        })
      )}
    </CellsContainer>
  )
}

export default Cells
