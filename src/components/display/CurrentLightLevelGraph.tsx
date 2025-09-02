import { ChartReferenceLineProps, LineChart } from '@mantine/charts'
import { useMemo } from 'react'
import { Calibration } from '../../api'
import { MAX_RAW_AMBIENT_LIGHT, rawTormalizedAmbientLight } from './displayUtils'

const BASE_CALIBRATION: Calibration = {
  min: 0,
  max: MAX_RAW_AMBIENT_LIGHT
}

const SCALE_FACTOR = 10000
const MIN_LINE_COLOR = 'blue.6'
const MAX_LINE_COLOR = 'orange.6'

const scaleValue = (ambientLight: number) => rawTormalizedAmbientLight(ambientLight, BASE_CALIBRATION) * SCALE_FACTOR

const generateChartData = (ambientLightValues: (number | null)[]) =>
  ambientLightValues.map(ambientLight => ({
    index: '',
    ambientLight: ambientLight != null ? scaleValue(ambientLight) : null
  }))

export interface CurrentLightLevelGraphProps {
  ambientLightValues: (number | null)[]
  min: number | null
  max: number | null
}

export const CurrentLightLevelGraph = ({ ambientLightValues, min, max }: CurrentLightLevelGraphProps) => {
  const chartData = useMemo(() => generateChartData(ambientLightValues), [ambientLightValues])

  const referenceLinesBase: ChartReferenceLineProps[] = [
    { y: min ?? undefined, label: 'Min', color: MIN_LINE_COLOR, labelPosition: 'insideTopLeft' },
    { y: max ?? undefined, label: 'Max', color: MAX_LINE_COLOR, labelPosition: 'insideBottomLeft' }
  ]
  const referenceLines = referenceLinesBase.filter(line => line.y != undefined)
    .map(line => {
      if (line.y == null) {
        return null
      }
      return { ...line, y: scaleValue(line.y as number) }
    })
    .filter(line => line != null)

  const values = chartData.map(point => point.ambientLight).filter(value => value != null)
  let yMin = Math.min(...values)
  if (min != null) {
    yMin = Math.min(yMin, scaleValue(min))
  }

  let yMax = Math.max(...values)
  if (max != null) {
    yMax = Math.max(yMax, scaleValue(max))
  }

  const range = yMax - yMin
  const buffer = range * 0.1

  yMin = Math.max(yMin - buffer, 0)
  yMax = yMax + buffer

  return (

    <LineChart
      h={200}
      data={chartData}
      withYAxis={false}
      dataKey='index'
      withDots={false}
      yAxisLabel='Light Level'
      yAxisProps={{ domain: [yMin, yMax], type: 'number' }} // domain: [0, 1],
      withLegend
      series={[
        { name: 'ambientLight', label: 'Ambient Light', color: 'green.6' },
      ]}
      referenceLines={referenceLines}
      curveType='monotone'
    />

  )
}

export default CurrentLightLevelGraph
