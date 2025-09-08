import { useState } from 'react'
import { Button, CloseButton, NumberInput, Stack, Text, Table, Group, NumberFormatter, Tooltip, ThemeIcon, Box, ActionIcon, Menu, MenuItem} from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconCopy, IconEdit, IconHelpCircle, IconPlus, IconTrash } from '@tabler/icons-react'

import { MotorEvent, MotorSequence } from '../../api'
import { INPUT_STEP_DELAY, INPUT_STEP_INTERVAL } from '../../constants'
import ClassNames from './style/motor.module.css'
const MIN_DURATION_SECONDS = 0.1
const MAX_MOTOR_SPEED = 100000
const DURATION_NUM_DECIMAL_PLACES = 1

const DEFAULT_EVENT: InternalMotorEvent = { speed: '0', duration: '1' }
const DEFAULT_EVENTAngular: AngularInternalMotorEvent = {
  duration: '10',
  targetAngle: '1',
  acceleration: '10',
  direction: 'clockwise'
}

interface InternalMotorEvent {
  speed: string
  duration: string
}
interface AngularInternalMotorEvent {
  duration?: string
  targetAngle?: string
  acceleration?: string
  direction?: 'clockwise' | 'anticlockwise' | 'zero'
}

const toNumberOrReturnValue = (value: string) => {
  const converted = parseFloat(value)
  return isNaN(converted) ? value : converted
}

const toNumber = (value: string, defaultValue: number = 0) => {
  const converted = parseFloat(value)
  return isNaN(converted) ? defaultValue : converted
}

const mapToInternal = (events: MotorEvent[]) => events.map(event => ({
  speed: event.speed.toFixed(),
  duration: (event.duration / 1000).toFixed(DURATION_NUM_DECIMAL_PLACES)
}))

const mapToExternal = (events: InternalMotorEvent[]) => events.map(event => ({
  speed: toNumber(event.speed, 0),
  duration: Math.round(toNumber(event.duration, MIN_DURATION_SECONDS) * 1000)
}))

export interface MotorSequenceProps {
  // sequences?: MotorSequence[]
  // index?: number
  // onSaveEvents?: (events: MotorEvent[]) => Promise<boolean>
  // rotationAngularMode: 'rotation' | 'angular'
  // setRotationAngularMode: (mode: 'rotation' | 'angular') => void
}

