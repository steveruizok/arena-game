import React from "react"
import Cells from "./Cells"
import Entities from "./Entities"
import Overlays from "./Overlays"
import Shots from "./Shots"
import game from "game"
import find from "lodash-es/find"
import styled from "@emotion/styled"
import { useStateDesigner } from "state-designer"

export interface Props {}

const Grid: React.FC<Props> = ({ children }) => {
  const { isIn, send } = useStateDesigner(game)

  return (
    <Container>
      <Board onClick={() => send("CLICKED_BOARD")}>
        <Cells />
        <Overlays />
        <Shots />
        <Entities />
      </Board>
      <Buttons>
        <button onClick={() => send("ADVANCED_TURN")}>Next Turn</button>
      </Buttons>
      {isIn("selected") && (
        <Buttons>
          <button onClick={() => send("CANCELLED")}>Cancel</button>
          <button
            className={isIn("turning") ? "active" : ""}
            onClick={() => send("TOGGLED_TURN")}
          >
            [T]urn
          </button>
          <button
            className={isIn("moving") ? "active" : ""}
            onClick={() => send("TOGGLED_MOVE")}
          >
            [M]ove
          </button>
          <button
            className={isIn("aiming") ? "active" : ""}
            onClick={() => send("TOGGLED_AIM")}
          >
            [A]im
          </button>
        </Buttons>
      )}
    </Container>
  )
}

export default Grid

const Container = styled.div`
  display: grid;
  grid-template-columns: 320px;
  grid-template-rows: 320px;
  grid-auto-rows: fit-content(32px);
  grid-row-gap: 16px;
`

const Board = styled.div({
  position: "relative",
  height: 320,
  width: 320,
})

const Buttons = styled.div`
  display: grid;
  grid-auto-columns: fit-content(128px);
  grid-template-rows: 32px;
  grid-column-gap: 16px;
  grid-auto-flow: column;

  > button {
    font-weight: bold;
    background: none;
    background-color: var(--surface);
    border: 1px solid #fff;
    border-radius: 8px;
    padding: 0px 12px 2px 12px;
    outline: none;
  }

  > button:active {
    background-color: var(--active);
  }

  > button.active {
    background-color: var(--active);
  }
`
