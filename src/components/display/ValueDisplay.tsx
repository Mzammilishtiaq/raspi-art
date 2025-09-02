import { Group, MantineSize, NumberFormatter, Progress, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core'
import { IconExclamationCircle } from '@tabler/icons-react'
import { AMBIENT_LIGHT_NUM_DECIMALS, AMBIENT_LIGHT_SUFFIX } from './displayUtils'

export interface ValueDisplayProps {
  label: string
  value: number | null
  maxValue: number
  valueSize: MantineSize
  errorMessage: string
  showProgressBar?: boolean
}

export const ValueDisplay = ({ label, value, maxValue, valueSize, errorMessage, showProgressBar = true }: ValueDisplayProps) => (
  <Stack gap={0}>
    <Text size={valueSize} pb={0}>
      {value != null ?
        <NumberFormatter
          value={value}
          thousandSeparator=','
          decimalScale={AMBIENT_LIGHT_NUM_DECIMALS}
          suffix={AMBIENT_LIGHT_SUFFIX} />
        :
        '--'
      }
    </Text>
    {showProgressBar &&
      <Progress
        w='50%'
        size='sm'
        transitionDuration={200}
        value={(value ?? 0) / maxValue * 100} />
    }
    <Group gap={0} >
      <Text c='dimmed'>{label}</Text>
      {value == null &&
        <Tooltip
          label={errorMessage}
          position='bottom'
          events={{ hover: true, focus: true, touch: true }}>
          <ThemeIcon c='red' variant='white' radius='xl'>
            <IconExclamationCircle size={16} />
          </ThemeIcon>
        </Tooltip>
      }
    </Group>
  </Stack>
)

export default ValueDisplay