// MotorStatus.tsx
import { useEffect, useState } from 'react';
import { getStatus } from '../../services/api/motors/status';
import { MotorStatus as MotorStatusType, MotorId } from '../../services/api/motors/types/motortype';
import { Stack, Table } from '@mantine/core';

const MotorStatus = ({ motorId }: { motorId: MotorId }) => {
  const [status, setStatus] = useState<MotorStatusType | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const motorStatus = await getStatus(motorId);
        setStatus(motorStatus);
      } catch (error) {
        console.error('Error fetching motor status:', error);
      }
    };

    fetchStatus();
  }, [motorId]);

  if (!status) {
    return <div>Loading motor status...</div>;
  }

  return (
<Stack>
      <h3>Motor {motorId} Status</h3>
    <Table>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td fw={600}>State</Table.Td>
          <Table.Td bg={
            status.state==='running'?'green':
            status.state==='stopped'?'red':
            status.state==='error'?'red':
            status.state==='paused'?'yellow':
            status.state==='idle'?'gray':
            'blue'
          } w={100} ta={'center'} c={'white'} style={{borderRadius: '50px'}} mb={5}>{status.state}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>Step Index</Table.Td>
          <Table.Td>{status.step_index}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>Elapsed Time</Table.Td>
          <Table.Td>{status.elapsed_s} seconds</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>Position</Table.Td>
          <Table.Td>{status.position_deg}°</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>Speed</Table.Td>
          <Table.Td>{status.speed} rpm</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
</Stack>
  );
};

export default MotorStatus;
