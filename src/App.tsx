import React from "react"
import game from "game"
import Grid from "./View/Grid"
import EntityDetails from "./View/EntityDetails"
import Status from "./View/Status"
import styled from "@emotion/styled"

const Container = styled.div({
  display: "grid",
  margin: 16,
  gridTemplateColumns: "320px auto",
  gridTemplateRows: "600px auto",
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
    game.send("ENTITY_SPAWNED", { position: { x: 5, y: 5 }, facing: "s" })
    game.send("ENTITY_SPAWNED", { position: { x: 2, y: 3 }, facing: "n" })
    game.send("ENTITY_SPAWNED", { position: { x: 5, y: 2 }, facing: "e" })
    game.send("ENTITY_SPAWNED", { position: { x: 3, y: 7 }, facing: "n" })
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
      <Grid />
      <EntityDetails />
      <Status />
    </Container>
  )
}

export default App