export const MotorEvents = ({ }: MotorSequenceProps) => {
  // const [internalEvents, setInternalEvents] = useState<InternalMotorEvent[]>(mapToInternal(sequences[index].events))
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const saveEdit = async () => {
    setLoading(true)
    // const sanitizedInternalEvents = mapToExternal(internalEvents)
    // setInternalEvents(mapToInternal(sanitizedInternalEvents))
    // const success = await onSaveEvents(sanitizedInternalEvents)
    // setIsEditing(!success)
    setLoading(false)
  }

  const cancelEdit = () => {
    // setInternalEvents(mapToInternal(sequences[index].events))
    setIsEditing(false)
  }

  const addEvent = () => {
    // setInternalEvents([
    //   ...internalEvents,
    //   DEFAULT_EVENT
    // ])
  }

  const clearEvents = () => {
    // setInternalEvents([DEFAULT_EVENT])
    // setAngularInternalEvents([DEFAULT_EVENTAngular])
  }
  const loadDataFrom = (otherMotorSequence: MotorSequence) => {
    // setInternalEvents(mapToInternal(otherMotorSequence.events))
  }

  const moveEvent = (index: number, moveForward: boolean) => {
    const moveBy = moveForward ? 1 : -1
    const newIndex = index + moveBy
    // if (newIndex < 0 || newIndex >= internalEvents.length) {
      // return
    // }

    const sliceShift = moveForward ? 0 : 1
    // const startSlice = internalEvents.slice(0, index - sliceShift)
    // const endSlice = internalEvents.slice(index - sliceShift + 2, internalEvents.length)
    // const innerFirst = moveForward ? internalEvents[index + 1] : internalEvents[index]
    // const innerSecond = moveForward ? internalEvents[index] : internalEvents[index - 1]
    // setInternalEvents([...startSlice, innerFirst, innerSecond, ...endSlice])
  }

  const deleteEvent = (index: number) => {
    // setInternalEvents(internalEvents.filter((_, i) => i != index))
  }



  const updateEvent = (partialEvent: Partial<InternalMotorEvent>, index: number) => {
    // setInternalEvents(internalEvents.map((event, i) => i == index ? { ...event, ...partialEvent } : event))
  }
  const generateTableRows = (events: InternalMotorEvent[]) => events.map((event, index) => (
    <Table.Tr key={index}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{event.duration}</Table.Td>
      <Table.Td>{event.speed}</Table.Td>
    </Table.Tr>
  ))

  const generateEditTableRows = (events: InternalMotorEvent[]) => events.map((event, index) => (
    <Table.Tr key={index}>
      <Table.Td>
        <NumberInput
          min={MIN_DURATION_SECONDS}
          decimalScale={DURATION_NUM_DECIMAL_PLACES}
          value={toNumberOrReturnValue(event.duration)}
          step={MIN_DURATION_SECONDS}
          allowNegative={false}
          stepHoldDelay={INPUT_STEP_DELAY}
          stepHoldInterval={INPUT_STEP_INTERVAL}
          minLength={5}
          onChange={value => updateEvent({ duration: value.toString() }, index)} />
      </Table.Td>
      <Table.Td>
        <NumberInput
          min={-MAX_MOTOR_SPEED}
          max={MAX_MOTOR_SPEED}
          stepHoldDelay={INPUT_STEP_DELAY}
          stepHoldInterval={INPUT_STEP_INTERVAL}
          allowDecimal={false}
          minLength={5}
          value={toNumberOrReturnValue(event.speed)}
          onChange={value => updateEvent({ speed: value.toString() }, index)} />
      </Table.Td>
      <Table.Td width={120}>
        <Group>
          <Group gap={0}>
            <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Move Up'>
              <ActionIcon
                hidden={events.length <= 1}
                disabled={index == 0}
                variant='subtle'
                radius='xl'
                onClick={() => moveEvent(index, false)}>
                <IconChevronUp />
              </ActionIcon>
            </Tooltip>
            <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Move Down'>
              <ActionIcon
                hidden={events.length <= 1}
                disabled={index == events.length - 1}
                variant='subtle'
                radius='xl'
                onClick={() => moveEvent(index, true)}>
                <IconChevronDown />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Delete Row'>
            <CloseButton
              hidden={events.length <= 1}
              disabled={events.length <= 1}
              radius='xl'
              onClick={() => deleteEvent(index)} />
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  // const rows = isEditing
  //   ? generateEditTableRows(internalEvents)
  //   : generateTableRows(internalEvents)


  // const totalDurationSeconds = internalEvents
  //   .map(event => event.duration)
  //   .map(toNumber)
  //   .reduce((a, b) => a + b, 0)

  // const iconProps = {
  //   style: { display: 'block' },
  //   size: 20,
  //   stroke: 1.5,
  // };
  //   const handleModeChange = (v: 'rotation' | 'angular') => {
  //   setRotationAngularMode(v)
  //   setIsEditing(false)
  //   setIsAngularEditing(false)
  // }
  return (
    <Stack>
      <Group className={ClassNames.motorEventContainer} >
        {/* <SegmentedControl
          value={rotationAngularMode}
          onChange={(v) => handleModeChange(v as 'rotation' | 'angular')}
          data={[
            {
              value: "rotation",
              label: (
                <Center style={{ gap: 10 }}>
                  <span>Rotation</span>
                </Center>
              ),
            },
            {
              value: "angular",
              label: (
                <Center style={{ gap: 10 }}>
                  <span>Angular</span>
                </Center>
              ),
            }
          ]}
        /> */}
        <Text c='dimmed'>
          <strong>Total Duration: </strong>
          {/* <NumberFormatter suffix=' seconds' value={totalDurationSeconds.toFixed(DURATION_NUM_DECIMAL_PLACES)} thousandSeparator /> */}
        </Text>
        {isEditing ? (
          <Button.Group className={ClassNames.motorbuttongroup}>
            <Button
              className={ClassNames.motorSaveEditButton}
              variant="filled"
              onClick={async () => {
                saveEdit()
              }}
              loading={loading}
            >
              Save
            </Button>
            <Button
              className={ClassNames.motorSaveCancelButton}
              variant="light"
              onClick={() => {
                setIsEditing(false)
                cancelEdit()
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </Button.Group>
        ) : (
          <Button
            variant="subtle"
            leftSection={<IconEdit size={14} />}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>)}
      </Group>

      <Table withRowBorders={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Index</Table.Th>
            <Table.Th>Duration (s)</Table.Th>
            <Table.Th>
              <Group gap={0}>
                <Box>RPM</Box>
                <Tooltip
                  label='Motor RPM values range from -100,000 to 100,000'
                  events={{ hover: true, focus: true, touch: true }}>
                  <ThemeIcon variant='white' radius='xl'>
                    <IconHelpCircle size={16} />
                  </ThemeIcon>
                </Tooltip>
              </Group>
            </Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>

        {/* <Table.Tbody>{rows}</Table.Tbody> */}

        {isEditing && <Table.Caption>
          <Group justify='center'>
            <Button variant='subtle' leftSection={<IconPlus size={14} />} onClick={addEvent}>
              Add Row
            </Button>
            <Menu>
              <Menu.Target>
                <Button
                  variant='subtle'
                  leftSection={<IconCopy size={14} />}
                  rightSection={<IconChevronDown size={14} />} >
                  Load Data
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>From</Menu.Label>
                {/* {sequences.filter((_, i) => i != index).map((s, i) =>
                  <MenuItem key={i} onClick={() => loadDataFrom(s)}>Motor {s.id}</MenuItem>
                )} */}
              </Menu.Dropdown>
            </Menu>
            {/* <Button
              variant='subtle'
              color='red'
              leftSection={<IconTrash size={14} />}
              onClick={clearEvents}
              disabled={internalEvents.length == 1 && angularInternalEvents[0] == DEFAULT_EVENTAngular}>
              Clear All
            </Button> */}
          </Group>
        </Table.Caption>}
      </Table>
    </Stack >
  )
}

export default MotorEvents
