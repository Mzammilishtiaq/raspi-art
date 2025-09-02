import { CloseButton, Grid, Text, Tooltip } from '@mantine/core'
import { Video } from '../../api'

export interface NowPlayingSectionProps {
  video: Video | null
  onStopClicked: () => void
}

export const NowPlayingSection = ({ video, onStopClicked }: NowPlayingSectionProps) => (

  <Grid align='center'>
    <Grid.Col span='auto'>
      <Text c={video ? 'black' : 'grey'} fw={700}>{video ? video.title : 'No Video Playing'}</Text>
      <Text size='xs' c='dimmed'>
        {video ? 'Now Playing' : 'Click a video below to start playing'}
      </Text>
    </Grid.Col>
    {video &&
      <Grid.Col span='content'>
        <Tooltip label='Stop playing' openDelay={500}>
          <CloseButton radius='xl' onClick={onStopClicked} />
        </Tooltip>
      </Grid.Col>
    }
  </Grid>
)

export default NowPlayingSection