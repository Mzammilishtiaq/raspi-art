import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, CloseButton, Divider, Flex, Group, NumberFormatter, NumberInput, Skeleton, Stack, Table, Text, ThemeIcon, Title, Tooltip } from '@mantine/core'
import { useDisclosure, useThrottledValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAdjustments, IconDeviceComputerCamera, IconDeviceDesktop, IconEdit, IconExclamationCircle, IconPlus, IconSortDescending } from '@tabler/icons-react'

import useAsync from '../../useAsync'
import * as api from '../../api'
import { Calibration, DisplayConfigValue, DisplaySettings, MAX_BRIGHTNESS, MAX_CONTRAST } from '../../api'
import { INPUT_STEP_DELAY, INPUT_STEP_INTERVAL } from '../../constants'
import { AMBIENT_LIGHT_NUM_DECIMALS, AMBIENT_LIGHT_STEP, AMBIENT_LIGHT_SUFFIX, calculateBrightnessAndContrast, mapWithSeen, MAX_READABLE_AMBIENT_LIGHT, readableToNormalizedAmbientLight, toNumber, normalizedToReadableAmbientLight, rawTormalizedAmbientLight } from './displayUtils'


import ValueDisplay from './ValueDisplay'
import SleepSettings from './SleepSettings'
import DisplaySettingsGraph from './DisplaySettingsGraph'
import CalibrateLightSensorModal from './CalibrateLightSensorModal'
import classes from './style/display.module.css'
const DUPLICATE_VALUE_MESSAGE = 'Duplicate value. Row will be ignored.'
const INVALID_VALUE_MESSAGE = 'Invalid value. Row will be ignored.'

const NO_LIGHT_SENSOR_DATA_ERROR = 'Light sensor data not receieved.'
const INVALID_SETTINGS_ERROR = 'Invalid configuration'

const alignCellsTopStyle = { verticalAlign: 'top' }

/**
 * Represents a version of DisplayConfigValue used during user input.
 * Values may be invalid or non-numbers. This is needed to nicely handle
 * user input (e.g. not adding arbitrary zeros when the user deletes all
 * of the text in a number input).
 */
interface InternalDisplayConfigValue {
  ambientLight: number | string
  brightness: number | string
  contrast: number | string
}

interface InternalDisplaySettings {
  sleep: {
    duration: number | string
    threshold: number | string
  },
  calibration: Calibration | null
  configValues: InternalDisplayConfigValue[]
}

interface SanitizedDisplaySettings {
  sleep: {
    duration: number
    threshold: number
  },
  calibration: Calibration | null
  configValues: DisplayConfigValue[]
}

/**
 * Synchronized internal settings for UI edits and actual updates / calculations:
 * 
 * - internal: Used during for UI edits. These values are not sorted, may contain
 *   non-number values / duplicates, etc.
 * 
 * - external: Used during API updates. These values are not sorted, may contain
 *   NaN / null values, and duplicates. Hpwever, these values are all numbers (no
 *   strings). This allows the backend to persist invalid configurations so changes
 *   are not lost when refreshing the page / clicking "done". This also means that
 *   the hardware interface needs to sanitize on its end though (for now, unless we
 *   add that functionality to the server).
 * 
 * - sanitized: Used for generating graphs and calculating current contrast / brightness.
 *   These values are sorted, do not have duplicates, and only contain valid data.
 */
interface CombinedSettings {
  internal: InternalDisplaySettings
  external: DisplaySettings
  sanitized: SanitizedDisplaySettings
}

const sortConfigValues = (copnfigValues: InternalDisplayConfigValue[]) => {
  const copy = [...copnfigValues]
  copy.sort((a, b) => {
    const aAmbientLight = toNumber(a.ambientLight)
    const bAmbientLight = toNumber(b.ambientLight)
    const aIsNaN = isNaN(aAmbientLight)
    const bIsNaN = isNaN(bAmbientLight)
    if (aIsNaN && !bIsNaN) {
      return -1
    }
    if (!aIsNaN && bIsNaN) {
      return 1
    }
    return aAmbientLight - bAmbientLight
  })
  return copy
}

/**
 * Directly maps sanitized settings to internal settings. This is used during initial loading.
 */
