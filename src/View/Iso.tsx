import * as React from "react"
import { useStateDesigner } from "state-designer"
import game from "game"
import { Position, Tile, Entity } from "game/types"
import { useSpring, animated } from "react-spring/three"
import { Canvas } from "react-three-fiber"

let i = 0

const Iso: React.FC<{}> = () => {
  const { data } = useStateDesigner(game)

  const { tiles, entities } = data.ui

  return (
    <div style={{ height: 320, width: 320, marginBottom: 16 }}>
      <Canvas
        gl={{ alpha: false, antialias: false, logarithmicDepthBuffer: true }}
        camera={{ fov: 75, position: [0, 0, 8] }}
      >
        <pointLight position={[-10, -10, 30]} intensity={0.25} />
        <spotLight
          intensity={0.5}
          position={[30, 30, 30]}
          angle={180}
          penumbra={1}
          castShadow
        />
        <ambientLight intensity={0.2} />
        {Array.from(data.map.values()).map((tile) => (
          <Tile3D key={tile.id} tile={tile} />
        ))}
        {Array.from(data.entities.values()).map((entity) => (
          <Entity3D key={entity.id} entity={entity} />
        ))}
        {tiles.inRange.map((tile, i) => (
          <CellHighlight3D
            key={i}
            position={tile.position}
            color="rgba(215, 71, 111)"
          />
        ))}
        {tiles.hovered && (
          <CellHighlight3D
            position={tiles.hovered.position}
            color={
              tiles.hovered.entity ? "rgb(255, 147, 91)" : "rgb(255, 216, 76)"
            }
          />
        )}
      </Canvas>
    </div>
  )
}

export default Iso

const Tile3D: React.FC<{ tile: Tile }> = ({ tile }) => {
  const { position, terrain } = tile
  return (
    <mesh
      castShadow
      receiveShadow
      position={[-4.5 + position.x, 4.5 - position.y, 0]}
      onPointerOver={() => game.send("HOVERED_TILE", tile)}
      onPointerOut={() => game.send("UNHOVERED_TILE", tile)}
      onClick={(e) => {
        if (e.metaKey) {
          game.send("COMMAND_CLICKED_TILE", tile)
        } else {
          game.send("CLICKED_TILE", tile)
        }
      }}
    >
      <boxGeometry
        attach="geometry"
        args={terrain === "wall" ? [1, 1, 2.5] : [1, 1, 0.1]}
      />
      <meshStandardMaterial
        attach="material"
        color={terrain === "wall" ? "rgb(77, 223, 234)" : "#575757"}
      />
    </mesh>
  )
}

const Entity3D: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { position } = entity

  const { pos } = useSpring({
    pos: [-4.5 + position.x, 4.5 - position.y, 0],
    config: { mass: 10, tension: 1000, friction: 300, precision: 0.00001 },
  })

  return (
    <animated.mesh
      castShadow
      receiveShadow
      position={pos}
      onPointerOver={() => game.send("HOVERED_ENTITY", entity)}
      onPointerOut={() => game.send("UNHOVERED_ENTITY", entity)}
      onClick={() => game.send("CLICKED_ENTITY", entity)}
    >
      <boxGeometry attach="geometry" args={[0.5, 0.5, 2]} />
      <meshStandardMaterial
        attach="material"
        roughness={0.5}
        color={"var(--text)"}
      />
    </animated.mesh>
  )
}

const CellHighlight3D: React.FC<{ color: string; position: Position }> = ({
  color,
  position,
}) => {
  return (
    <mesh receiveShadow position={[-4.5 + position.x, 4.5 - position.y, 0.11]}>
      <planeBufferGeometry attach="geometry" args={[1, 1]} />
      <meshStandardMaterial attach="material" color={color} opacity={0.1} />
    </mesh>
  )
}
