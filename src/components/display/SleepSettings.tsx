import { Group, NumberFormatter, NumberInput, Text } from '@mantine/core'
import { INPUT_STEP_DELAY, INPUT_STEP_INTERVAL } from '../../constants'
import { AMBIENT_LIGHT_NUM_DECIMALS, AMBIENT_LIGHT_STEP, AMBIENT_LIGHT_SUFFIX, MAX_READABLE_AMBIENT_LIGHT, toNumber } from './displayUtils'

export interface SleepSettingsProps {
  isEditing: boolean
  duration: number | string | undefined
  threshold: number | string | undefined
  onDurationChanged: (value: number | string) => void
  onThresholdChanged: (value: number | string) => void
}

export const SleepSettings = ({ isEditing, duration, threshold, onDurationChanged, onThresholdChanged }: SleepSettingsProps) => {
  return (
    <Group>
      {isEditing ?
        <>
          <NumberInput
            label='Sleep display after'
            suffix=' minutes'
            min={1}
            allowDecimal={false}
            allowNegative={false}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            error={isNaN(toNumber(duration ?? NaN))}
            value={duration}
            onChange={onDurationChanged} />
          <NumberInput
            label='Ambient light threshold'
            min={0}
            max={MAX_READABLE_AMBIENT_LIGHT}
            step={AMBIENT_LIGHT_STEP}
            decimalScale={AMBIENT_LIGHT_NUM_DECIMALS}
            allowNegative={false}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            error={isNaN(toNumber(threshold ?? NaN))}
            value={threshold}
            suffix={AMBIENT_LIGHT_SUFFIX}
            onChange={value => onThresholdChanged(value)} />
        </>
        :
        <Text>
          <strong>Sleep:</strong> after {duration} minute{duration != 1 && 's'} of ambient light
          less than <NumberFormatter
            value={threshold}
            thousandSeparator=','
            decimalScale={AMBIENT_LIGHT_NUM_DECIMALS}
            suffix={AMBIENT_LIGHT_SUFFIX}
          />.
        </Text>
      }
    </Group>
  )
}

export default SleepSettings
