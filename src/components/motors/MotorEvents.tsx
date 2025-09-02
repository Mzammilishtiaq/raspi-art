import { useState } from 'react'
import { Button, CloseButton, NumberInput, Stack, Text, Table, Group, NumberFormatter, Tooltip, ThemeIcon, Box, ActionIcon, Menu, MenuItem, SegmentedControl, Center, VisuallyHidden } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconCopy, IconEdit, IconHelpCircle, IconPlus, IconRotate, IconRotateClockwise, IconTrash } from '@tabler/icons-react'

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
interface AngularInternalMotorEvent{
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
  sequences: MotorSequence[]
  index: number
  onSaveEvents: (events: MotorEvent[]) => Promise<boolean>
  rotationAngularMode: 'rotation' | 'angular'
  setRotationAngularMode: (mode: 'rotation' | 'angular') => void
}

export const MotorEvents = ({ sequences, index, onSaveEvents, rotationAngularMode, setRotationAngularMode }: MotorSequenceProps) => {
  const [internalEvents, setInternalEvents] = useState<InternalMotorEvent[]>(mapToInternal(sequences[index].events))
  const [angularInternalEvents, setAngularInternalEvents] = useState<AngularInternalMotorEvent[]>(mapToInternal(sequences[index].events))
  const [isRotationEditing, setIsRotationEditing] = useState(false)
  const [isAngularEditing, setIsAngularEditing] = useState(false)
  const [clockAndAnticlockMode, setClockAndAnticlockMode] = useState<'clockwise' | 'anticlockwise'>('anticlockwise')
  const [loading, setLoading] = useState(false)

  const saveEdit = async () => {
    setLoading(true)
    const sanitizedInternalEvents = mapToExternal(internalEvents)
    setInternalEvents(mapToInternal(sanitizedInternalEvents))
    const success = await onSaveEvents(sanitizedInternalEvents)
    setIsRotationEditing(!success)
    setLoading(false)
  }

  const cancelEdit = () => {
    setInternalEvents(mapToInternal(sequences[index].events))
    setIsRotationEditing(false)
  }

  const addEvent = () => {
    setInternalEvents([
      ...internalEvents,
      DEFAULT_EVENT
    ])
  }

const addEventAngular = () => {
  setAngularInternalEvents(prev => [...prev, { ...DEFAULT_EVENTAngular }])
}

  const clearEvents = () => {
    setInternalEvents([DEFAULT_EVENT])
    setAngularInternalEvents([DEFAULT_EVENTAngular])
  }
  const clearAngularEvents = () => {
    setAngularInternalEvents([DEFAULT_EVENTAngular])
  }
  const loadDataFrom = (otherMotorSequence: MotorSequence) => {
    setInternalEvents(mapToInternal(otherMotorSequence.events))
  } 
const loadDataFromAngular = (otherMotorSequence: MotorSequence) => {
  // however you map, ensure direction is present
  const mapped = otherMotorSequence.events.map(e => ({
    duration: (e.duration / 1000).toFixed(DURATION_NUM_DECIMAL_PLACES),
    targetAngle: '',
    acceleration: '',
    direction: 'clockwise' as 'clockwise' | 'anticlockwise' | 'zero',
  }))
  setAngularInternalEvents(mapped.length ? mapped : [DEFAULT_EVENTAngular])
}

  const moveEvent = (index: number, moveForward: boolean) => {
    const moveBy = moveForward ? 1 : -1
    const newIndex = index + moveBy
    if (newIndex < 0 || newIndex >= internalEvents.length) {
      return
    }

    const sliceShift = moveForward ? 0 : 1
    const startSlice = internalEvents.slice(0, index - sliceShift)
    const endSlice = internalEvents.slice(index - sliceShift + 2, internalEvents.length)
    const innerFirst = moveForward ? internalEvents[index + 1] : internalEvents[index]
    const innerSecond = moveForward ? internalEvents[index] : internalEvents[index - 1]
    setInternalEvents([...startSlice, innerFirst, innerSecond, ...endSlice])
  }

    const moveEventAngular = (index: number, moveForward: boolean) => {
    const moveBy = moveForward ? 1 : -1
    const newIndex = index + moveBy
    if (newIndex < 0 || newIndex >= angularInternalEvents.length) {
      return
    }

    const sliceShift = moveForward ? 0 : 1
    const startSlice = internalEvents.slice(0, index - sliceShift)
    const endSlice = internalEvents.slice(index - sliceShift + 2, internalEvents.length)
    const innerFirst = moveForward ? angularInternalEvents[index + 1] : angularInternalEvents[index]
    const innerSecond = moveForward ? angularInternalEvents[index] : angularInternalEvents[index - 1]
    setAngularInternalEvents([...startSlice, innerFirst, innerSecond, ...endSlice])
  }

  const deleteEvent = (index: number) => {
    setInternalEvents(internalEvents.filter((_, i) => i != index))
  }

    const deleteEventAngular = (index: number) => {
    setAngularInternalEvents(angularInternalEvents.filter((_, i) => i != index))
  }

  const updateEvent = (partialEvent: Partial<InternalMotorEvent>, index: number) => {
    setInternalEvents(internalEvents.map((event, i) => i == index ? { ...event, ...partialEvent } : event))
  }
const updateEventAngular = (partial: Partial<AngularInternalMotorEvent>, index: number) => {
  setAngularInternalEvents(events =>
    events.map((e, i) => (i === index ? { ...e, ...partial } : e))
  )
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

  const generateAngularTableRows = ( events: AngularInternalMotorEvent[]) => events.map((event, index) => (
    <Table.Tr key={index}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{event.duration}</Table.Td>
      <Table.Td>{event.targetAngle}</Table.Td>
      <Table.Td>{event.acceleration}</Table.Td>
        <Table.Td width={120}>
        <Group>
          <SegmentedControl
          value={clockAndAnticlockMode}
             data={[
            {
              value: "Clockwise",
              label: (
                <Center style={{ gap: 10 }}>
                  <span>Clockwise</span>
                </Center>
              ),
            },
            {
              value: "AntiClockwise",
              label: (
                <Center style={{ gap: 10 }}>
                  <span>AntiClockwise</span>
                </Center>
              ),
            }
          ]}
          />
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  const generateAngularEditTableRows = (events: AngularInternalMotorEvent[]) => events.map((event, index) => (
    <Table.Tr key={index}>
      <Table.Td>
        <NumberInput
          min={MIN_DURATION_SECONDS}
          decimalScale={DURATION_NUM_DECIMAL_PLACES}
          value={toNumberOrReturnValue(event.duration?? '')}
          step={MIN_DURATION_SECONDS}
          allowNegative={false}
          stepHoldDelay={INPUT_STEP_DELAY}
          stepHoldInterval={INPUT_STEP_INTERVAL}
          minLength={5}
          onChange={value => updateEventAngular({ duration: value.toString() }, index)} />
      </Table.Td>
      <Table.Td>
        <NumberInput
          min={-MAX_MOTOR_SPEED}
          max={MAX_MOTOR_SPEED}
          stepHoldDelay={INPUT_STEP_DELAY}
          stepHoldInterval={INPUT_STEP_INTERVAL}
          allowDecimal={false}
          minLength={5}
          value={toNumberOrReturnValue(event.targetAngle ?? '')}
          onChange={value => updateEventAngular({ targetAngle: value.toString() }, index)} />
      </Table.Td>
      <Table.Td>
        <NumberInput
          min={-MAX_MOTOR_SPEED}
          max={MAX_MOTOR_SPEED}
          stepHoldDelay={INPUT_STEP_DELAY}
          stepHoldInterval={INPUT_STEP_INTERVAL}
          allowDecimal={false}
          minLength={5}
          value={toNumberOrReturnValue(event.acceleration ?? '')}
          onChange={value => updateEventAngular({ acceleration: value.toString() }, index)} />
      </Table.Td>
       <Table.Td width={120}>
        <Group>
          <SegmentedControl
          onChange={(v)=>setClockAndAnticlockMode(v as 'clockwise' | 'anticlockwise')}
          value={clockAndAnticlockMode}
             data={[
            {
              value: "clockwise",
              label: (
                <Center style={{ gap: 10 }}>
                  <span>Clockwise</span>
                </Center>
              ),
            },
            {
              value: "anticlockwise",
              label: (
                <Center style={{ gap: 10 }}>
                  <span>AntiClockwise</span>
                </Center>
              ),
            }
          ]}
          />
        </Group>
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
                onClick={() => moveEventAngular(index, false)}>
                <IconChevronUp />
              </ActionIcon>
            </Tooltip>
            <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Move Down'>
              <ActionIcon
                hidden={events.length <= 1}
                disabled={index == events.length - 1}
                variant='subtle'
                radius='xl'
                onClick={() => moveEventAngular(index, true)}>
                <IconChevronDown />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Delete Row'>
            <CloseButton
              hidden={events.length <= 1}
              disabled={events.length <= 1}
              radius='xl'
              onClick={() => deleteEventAngular(index)} />
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  const AngularRow = isAngularEditing && rotationAngularMode === 'angular'
    ? generateAngularEditTableRows(angularInternalEvents)
    : generateAngularTableRows(angularInternalEvents)

  const rows = isRotationEditing && rotationAngularMode === 'rotation'
    ? generateEditTableRows(internalEvents)
    : generateTableRows(internalEvents)

  const totalDurationSeconds = internalEvents
    .map(event => event.duration)
    .map(toNumber)
    .reduce((a, b) => a + b, 0)

  const iconProps = {
    style: { display: 'block' },
    size: 20,
    stroke: 1.5,
  };
  const handleModeChange = (v: 'rotation' | 'angular') => {
  setRotationAngularMode(v)
  setIsRotationEditing(false)
  setIsAngularEditing(false)
}
  return (
    <Stack>
      <Group className={ClassNames.motorEventContainer} >
        <SegmentedControl
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
        />
        <Text c='dimmed'>
          <strong>Total Duration: </strong>
          <NumberFormatter suffix=' seconds' value={totalDurationSeconds.toFixed(DURATION_NUM_DECIMAL_PLACES)} thousandSeparator />
        </Text>
        {rotationAngularMode === 'angular' && <SegmentedControl
          data={[
            {
              value: 'clockwise',
              label: (
                <>
                  <IconRotate className={ClassNames.clockwise} {...iconProps} />
                  <VisuallyHidden>anticlockwise</VisuallyHidden>
                </>
              ),
            },
            {
              value: 'anticlockwise',
              label: (
                <>
                  <IconRotateClockwise className={ClassNames.anticlockwise} {...iconProps} />
                  <VisuallyHidden>anticlockwise</VisuallyHidden>
                </>
              ),
            },
            {
              value: 'zero',
              label: (
                <Center style={{ gap: 10 }}>
                  <span>Zero</span>
                </Center>
              ),
            },
          ]}
        />}
       {rotationAngularMode === 'rotation' ? (
  isRotationEditing ? (
    <Button.Group className={ClassNames.motorbuttongroup}>
      <Button
        className={ClassNames.motorSaveEditButton}
        variant="filled"
        onClick={saveEdit}
        loading={loading}
      >
        Save
      </Button>
      <Button
        className={ClassNames.motorSaveCancelButton}
        variant="light"
        onClick={cancelEdit}
        disabled={loading}
      >
        Cancel
      </Button>
    </Button.Group>
  ) : (
    <Button
      variant="subtle"
      leftSection={<IconEdit size={14} />}
      onClick={() => setIsRotationEditing(true)}
    >
      Edit
    </Button>
  )
) : (
  isAngularEditing ? (
    <Button.Group className={ClassNames.motorbuttongroup}>
      <Button
        className={ClassNames.motorSaveEditButton}
        variant="filled"
        onClick={async () => {
          setLoading(true)
          const sanitized = mapToExternal(internalEvents)
          setInternalEvents(mapToInternal(sanitized))
          const ok = await onSaveEvents(sanitized)
          setIsAngularEditing(!ok)
          setLoading(false)
        }}
        loading={loading}
      >
        Save
      </Button>
      <Button
        className={ClassNames.motorSaveCancelButton}
        variant="light"
        onClick={() => {
          setInternalEvents(mapToInternal(sequences[index].events))
          setIsAngularEditing(false)
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
      onClick={() => setIsAngularEditing(true)}
    >
      Edit
    </Button>
  )
)}
      </Group>

      <Table withRowBorders={false}>
        {/* <======Rotation Mode============> */}
        {rotationAngularMode === 'rotation' && <Table.Thead>
          <Table.Tr>
            {!isRotationEditing && rotationAngularMode === 'rotation' && <Table.Th>Index</Table.Th>}
            {rotationAngularMode === 'rotation' && <Table.Th>Duration (s)</Table.Th>}
            {rotationAngularMode === 'rotation' && <Table.Th>
              <Group gap={0}>
                <Box>Speed</Box>
                <Tooltip
                  label='Motor speed values range from -100,000 to 100,000'
                  events={{ hover: true, focus: true, touch: true }}>
                  <ThemeIcon variant='white' radius='xl'>
                    <IconHelpCircle size={16} />
                  </ThemeIcon>
                </Tooltip>
              </Group>
            </Table.Th>}
            {isRotationEditing && rotationAngularMode === 'rotation' && <Table.Th />}
          </Table.Tr>
        </Table.Thead>}
        {rotationAngularMode === 'rotation' && <Table.Tbody>{rows}</Table.Tbody>}
        {isRotationEditing && rotationAngularMode === 'rotation' && <Table.Caption>
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
                {sequences.filter((_, i) => i != index).map((s, i) =>
                  <MenuItem key={i} onClick={() => loadDataFrom(s)}>Motor {s.id}</MenuItem>
                )}
              </Menu.Dropdown>
            </Menu>
            <Button
              variant='subtle'
              color='red'
              leftSection={<IconTrash size={14} />}
              onClick={clearEvents}
              disabled={internalEvents.length == 1 && internalEvents[0] == DEFAULT_EVENT}>
              Clear All
            </Button>
          </Group>
        </Table.Caption>
        }



        {/* <==========Angular Mode============> */}
        {rotationAngularMode === 'angular' &&
          <Table.Thead>
            <Table.Tr>
              {!isAngularEditing && rotationAngularMode === 'angular' && <Table.Th>Index</Table.Th>}
              {rotationAngularMode === 'angular' && <Table.Th>Duration (s)</Table.Th>}
              {rotationAngularMode === 'angular' && <Table.Th>Target Angle</Table.Th>}
              {rotationAngularMode === 'angular' && <Table.Th>Acceleration</Table.Th>}
              {rotationAngularMode === 'angular' && <Table.Th>Direction</Table.Th>}
              {isAngularEditing && rotationAngularMode === 'angular' && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
        }
        {rotationAngularMode === 'angular' && <Table.Tbody>{AngularRow}</Table.Tbody>}
        {isAngularEditing && rotationAngularMode === 'angular' && <Table.Caption>
          <Group justify='center'>
            <Button variant='subtle' leftSection={<IconPlus size={14} />} onClick={addEventAngular}>
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
                {sequences.filter((_, i) => i != index).map((s, i) =>
                  <MenuItem key={i} onClick={() => loadDataFromAngular(s)}>Motor {s.id}</MenuItem>
                )}
              </Menu.Dropdown>
            </Menu>
            <Button
              variant='subtle'
              color='red'
              leftSection={<IconTrash size={14} />}
              onClick={clearAngularEvents}
              disabled={internalEvents.length == 1 && angularInternalEvents[0] == DEFAULT_EVENTAngular}>
              Clear All
            </Button>
          </Group>
        </Table.Caption>
        }
      </Table>
    </Stack >
  )
}

export default MotorEvents