const mapToInternalDisplaySettings = (settings: DisplaySettings): InternalDisplaySettings => ({
  ...settings,
  sleep: {
    ...settings.sleep,
    threshold: normalizedToReadableAmbientLight(settings.sleep.threshold)
  },
  configValues: sortConfigValues(
    settings.configValues.map(configValue => ({
      ambientLight: configValue.ambientLight == null ? '' : normalizedToReadableAmbientLight(configValue.ambientLight),
      brightness: configValue.brightness ?? '',
      contrast: configValue.contrast ?? ''
    }))
  )
})

const getInternalDisplaySettings = async (): Promise<CombinedSettings> => {
  const external = await api.getDisplaySettings()
  return {
    internal: mapToInternalDisplaySettings(external),
    external,
    sanitized: sanitizeDisplaySettings(external)
  }
}

/**
 * 
 * Maps internal settings to external settings, using the current external settings as
 * a baseline. Invalid sleep values in the internal settings will be discarded, using the
 * current sanitized values instead.
 * 
 * The display config values are converted to numbers and normalized but not sanitized or
 * filtered any further. The result config values may have duplicate ambientLight values or
 * NaN values.
 */
const mapToExternalDisplaySettings = (internal: InternalDisplaySettings, currentExternal: DisplaySettings): DisplaySettings => {
  const sleep = {
    duration: toNumber(internal.sleep.duration, currentExternal.sleep.duration),
    threshold: readableToNormalizedAmbientLight(
      toNumber(
        internal.sleep.threshold,
        normalizedToReadableAmbientLight(currentExternal.sleep.threshold)
      )
    ),
  }

  const configValues = internal.configValues
    .map(configValue => ({
      ambientLight: toNumber(configValue.ambientLight),
      brightness: toNumber(configValue.brightness),
      contrast: toNumber(configValue.contrast),
    }))
    .map(configValue => ({
      ...configValue,
      ambientLight: readableToNormalizedAmbientLight(configValue.ambientLight)
    }))

  return { ...internal, sleep, configValues }
}

/**
 * Maps settings to sanitized settings.
 * 
 * The display config values are filtered for invalid / duplicate rows and sorted. This ensures
 * consumers (the graph and current value calculations) can assume the incoming data is valid.
 */
const sanitizeDisplaySettings = (settings: DisplaySettings): SanitizedDisplaySettings => {
  // Filter out null or NaN values
  const configValues = settings.configValues
    .map(configValue => {
      // Some TypeScript massaging here
      if (configValue.ambientLight == null || configValue.brightness == null || configValue.contrast == null) {
        return null
      }
      return {
        ambientLight: configValue.ambientLight,
        brightness: configValue.brightness,
        contrast: configValue.contrast
      }
    })
    .filter(v => v != null)
    .filter(v => !isNaN(v.ambientLight) && !isNaN(v.brightness) && !isNaN(v.contrast))

  // Sort and remove duplicates
  configValues.sort((a, b) => a.ambientLight - b.ambientLight)
  const dedupedConfigValues = mapWithSeen(configValues, (dataPoint, _, seen) => ({ ...dataPoint, seen }))
    .filter(dataPoint => {
      const { ambientLight, seen } = dataPoint
      const inBounds = ambientLight >= 0 && ambientLight <= 1
      return !seen && inBounds
    })

  return { ...settings, configValues: dedupedConfigValues }
}

const isValidAndInBounds = (value: number | string, min: number, max: number) => {
  const parsed = toNumber(value)
  return !isNaN(toNumber(value)) && parsed >= min && parsed <= max
}

