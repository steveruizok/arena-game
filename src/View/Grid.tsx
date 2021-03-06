import React from "react"
import Entities from "./Entities"
import Overlays from "./Overlays"
import Vision from "./Vision"
import Shots from "./Shots"
import game from "game"
import styled from "@emotion/styled"
import { useStateDesigner } from "state-designer"
import config from "game/config"

export interface Props {}

const Grid: React.FC<Props> = ({ children }) => {
  const { isIn, send } = useStateDesigner(game)

  return (
    <Container>
      <Board
        onClick={(e) => {
          if (e.metaKey) {
            game.send("COMMAND_CLICKED_BOARD")
          } else {
            send("CLICKED_BOARD")
          }
        }}
      >
        <Overlays />
        <Shots />
        <Entities />
      </Board>
      <Vision />
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

const { map } = config

const Container = styled.div`
  display: grid;
  grid-template-columns: ${map.size.x * 32}px;
  grid-template-rows: auto;
  grid-auto-rows: fit-content(32px);
  grid-row-gap: 16px;
  cursor: crosshair;
`

const Board = styled.div({
  position: "relative",
  height: map.size.y * 32,
  width: map.size.x * 32,
})

const Buttons = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-template-rows: 32px;
  grid-gap: 4px;
  grid-auto-flow: column;

  > button {
    font-weight: bold;
    background: none;
    background-color: var(--surface);
    border: none;
    border-top: 1px solid var(--highlight);
    border-right: 1px solid var(--shadow);
    border-bottom: 1px solid var(--shadow);
    border-left: 1px solid var(--highlight);
    padding: 0px 12px 2px 12px;
    outline: none;
  }

  > button:hover {
    background-color: var(--highlight);
  }

  > button:active {
    background-color: var(--active);
  }

  > button.active {
    background-color: var(--active);
  }
`
