import { Calibration, DisplayConfigValue } from '../../api'

export const MAX_RAW_AMBIENT_LIGHT = 4294967295 // 2 ^ 32 - 1
export const MAX_READABLE_AMBIENT_LIGHT = 100
export const AMBIENT_LIGHT_STEP = 0.01
export const AMBIENT_LIGHT_NUM_DECIMALS = 2
export const AMBIENT_LIGHT_SUFFIX = '%'

interface HasAmbientLight {
  ambientLight: any
}

export const mapWithSeen = <T, U extends HasAmbientLight>(data: U[], func: (item: U, index: number, seen: boolean) => T): T[] => {
  const seenAmbientLightValues = new Set()
  return data.map((item, index) => {
    const { ambientLight } = item
    const seen = seenAmbientLightValues.has(ambientLight)
    if (!seen) {
      seenAmbientLightValues.add(ambientLight)
    }
    return func(item, index, seen)
  })
}

export const toNumber = (value: number | string, defaultValue = NaN): number => {
  const parsed = typeof value == 'string' ? parseFloat(value) : value
  return isNaN(parsed) ? defaultValue : parsed
}

export const normalizedToReadableAmbientLight = (normalized: number) => {
  return normalized * MAX_READABLE_AMBIENT_LIGHT
}

export const readableToNormalizedAmbientLight = (readable: number) => {
  return readable / MAX_READABLE_AMBIENT_LIGHT
}

/**
 * Normalizes the raw ambient light values using the specified sensor
 * calibration.
 * @param raw Raw sensor value (from 0 to 2^32 -1).
 * @param calibration Calibration to use when normalizing.
 * @returns Normalized ambient light value between 0 and 1.
 */
export const rawTormalizedAmbientLight = (raw: number, calibration: Calibration) => {
  const normalized  = (raw - calibration.min) / (calibration.max - calibration.min)
  if (normalized < 0) {
    return 0
  }
  if (normalized > 1) {
    return 1
  }
  return normalized
}

/**
 * Converts a normalized ambient light value to a raw sensor value using
 * the specified calibration.
 * @param normalized Normalized ambient light value (from 0 to 1).
 * @param calibration Calibration to use when converting.
 * @returns Raw sensor value (between 0 and 2^32 - 1).
 */
export const normalizedToRawAmbientLight = (normalized: number, calibration: Calibration) => {
  const raw = Math.round(normalized * (calibration.max - calibration.min) + calibration.min)
  if (raw < 0) {
    return 0
  }
  if (raw > MAX_RAW_AMBIENT_LIGHT) {
    return MAX_RAW_AMBIENT_LIGHT
  }
  return raw
}

const bisectLeft = (array: number[], value: number) => {
  let lowIndex = 0
  let highIndex = array.length
  while (lowIndex < highIndex) {
    const mid = (lowIndex + highIndex) >> 1;
    if (array[mid] < value) {
      lowIndex = mid + 1;
    } else {
      highIndex = mid;
    }
  }
  return lowIndex;
}

/**
 * Interpolates between points p1 and p2 based on value x.
 * Returns an integer by rounding the interpolation output.
 */
const interpolate = (p1: [number, number], p2: [number, number], x: number): number => {
  const slope = (p2[1] - p1[1]) / (p2[0] - p1[0])
  return Math.round(slope * (x - p1[0]) + p1[1])
}

/**
 * This assumes configValues is sorted by ambientLight and contains no duplicate ambientLight values.
 */
export const calculateBrightnessAndContrast = (ambientLight: number | null, configValues: DisplayConfigValue[]): DisplayConfigValue | null => {
  if (ambientLight == null || configValues.length == 0) {
    return null
  }

  const ambientLightValues = configValues.map(value => value.ambientLight)

  if (ambientLight <= configValues[0].ambientLight) {
    return configValues[0]
  }

  if (ambientLight >= configValues[configValues.length - 1].ambientLight) {
    return configValues[configValues.length - 1]
  }

  const rightIndex = bisectLeft(ambientLightValues, ambientLight)
  const rightValue = configValues[rightIndex]
  const leftValue = configValues[rightIndex - 1]

  return {
    ambientLight: ambientLight,
    brightness: interpolate(
      [leftValue.ambientLight, leftValue.brightness],
      [rightValue.ambientLight, rightValue.brightness],
      ambientLight
    ),
    contrast: interpolate(
      [leftValue.ambientLight, leftValue.contrast],
      [rightValue.ambientLight, rightValue.contrast],
      ambientLight
    )
  }
}
