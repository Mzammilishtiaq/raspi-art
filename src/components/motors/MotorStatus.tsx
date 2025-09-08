// components/MotorStatusItem.tsx
import { Card, Group, Stack, Text, Progress, Tooltip } from '@mantine/core';
import MotorIcon from './MotorIcon';
import { getStatus,putStatus} from '../../services/api/motors/status';
import type { MotorId } from '../../services/api/motors/types/motortype';

export function MotorStatusItem({ motorId }: { motorId: MotorId }) {
  const { status, loading } = useMotorStatus(motorId);

  if (loading || !status) return <Text c="dimmed">Loading motor {motorId}…</Text>;

  const pct = status.speed && status.speed > 0 ? Math.min(100, Math.abs((status.speed / 100000) * 100)) : 0;

  return (
    <Card withBorder padding="sm">
      <Group justify="space-between" align="center">
        <MotorIcon motorId={motorId} status={status.state} />
        <Tooltip label={status.message ?? 'OK'}>
          <Text fw={600} tt="capitalize">{status.state}</Text>
        </Tooltip>
      </Group>

      <Stack gap={4} mt="sm">
        <Text size="sm">Step: {status.step_index ?? '-'}</Text>
        <Text size="sm">Elapsed: {status.elapsed_s?.toFixed?.(1) ?? 0}s</Text>
        <Text size="sm">Pos: {Math.round(status.position_deg ?? 0)}°</Text>
        <Text size="sm">Speed: {status.speed ?? 0} rpm</Text>
        <Progress value={pct} mt={6} />
      </Stack>
    </Card>
  );
}
