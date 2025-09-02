
import { useEffect, useMemo, useState } from 'react'

import { Modal, Button, Stack, Group, Box, LoadingOverlay, Text, Loader, Switch, NumberInput, Divider } from '@mantine/core'
import { Calibration } from '../../api'
import { MAX_RAW_AMBIENT_LIGHT, toNumber } from './displayUtils'
import CurrentLightLevelGraph from './CurrentLightLevelGraph'
import { INPUT_STEP_DELAY, INPUT_STEP_INTERVAL } from '../../constants'
import { useMediaQuery } from '@mantine/hooks'
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react'

const HISTORY_MAX_LENGTH = 50

export interface CalibrateLightSensorModalProps {
  opened: boolean
  loading: boolean
  ambientLight: number | null
  calibration: Calibration | null
  close: () => void
  onCalibrationChanged: (calibration: Calibration) => void
}

export const CalibrateLightSensorModal = ({ opened, loading, ambientLight, calibration, close, onCalibrationChanged }: CalibrateLightSensorModalProps) => {
  const [min, setMin] = useState<number | string>(calibration?.min ?? '')
  const [max, setMax] = useState<number | string>(calibration?.max ?? '')
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [isAdvancedView, setIsAdvancedView] = useState(false)
  const isMobile = useMediaQuery('(max-width: 50em)');
  const [ambientLightHistory, setAmbientLightHistory] = useState([ambientLight])
  const receivingSensorData = useMemo(
    () => ambientLightHistory.filter(v => v != null).length > 0,
    [ambientLightHistory, setAmbientLightHistory]
  )

  const sanitizedMin = toNumber(min)
  const sanitizedMax = toNumber(max)
  const maxUnderMin = sanitizedMax <= sanitizedMin

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!opened) {
        clearInterval(interval)
        return
      }

      if (isCalibrating && ambientLight != null) {
        if (isNaN(sanitizedMin) || ambientLight < sanitizedMin) {
          setMin(ambientLight)
        }
        if (isNaN(sanitizedMax) || ambientLight > sanitizedMax) {
          setMax(ambientLight)
        }
      }

      if (ambientLightHistory.length < HISTORY_MAX_LENGTH) {
        setAmbientLightHistory([...ambientLightHistory, ambientLight])
      } else {
        setAmbientLightHistory([...ambientLightHistory.slice(1), ambientLight])
      }
    }, 100)
    return () => clearInterval(interval)
  }, [ambientLight, opened, ambientLightHistory, setAmbientLightHistory, setMin, setMax,])

  const minInBounds = sanitizedMin <= MAX_RAW_AMBIENT_LIGHT && sanitizedMin >= 0
  const maxInBounds = sanitizedMax <= MAX_RAW_AMBIENT_LIGHT && sanitizedMax >= 0
  const calibrationValid =
    !isNaN(sanitizedMin)
    && !isNaN(sanitizedMax)
    && minInBounds
    && maxInBounds
    && !maxUnderMin

  const calibrationChanged = calibration?.min != sanitizedMin || calibration?.max != sanitizedMax
  const readyToSubmit = calibrationValid && calibrationChanged && !isCalibrating

  const save = () => {
    if (readyToSubmit) {
      onCalibrationChanged({
        min: sanitizedMin,
        max: sanitizedMax
      })
      close()
    }
  }

  const startCalibrating = () => {
    setMin('')
    setMax('')
    setIsCalibrating(true)
  }

  const handleClose = () => {
    setIsCalibrating(false)
    setMin(calibration?.min ?? '')
    setMax(calibration?.max ?? '')
    close()
  }

  const createInfoText = () => {
    if (isCalibrating) {
      return (
        <Group>
          Calibrating
          <Loader type='dots' />
        </Group>
      )
    }
    if (!receivingSensorData) {
      return (
        <Group gap={5}>
          <Text c='red'>Not receiving sensor data</Text>
          <IconExclamationCircle size={16} color='var(--mantine-color-red-filled)' />
        </Group>
      )
    }
    if (readyToSubmit) {
      return (
        <Group gap={5}>
          <Text>Calibration updated</Text>
          <IconCircleCheck size={16} color='var(--mantine-color-green-filled)' />
        </Group>
      )
    }
    return undefined
  }

  const actionButton = isCalibrating
    ? <Button color='red' onClick={() => setIsCalibrating(false)}>Stop Calibration</Button>
    : <Button onClick={startCalibrating} disabled={!receivingSensorData}>Start Calibration</Button>

  const infoText = createInfoText()

  return (
    <Modal
      size='lg'
      fullScreen={isMobile}
      opened={opened}
      onClose={handleClose}
      title='Calibrate Light Sensor'>
      <Box pos='relative'>
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'green' }} />
        <Stack>
          <Text size='sm'>
            Click the button below to start calibrating the light sensor. Once calibration starts,
            expose the sensor to the lowest and highest levels of light you want to handle. The lowest
            light level will be mapped to 0% and the highest level to 100%. When you are done, click Stop
            Calibrating to stop reading sensor data and Save to save the calibration.
          </Text>
          <Group>
            {actionButton}
            {infoText}
          </Group>
          <Switch
            checked={isAdvancedView}
            onChange={e => setIsAdvancedView(e.currentTarget.checked)}
            label='Advanced View'
          />
          {isAdvancedView &&
            <Stack>
              <Divider />
              <Text size='sm'>
                The light sensor outputs raw light values ranging from 0 to 4,294,967,295. Calibration
                captures these values and scales them between 0% and 100% based on your ambient light
                levels. You can also manually enter the min and max values below.
              </Text>
              <Group>
                <NumberInput
                  min={0}
                  max={MAX_RAW_AMBIENT_LIGHT}
                  allowDecimal={true}
                  decimalScale={2}
                  allowNegative={false}
                  stepHoldDelay={INPUT_STEP_DELAY}
                  stepHoldInterval={INPUT_STEP_INTERVAL}
                  error={!isCalibrating && (isNaN(sanitizedMin) || maxUnderMin || !minInBounds)}
                  value={min}
                  label='Minimum Ambient Light'
                  disabled={isCalibrating}
                  onChange={setMin}
                />
                <NumberInput
                  min={0}
                  max={MAX_RAW_AMBIENT_LIGHT}
                  allowDecimal={true}
                  decimalScale={2}
                  allowNegative={false}
                  stepHoldDelay={INPUT_STEP_DELAY}
                  stepHoldInterval={INPUT_STEP_INTERVAL}
                  error={!isCalibrating && (isNaN(sanitizedMax) || maxUnderMin || !maxInBounds)}
                  value={max}
                  label='Maximum Ambient Light'
                  disabled={isCalibrating}
                  onChange={setMax}
                />
              </Group>
              {(!isCalibrating && maxUnderMin) &&
                <Text size='sm' c='red'>The max value must be greater than the min.</Text>
              }
              <CurrentLightLevelGraph
                ambientLightValues={ambientLightHistory}
                min={sanitizedMin}
                max={sanitizedMax}
              />
            </Stack>
          }

          <Group justify='flex-end'>
            <Button disabled={!readyToSubmit} variant='light' onClick={save}>Save</Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}

export default CalibrateLightSensorModal
