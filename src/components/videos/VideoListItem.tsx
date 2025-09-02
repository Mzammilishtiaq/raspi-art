
import { Text, Group, Pill } from '@mantine/core'

import { Video } from '../../api'
import MoreMenu from '../MoreMenu'

export interface VideoListItemProps {
  video: Video
  isPlaying: boolean
  onSelected: () => void
  onEditClicked: () => void
  onDeleteClicked: () => void
}

export const VideoListItem = ({ video, isPlaying, onSelected, onEditClicked, onDeleteClicked }: VideoListItemProps) => (
  <Group justify='space-between' className='pressable' py={5} onClick={onSelected}>
    <Text>{video.title}</Text>
    <Group>
      {isPlaying && <Pill variant='default'>Now Playing</Pill>}
      <MoreMenu onEdit={onEditClicked} onDelete={onDeleteClicked} />
    </Group>
  </Group>
)
