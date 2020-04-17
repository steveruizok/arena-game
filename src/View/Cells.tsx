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
    borderTop: "1px solid var(--highlight)",
    borderLeft: "1px solid var(--highlight)",
    borderRight: "1px solid var(--shadow)",
    borderBottom: "1px solid var(--shadow)",
  },
})

export interface Props {}

const Cells: React.FC<Props> = ({ children }) => {
  const { data } = useStateDesigner(game)

  return (
    <CellsContainer>
      {Array.from(data.map.values()).map((tile, i) => {
        return <Cell key={i} tile={tile} />
      })}
    </CellsContainer>
  )
}

export default Cells
