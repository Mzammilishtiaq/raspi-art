import { useEffect, useState } from 'react'
import { Alert, Flex, Grid, SegmentedControl, Stack, Title,Text } from '@mantine/core'
// import { notifications } from '@mantine/notifications'
import { IconCircleX, IconExclamationCircle, IconWheel } from '@tabler/icons-react'
import ClassNames from './style/motor.module.css'
import MotorIcon from './MotorIcon'
import { MotorId,MotorStatus} from '../../services/api/motors/types/motortype'
import {getStatus} from '../../services/api/motors/status'
import MotorSettings from './MotorSettings'
import MotorProgramUI from './MotorProgram'
export const MotorsSection = () => {
  // const { value: sequences, setValue: setSequences, loading, error } = useAsync(api.getMotorSequences, [])
  const isGetAllMotor: MotorId[] = [1, 2, 3, 4];
  const [selectedMotorId, setSelectedMotorId] = useState<MotorId>(1);
  const [statuses, setStatuses] = useState<Record<MotorId, MotorStatus>>({} as any);

  useEffect(() => {
    console.log("motors", isGetAllMotor)
    console.log("Selected motor ID:", selectedMotorId);
  }, [selectedMotorId]);
    useEffect(() => {
    let alive = true;

    const poll = async () => {
      try {
        const pairs = await Promise.all(
          isGetAllMotor.map(async (id) => [id, await getStatus(id)] as const)
        );
        if (!alive) return;
        const next: Record<MotorId, MotorStatus> = {} as any;
        for (const [id, s] of pairs) next[id] = s;
        setStatuses(next);
      } catch {
        // ignore
      }
    };

    poll();
    const timer = setInterval(poll, 1000);
    return () => { alive = false; clearInterval(timer); };
  }, [isGetAllMotor.join(',')]);
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     try {
  //       const statuses = await api.getMotorStatuses()
  //       setStatuses(statuses)
  //     } catch (e) {
  //       // ignore
  //     }
  //   }, 3000)
  //   return () => clearInterval(interval)
  // }, [setStatuses])

  // const selectedSequence = selectedMotorIndex !== undefined ? isGetAllMotor?.[selectedMotorIndex] : undefined
  // const selectedStatus = statuses?.[selectedMotorIndex]

  // const onSaveEvents = async (events: MotorEvent[]) => {
  //   if (sequences == null || selectedSequence == undefined) {
  //     return true
  //   }
  //   let success = false
  //   try {
  //     await api.setMotorSequence(selectedSequence.id, { events })
  //     setSequences(sequences.map(m => m.id == selectedSequence.id ? { ...selectedSequence, events } : m))
  //     success = true
  //   } catch (e) {
  //     notifications.show({
  //       id: 'error',
  //       withCloseButton: true,
  //       autoClose: 7000,
  //       title: 'Error updating motor sequence',
  //       message: (e as Error).message,
  //       color: 'red'
  //     })
  //   }
  //   return success
  // }

  if (!statuses?.[selectedMotorId]?.state) {
    return (
      <Alert variant='light' color='red' title='Error loading motor info' icon={<IconExclamationCircle />}>
        <Text c='grey' size='sm'>{statuses?.[selectedMotorId]?.message}</Text>
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
        <Grid.Col span='content'>
           <SegmentedControl
        fullWidth
        value={String(selectedMotorId)}
        onChange={(value) => setSelectedMotorId(parseInt(value, 10) as MotorId)}
        data={isGetAllMotor.map((motorId) => ({
          // pass motorId AND the current status.state to the icon
          label: (
            <MotorIcon
              motorId={motorId}
              status={statuses[motorId]?.state ?? 'error'}  // <-- merges real/mock status
            />
          ),
          value: String(motorId),
        }))}
      />
        </Grid.Col>
      </Grid>
      {
        statuses?.[selectedMotorId]?.state == statuses?.[selectedMotorId]?.message &&
        <Alert variant='light' color='red' title='Motor Connection Error' icon={<IconCircleX />}>
          Could not establish a connection to this motor. Check the connection and power.
        </Alert>
      }
      {/* {
        selectedStatus?.status == Status.UNKNOWN &&
        <Alert variant='light' color='yellow' title='Motor Connection Unknown' icon={<IconHelpCircle />}>
          The connection status of this motor is unknown. Please wait while a connection is established.
          If this persists, try power cycling the unit.
        </Alert>
      } */}
<MotorProgramUI motorId={selectedMotorId}/>
<MotorSettings motorId={selectedMotorId}/>
    </Stack >
  )
}

export default MotorsSection