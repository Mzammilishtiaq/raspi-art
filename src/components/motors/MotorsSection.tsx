import { useEffect, useState } from 'react'
import { Alert,  Flex, Grid, SegmentedControl, Skeleton, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCircleX, IconExclamationCircle, IconHelpCircle, IconWheel } from '@tabler/icons-react'
import ClassNames from './style/motor.module.css'
import useAsync from '../../useAsync'
import * as api from '../../api'
import MotorIcon from './MotorIcon'
import { MotorEvent, Status } from '../../api'
import { MotorEvents } from './MotorEvents'
import {backendCall} from '../../services/BackendCall'
export const MotorsSection = () => {
  const { value: sequences, setValue: setSequences, loading, error } = useAsync(api.getMotorSequences, [])
  const { value: statuses, setValue: setStatuses } = useAsync(api.getMotorStatuses, [])
  const [rotationAngularMode, setRotationAngularMode] = useState<'rotation' | 'angular'>('rotation')
  const [selectedMotorIndex, setSelectedMotorIndex] = useState(0)
const getMotors = async () => {
  await backendCall({
    url: '/motors',  // Ensure the endpoint is prefixed with '/api'
    method: 'GET',
    isShowErrorMessage: true,
  }).then((res) => {
    console.log("motors", res);
  });
};

useEffect(() => {
  getMotors();
}, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const statuses = await api.getMotorStatuses()
        setStatuses(statuses)
      } catch (e) {
        // ignore
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [setStatuses])

  const selectedSequence = sequences?.[selectedMotorIndex]
  const selectedStatus = statuses?.[selectedMotorIndex]

  const onSaveEvents = async (events: MotorEvent[]) => {
    if (sequences == null || selectedSequence == undefined) {
      return true
    }
    let success = false
    try {
      await api.setMotorSequence(selectedSequence.id, { events })
      setSequences(sequences.map(m => m.id == selectedSequence.id ? { ...selectedSequence, events } : m))
      success = true
    } catch (e) {
      notifications.show({
        id: 'error',
        withCloseButton: true,
        autoClose: 7000,
        title: 'Error updating motor sequence',
        message: (e as Error).message,
        color: 'red'
      })
    }
    return success
  }

  if (error) {
    return (
      <Alert variant='light' color='red' title='Error loading motor info' icon={<IconExclamationCircle />}>
        <Text c='grey' size='sm'>{error?.message}</Text>
      </Alert>
    )
  }

  return (
    <Stack className={ClassNames.motorMain}>
      <Grid align='baseline'>
        <Grid.Col span='auto'>
          <Flex gap={10} align={'center'}>
            <IconWheel size={25} />
           <Title ta='left' order={3}>Motors</Title>
          </Flex>
        </Grid.Col>
        {rotationAngularMode === 'rotation' && <Grid.Col span='content'>
          <Skeleton visible={loading}>
            <SegmentedControl
              fullWidth
              value={`${selectedMotorIndex}`}
              onChange={value => setSelectedMotorIndex(parseInt(value))}
              data={statuses?.map((status, index) => ({
                label: <MotorIcon status={status} />,
                value: `${index}`
              })) ?? []} />
          </Skeleton>
        </Grid.Col>}
        {rotationAngularMode === 'angular' && <Grid.Col span='content'>
          <Skeleton visible={loading}>
            <SegmentedControl
              fullWidth
              value={`${selectedMotorIndex}`}
              onChange={value => setSelectedMotorIndex(parseInt(value))}
              data={statuses?.map((status, index) => ({
                label: <MotorIcon status={status} />,
                value: `${index}`
              })) ?? []} />
          </Skeleton>
        </Grid.Col>}
      </Grid>
      {
        selectedStatus?.status == Status.ERROR &&
        <Alert variant='light' color='red' title='Motor Connection Error' icon={<IconCircleX />}>
          Could not establish a connection to this motor. Check the connection and power.
        </Alert>
      }
      {
        selectedStatus?.status == Status.UNKNOWN &&
        <Alert variant='light' color='yellow' title='Motor Connection Unknown' icon={<IconHelpCircle />}>
          The connection status of this motor is unknown. Please wait while a connection is established.
          If this persists, try power cycling the unit.
        </Alert>
      }
      {selectedSequence && <MotorEvents
        sequences={sequences}
        index={selectedMotorIndex}
        onSaveEvents={onSaveEvents}
        key={selectedMotorIndex}
        rotationAngularMode={rotationAngularMode}
        setRotationAngularMode={setRotationAngularMode}
      />}

    </Stack >
  )
}

export default MotorsSection