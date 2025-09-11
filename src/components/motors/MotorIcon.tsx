import { Box, Center } from '@mantine/core';
import { IconCircleCheckFilled, IconCircleDashed, IconCircleXFilled, IconClockStop, IconHelpCircleFilled, IconPlayerPauseFilled } from '@tabler/icons-react';

export const MotorIcon = ({ motorId, status }: { motorId: number; status: string }) => {
  const iconSize = 16;
  const icon =
    (status === 'error')
      ? <IconCircleXFilled color="var(--mantine-color-red-filled)" size={iconSize} />
      : (status === 'running')
        ? <IconCircleCheckFilled color="var(--mantine-color-green-filled)" size={iconSize} />
        : (status === 'idle')
          ? <IconCircleDashed color="var(--mantine-color-gray-filled)" size={iconSize} />
          : (status === 'paused')
            ? <IconPlayerPauseFilled color="var(--mantine-color-yellow-filled)" size={iconSize} />
            : (status === 'stopped')
              ? <IconClockStop color='var(--mantine-color-red-filled)' size={iconSize} />
              : <IconHelpCircleFilled color="var(--mantine-color-yellow-filled)" size={iconSize} />;

  return (
    <Center>
      {icon}
      <Box ml={5}>{motorId}</Box>
    </Center>
  );
};

export default MotorIcon;
