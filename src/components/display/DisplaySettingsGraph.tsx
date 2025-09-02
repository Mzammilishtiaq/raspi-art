import { Accordion } from '@mantine/core'
import { ChartReferenceLineProps, LineChart } from '@mantine/charts'
import { MAX_BRIGHTNESS, DisplayConfigValue, MAX_CONTRAST } from '../../api'
import { useMemo } from 'react'
import { AMBIENT_LIGHT_NUM_DECIMALS, MAX_READABLE_AMBIENT_LIGHT, normalizedToReadableAmbientLight } from './displayUtils'

/**
 * This assumes data is sorted by ambientLight and has no duplicate ambientLight values.
 */
const generateChartData = (data: DisplayConfigValue[]) => {
  if (data.length == 0) {
    return []
  }

  const chartData = [...data]
  if (chartData[0].ambientLight != 0) {
    chartData.unshift({
      ...chartData[0],
      ambientLight: 0
    })
  }

  if (chartData[chartData.length - 1].ambientLight != 1) {
    chartData.push({
      ...chartData[chartData.length - 1],
      ambientLight: 1
    })
  }

  return chartData.map(dataPoint => ({
    ...dataPoint,
    ambientLight: normalizedToReadableAmbientLight(dataPoint.ambientLight).toFixed(AMBIENT_LIGHT_NUM_DECIMALS)
  }))
}

export interface DisplaySettingsGraphProps {
  configValues: DisplayConfigValue[]
  ambientLight: number | null
}

export const DisplaySettingsGraph = ({ configValues, ambientLight }: DisplaySettingsGraphProps) => {
  const chartData = useMemo(() => generateChartData(configValues ?? []), [configValues])
  const referenceLines: ChartReferenceLineProps[] = ambientLight != null
    ? [{ x: normalizedToReadableAmbientLight(ambientLight).toFixed(AMBIENT_LIGHT_NUM_DECIMALS), label: 'Current ambient light' }]
    : []
  return (
    <Accordion radius='md'>
      <Accordion.Item key='graph' value='graph'>
        <Accordion.Control>Graph</Accordion.Control>
        <Accordion.Panel>
          <LineChart
            h={300}
            data={chartData}
            dataKey='ambientLight'
            xAxisLabel='Ambient Light'
            yAxisLabel='Settings'
            yAxisProps={{ domain: [0, Math.max(MAX_BRIGHTNESS, MAX_CONTRAST)], type: 'number' }}
            xAxisProps={{ domain: [0, MAX_READABLE_AMBIENT_LIGHT], type: 'number' }}
            withLegend
            series={[
              { name: 'brightness', label: 'Brightness', color: 'green.6' },
              { name: 'contrast', label: 'Contrast', color: 'blue.6' },
            ]}
            referenceLines={referenceLines}
            curveType='linear'
          />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}

export default DisplaySettingsGraph