export const DisplaySection = () => {
  const { value: settings, setValue: setSettings, loading, error, setError } = useAsync(getInternalDisplaySettings, [])
  const { value: rawAmbientLight, setValue: setRawAmbientLight } = useAsync(api.getAmbientLight, [])
  const normalizedAmbientLight = useMemo(() => {
    if (rawAmbientLight == null || settings?.internal?.calibration == null) {
      return null
    }
    return rawTormalizedAmbientLight(rawAmbientLight, settings.internal.calibration)
  }, [rawAmbientLight])
  const throttledSettings = useThrottledValue(settings, 300)
  const [userUpdate, setUserUpdate] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [calibrateOpened, { open: openCalibrateModal, close: closeCalibrateModal }] = useDisclosure(false)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newAmbientLight = await api.getAmbientLight()
        setRawAmbientLight(newAmbientLight)
      } catch (e) {
        setRawAmbientLight(null)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [setRawAmbientLight])

  useEffect(() => {
    if (!userUpdate) {
      return
    }

    const update = async () => {
      if (throttledSettings == null) {
        return
      }
      if (!userUpdate) {
        setUserUpdate(true)
        return
      }
      try {
        await api.setDisplaySettings(throttledSettings.external)
      } catch (e) {
        notifications.show({
          id: 'display-update-error',
          withCloseButton: true,
          autoClose: 7000,
          title: 'Error updating display settings',
          message: (e as Error).message,
          color: 'red'
        })
      }
    }

    update()
  }, [setError, throttledSettings, userUpdate])

  const updateSettings = (internal: InternalDisplaySettings) => {
    if (settings == null) {
      return
    }
    const external = mapToExternalDisplaySettings(internal, settings.external)
    const sanitized = sanitizeDisplaySettings(external)
    setSettings({ internal, external, sanitized })
  }

  const addDataPoint = () => {
    if (settings == null) {
      return
    }
    setUserUpdate(true)
    const internal = {
      ...settings.internal,
      configValues: [
        ...settings.internal.configValues,
        {
          ambientLight: normalizedToReadableAmbientLight(normalizedAmbientLight ?? 0).toFixed(AMBIENT_LIGHT_NUM_DECIMALS),
          brightness: 0,
          contrast: 0
        }
      ]
    }
    updateSettings(internal)
  }

  const sortData = () => {
    if (settings == null) {
      return
    }
    const internal = {
      ...settings.internal,
      configValues: sortConfigValues(settings.internal.configValues)
    }
    updateSettings(internal)
  }

  const stopEditing = () => {
    if (settings == null) {
      return
    }
    const internal = {
      ...settings.internal,
      sleep: {
        duration: toNumber(settings.internal.sleep.duration, settings.external.sleep.duration),
        threshold: toNumber(
          settings.internal.sleep.threshold,
          normalizedToReadableAmbientLight(settings.external.sleep.threshold)
        )
      }
    }
    updateSettings(internal)
    setIsEditing(false)
  }

  const deletePoint = (index: number) => {
    if (settings == null) {
      return
    }
    setUserUpdate(true)
    const internal = {
      ...settings.internal,
      configValues: settings.internal.configValues.filter((_, i) => i != index)
    }
    updateSettings(internal)
  }

  const durationChanged = (value: string | number) => {
    if (settings == null) {
      return
    }
    const duration = toNumber(value)
    setUserUpdate(true)
    const internal = {
      ...settings.internal,
      sleep: {
        ...settings.internal.sleep,
        duration
      }
    }
    updateSettings(internal)
  }

  const thresholdChanged = (value: string | number) => {
    if (settings == null) {
      return
    }
    const threshold = toNumber(value)
    setUserUpdate(true)
    const internal = {
      ...settings.internal,
      sleep: {
        ...settings.internal.sleep,
        threshold
      }
    }
    updateSettings(internal)
  }

  const updatePoint = (partialPoint: Partial<InternalDisplayConfigValue>, index: number) => {
    if (settings == null) {
      return
    }
    setUserUpdate(true)
    const internal = {
      ...settings.internal,
      configValues: settings?.internal.configValues.map((dataPoint, i) => i == index ? { ...dataPoint, ...partialPoint } : dataPoint)
    }
    updateSettings(internal)
  }

  const updateCalibration = (calibration: Calibration) => {
    if (settings == null) {
      return
    }
    setUserUpdate(true)
    const internal = {
      ...settings.internal,
      calibration
    }
    updateSettings(internal)
  }

  const generateTableRows = (data: InternalDisplayConfigValue[]) => mapWithSeen(data, (dataPoint, index, seen) => {
    const ambientLightValid = isValidAndInBounds(dataPoint.ambientLight, 0, 100)
    const brightnessValid = isValidAndInBounds(dataPoint.brightness, 0, 100)
    const contrastValid = isValidAndInBounds(dataPoint.contrast, 0, 100)
    const rowValid = !seen && ambientLightValid && brightnessValid && contrastValid
    const extraProps = !rowValid ? { c: 'red' } : {}

    const ambientLight = isNaN(toNumber(dataPoint.ambientLight))
      ? <>(Empty)</>
      : <NumberFormatter
        value={dataPoint.ambientLight}
        thousandSeparator=','
        decimalScale={AMBIENT_LIGHT_NUM_DECIMALS} />
    const brightness = isNaN(toNumber(dataPoint.brightness)) ? <>(Empty)</> : dataPoint.brightness.toString()
    const contrast = isNaN(toNumber(dataPoint.contrast)) ? <>(Empty)</> : dataPoint.contrast.toString()

    return (
      <Table.Tr key={index}>
        <Table.Td {...extraProps}>
          <Group gap={0}>
            {ambientLight}
            {(ambientLightValid && seen) &&
              <Tooltip
                label={DUPLICATE_VALUE_MESSAGE}
                events={{ hover: true, focus: true, touch: true }}>
                <ThemeIcon c='red' variant='white' radius='xl'>
                  <IconExclamationCircle size={15} />
                </ThemeIcon>
              </Tooltip>
            }
            {!ambientLightValid &&
              <Tooltip
                label={INVALID_VALUE_MESSAGE}
                events={{ hover: true, focus: true, touch: true }}>
                <ThemeIcon c='red' variant='white' radius='xl'>
                  <IconExclamationCircle size={15} />
                </ThemeIcon>
              </Tooltip>
            }
          </Group>
        </Table.Td>
        <Table.Td {...extraProps}>
          <Group gap={0}>
            {brightness}
            {!brightnessValid &&
              <Tooltip
                label={INVALID_VALUE_MESSAGE}
                events={{ hover: true, focus: true, touch: true }}>
                <ThemeIcon c='red' variant='white' radius='xl'>
                  <IconExclamationCircle size={15} />
                </ThemeIcon>
              </Tooltip>
            }
          </Group>
        </Table.Td>
        <Table.Td {...extraProps}>
          <Group gap={0}>
            {contrast}
            {!contrastValid &&
              <Tooltip
                label={INVALID_VALUE_MESSAGE}
                events={{ hover: true, focus: true, touch: true }}>
                <ThemeIcon c='red' variant='white' radius='xl'>
                  <IconExclamationCircle size={15} />
                </ThemeIcon>
              </Tooltip>
            }
          </Group>
        </Table.Td>
      </Table.Tr>
    )
  })

  const generateEditTableRows = (data: InternalDisplayConfigValue[]) => mapWithSeen(data, (dataPoint, index, seen) => {
    const ambientLightValid = isValidAndInBounds(dataPoint.ambientLight, 0, 100)
    const brightnessValid = isValidAndInBounds(dataPoint.brightness, 0, 100)
    const contrastValid = isValidAndInBounds(dataPoint.contrast, 0, 100)

    const ambientLightError = ambientLightValid ? DUPLICATE_VALUE_MESSAGE : INVALID_VALUE_MESSAGE

    return (
      <Table.Tr key={index}>
        <Table.Td style={alignCellsTopStyle}>
          <NumberInput
            min={0}
            max={MAX_READABLE_AMBIENT_LIGHT}
            step={AMBIENT_LIGHT_STEP}
            decimalScale={AMBIENT_LIGHT_NUM_DECIMALS}
            allowNegative={false}
            suffix={AMBIENT_LIGHT_SUFFIX}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            error={(seen || !ambientLightValid) ? ambientLightError : null}
            value={dataPoint.ambientLight}
            onChange={value => updatePoint({ ambientLight: value }, index)}
          />
        </Table.Td>

        <Table.Td style={alignCellsTopStyle}>
          <NumberInput
            min={0}
            max={MAX_BRIGHTNESS}
            allowDecimal={false}
            allowNegative={false}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            error={!brightnessValid ? INVALID_VALUE_MESSAGE : null}
            value={dataPoint.brightness}
            suffix='%'
            onChange={value => updatePoint({ brightness: value }, index)}
          />
        </Table.Td>
        <Table.Td style={alignCellsTopStyle}>
          <NumberInput
            min={0}
            max={MAX_CONTRAST}
            allowDecimal={false}
            allowNegative={false}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            error={!contrastValid ? INVALID_VALUE_MESSAGE : null}
            value={dataPoint.contrast}
            suffix='%'
            onChange={value => updatePoint({ contrast: value }, index)}
          />
        </Table.Td>
        <Table.Td style={{ ...alignCellsTopStyle, paddingTop: 10 }}>
          <Tooltip hidden={data.length <= 1} disabled={data.length <= 1} label='Delete Row'>
            <CloseButton
              hidden={data.length <= 1}
              disabled={data.length <= 1}
              radius='xl'
              onClick={() => deletePoint(index)}
            />
          </Tooltip>
        </Table.Td>
      </Table.Tr>
    )
  })

  if (error) {
    return (
      <Alert variant='light' color='red' title='Error loading screen brightness' icon={<IconExclamationCircle />}>
        <Text c='grey' size='sm'>{error.message}</Text>
      </Alert>
    )
  }

  const calculatedBrightnessAndContrast = settings?.sanitized.configValues != null
    ? calculateBrightnessAndContrast(normalizedAmbientLight, settings.sanitized.configValues)
    : null

  const rows = isEditing
    ? generateEditTableRows(settings?.internal.configValues ?? [])
    : generateTableRows(settings?.internal.configValues ?? [])

  return (
    <>
      <Stack className={classes.displaysection} gap='md' mih={0}>
        <Group justify='space-between'>
          <Flex align={'center'} gap={10}>
            <IconDeviceDesktop size={26} />
            <Title ta='left' order={3}>Display</Title>
          </Flex>
          {isEditing ?
            <Button.Group>
              <Button
                variant='filled'
                onClick={stopEditing}
                loading={loading}>
                Done
              </Button>
            </Button.Group>
            :
            <Button
              variant='subtle'
              leftSection={<IconEdit size={14} />}
              onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          }
        </Group>
        {settings?.internal.calibration != null ?
          <Stack>
            <Group justify='space-between'>
              <Box flex={1}>
                <ValueDisplay
                  label='Ambient Light Level'
                  value={normalizedAmbientLight != null ? normalizedToReadableAmbientLight(normalizedAmbientLight) : null}
                  maxValue={MAX_READABLE_AMBIENT_LIGHT}
                  errorMessage={NO_LIGHT_SENSOR_DATA_ERROR}
                  valueSize='xl' />
              </Box>
              <Button
                variant='subtle'
                rightSection={<IconAdjustments size={16} />}
                onClick={openCalibrateModal}>
                Recalibrate Sensor
              </Button>
            </Group>
            <Group grow={true}>
              <ValueDisplay
                label='Current Brightness'
                value={calculatedBrightnessAndContrast?.brightness ?? null}
                maxValue={100}
                valueSize='lg'
                errorMessage={normalizedAmbientLight == null ? NO_LIGHT_SENSOR_DATA_ERROR : INVALID_SETTINGS_ERROR}
                showProgressBar={false} />
              <ValueDisplay
                label='Current Contrast'
                value={calculatedBrightnessAndContrast?.contrast ?? null}
                maxValue={100}
                valueSize='lg'
                errorMessage={normalizedAmbientLight == null ? NO_LIGHT_SENSOR_DATA_ERROR : INVALID_SETTINGS_ERROR}
                showProgressBar={false} />
            </Group>
          </Stack>
          // <CurrentValues ambientLight={ambientLight ?? null} configValues={settings?.sanitized.configValues ?? null} />
          :
          <Stack>The light sensor has not been calibrated. Click the button below.
            <Group>
              <Button
                rightSection={<IconAdjustments size={16} />}
                onClick={openCalibrateModal}>
                Calibrate Light Sensor
              </Button>
            </Group>
          </Stack>
        }
        {isEditing && <Divider label='Sleep' />}
        <SleepSettings
          isEditing={isEditing}
          duration={settings?.internal.sleep.duration}
          threshold={settings?.internal.sleep.threshold}
          onDurationChanged={durationChanged}
          onThresholdChanged={thresholdChanged} />
        {isEditing && <Divider label='Brightness & Contrast' />}
        <Table withRowBorders={false} stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Ambient Light</Table.Th>
              <Table.Th>Brightness</Table.Th>
              <Table.Th>Contrast</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
          {isEditing &&
            <Table.Caption>
              <Group justify='center'>
                <Button
                  variant='subtle'
                  leftSection={<IconPlus size={14} />}
                  onClick={addDataPoint}>
                  Add Row
                </Button>
                <Button
                  variant='subtle'
                  leftSection={<IconSortDescending size={14} />}
                  onClick={sortData}>
                  Sort Rows
                </Button>
              </Group>
            </Table.Caption>
          }
        </Table>
        <Skeleton visible={loading}>
          <DisplaySettingsGraph
            configValues={settings?.sanitized.configValues ?? []}
            ambientLight={normalizedAmbientLight} />
        </Skeleton>
      </Stack>
      {!loading &&
        <CalibrateLightSensorModal
          opened={calibrateOpened}
          loading={false}
          ambientLight={rawAmbientLight}
          calibration={settings?.internal.calibration ?? null}
          close={closeCalibrateModal}
          onCalibrationChanged={updateCalibration} />
      }
    </>
  )
}

export default DisplaySection
