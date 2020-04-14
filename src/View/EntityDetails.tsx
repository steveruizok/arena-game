import React from "react"
import game from "game"
import styled from "@emotion/styled/macro"
import { useStateDesigner } from "state-designer"

export interface Props {}

const EntityDetails: React.FC<Props> = () => {
  const { data, whenIn } = useStateDesigner(game)

  const selectedEntity = data.selectedEntity
    ? data.entities.find((e) => e.data.id === data.selectedEntity)
    : undefined

  if (selectedEntity === undefined) return <div />

  const { id, position, health, attack, vision } = selectedEntity.data

  return (
    <Table>
      <Section>
        <SectionTitle>Entity</SectionTitle>
        <Row>
          <span>id</span>
          <span>{id}</span>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Position</SectionTitle>
        <Row>
          <span>x</span>
          <span>{position.x}</span>
        </Row>
        <Row>
          <span>y</span>
          <span>{position.y}</span>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Health</SectionTitle>
        <Row>
          <span>Current</span>
          <span>{health.current}</span>
        </Row>
        <Row>
          <span>Max</span>
          <span>{health.max}</span>
        </Row>
        <Row>
          <span>Dead</span>
          <span>{health.dead.toString()}</span>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Melee Attack</SectionTitle>
        <Row>
          <span>Damage</span>
          <span>{attack.melee.damage}</span>
        </Row>
        <Row>
          <span>Accuracy</span>
          <span>{attack.melee.accuracy}</span>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Ranged Attack</SectionTitle>
        <Row>
          <span>Damage</span>
          <span>{attack.ranged.damage}</span>
        </Row>
        <Row>
          <span>Range</span>
          <span>{attack.ranged.range}</span>
        </Row>
        <Row>
          <span>Accuracy</span>
          <span>{attack.ranged.accuracy}</span>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Vision</SectionTitle>
        <Row>
          <span>Facing</span>
          <span>{vision.facing}</span>
        </Row>
        <Row>
          <span>Visible Cells</span>
          <span>{vision.cells.length}</span>
        </Row>
        <Row>
          <span>Visible Entities</span>
          <span>{vision.entities.length}</span>
        </Row>
      </Section>
    </Table>
  )
}

export default EntityDetails

const Section = styled.div`
  font-size: 14px;
  padding: 12px 16px 12px 16px;
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: fit-content(32px);
  grid-row-gap: 4px;
  border-top: 1px solid var(--highlight);
  border-bottom: 1px solid var(--shadow);
  user-select: none;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > div:nth-of-type(0) {
    text-align: left;
  }

  & > div:nth-of-type(1) {
    text-align: right;
  }
`

const SectionTitle = styled.div`
  font-weight: bold;
  padding-bottom: 4px;
`

const Table = styled.div`
  width: 200px;
  border: 1px solid var(--highlight);
  overflow-y: scroll;
  background-color: var(--surface);
`
