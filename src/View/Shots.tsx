import React from "react"
import shots from "game/shots"
import { Shot } from "game/types"
import styled from "@emotion/styled"
import { motion, useAnimation } from "framer-motion"
import { useStateDesigner } from "state-designer"

const Container = styled.div({
  position: "absolute",
  top: 0,
  left: 0,
  width: 320,
  height: 320,
  pointerEvents: "none",
})

export interface Props {}

const Shots: React.FC<Props> = ({ children }) => {
  const { data } = useStateDesigner(shots)

  return (
    <Container>
      {data.bullets.map((bullet, i) => (
        <Bullet key={bullet.id} bullet={bullet} />
      ))}
    </Container>
  )
}

export default Shots

const Bullet: React.FC<{ bullet: Shot }> = ({ bullet }) => {
  const { from, to, id } = bullet
  const { x: x1, y: y1 } = from
  const { x: x2, y: y2 } = to

  const distance = Math.hypot(x2 - x1, y2 - y1)

  const [isDone, setIsDone] = React.useState(false)

  const animate = useAnimation()

  React.useEffect(() => {
    if (!isDone) {
      animate.set({
        x: x1 * 32 + 13,
        y: y1 * 32 + 13,
      })
      animate.start({
        x: x2 * 32 + 13,
        y: y2 * 32 + 13,
      })
    } else {
      animate.set({
        x: -3200,
        y: -3200,
      })
    }
  }, [isDone])

  return (
    <motion.div
      style={{
        position: "absolute",
        borderRadius: "100%",
        height: 6,
        width: 6,
        backgroundColor: "#fff",
        border: "1px solid #000",
      }}
      animate={animate}
      transition={{
        type: "tween",
        ease: "linear",
        duration: distance * 0.1,
      }}
      onAnimationComplete={() => {
        shots.send("SHOT_LANDED", id)
        setIsDone(true)
      }}
    />
  )
}
