import { Box, Center } from '@mantine/core'
import { IconCircleCheckFilled, IconCircleXFilled, IconHelpCircleFilled } from '@tabler/icons-react'

import { MotorStatus, Status } from '../../api'

export interface MotorIconProps {
  status: MotorStatus
}

const iconSize = 16

export const MotorIcon = ({ status }: MotorIconProps) => (
  <Center>
    {status.status == Status.OK
      ? <IconCircleCheckFilled color='var(--mantine-color-green-filled)' size={iconSize} />
      : status.status == Status.ERROR
        ? <IconCircleXFilled color='var(--mantine-color-red-filled)' size={iconSize} />
        : <IconHelpCircleFilled color='var(--mantine-color-yellow-filled)' size={iconSize} />
    }
    <Box ml={5}>{status.id}</Box>
  </Center>
)

export default MotorIcon