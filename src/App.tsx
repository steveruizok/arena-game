import React from "react"
import game, { getNewEntity } from "game"
import Grid from "./View/Grid"
import EntityDetails from "./View/EntityDetails"
import Status from "./View/Status"
import styled from "@emotion/styled"

const Container = styled.div({
  display: "grid",
  margin: 16,
  gridTemplateColumns: "320px auto",
  gridGap: 16,
})

const keyboardEvents: { [key: string]: string } = {
  a: "TOGGLED_AIM",
  m: "TOGGLED_MOVE",
  t: "TOGGLED_TURN",
  Escape: "CANCELLED",
}

const App = () => {
  // Spawn initial entities
  React.useEffect(() => {
    game.send("ADDED_ENTITY", getNewEntity({ x: 5, y: 5, z: 0 }, "n"))
    game.send("ADDED_ENTITY", getNewEntity({ x: 1, y: 1, z: 0 }, "s"))
    game.send("ADDED_ENTITY", getNewEntity({ x: 5, y: 2, z: 0 }, "s"))
  }, [])

  // Set keyboard events
  React.useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      const eventName = keyboardEvents[event.key]

      if (eventName) {
        game.send(eventName)
      }
    }

    document.body.addEventListener("keyup", handleKeyPress)
    return () => {
      document.body.removeEventListener("keyup", handleKeyPress)
    }
  }, [])

  return (
    <Container>
      <div>
        <Grid />
        <Status />
      </div>
      <div>
        <EntityDetails />
      </div>
    </Container>
  )
}

export default App
