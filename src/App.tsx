import { MantineProvider, Stack, createTheme, TextInput, rem, Grid } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/charts/styles.css'

import './App.css'

import MotorsSection from './components/motors/MotorsSection'
import VideoSection from './components/videos/VideoSection'
import DisplaySection from './components/display/DisplaySection'
import NetworkSection from './components/networks/NetworksSection'

const theme = createTheme({
  primaryColor: 'green',
  fontSizes: {
    xl: rem(30),
  },
  components: {
    TextInput: TextInput.extend({
      styles: {
        input: { fontSize: '1rem' }
      }
    })
  }
})

export const App = () => (
  <MantineProvider theme={theme}>
    <Notifications />
      <Stack p={40}>
        <Grid >
          <Grid.Col span={6}><NetworkSection /></Grid.Col>
          <Grid.Col span={6}><DisplaySection /></Grid.Col>
          <Grid.Col span={6}><VideoSection /></Grid.Col>
          <Grid.Col span={6}><MotorsSection /></Grid.Col>
        </Grid>
      </Stack>
        {/* <Space /> */}
        {/* <Divider /> */}
  </MantineProvider>
)

export default App
