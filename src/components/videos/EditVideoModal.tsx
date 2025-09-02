import { useState } from 'react'
import { Modal, Button, Stack, Group, TextInput, Box, LoadingOverlay } from '@mantine/core'

import { Video } from '../../api'

export interface EditVideoModalProps {
  video: Video
  opened: boolean
  loading: boolean
  close: () => void
  onEditSaved: (video: Video) => void
}

export const EditVideoModal = ({ video, opened, loading, close, onEditSaved }: EditVideoModalProps) => {
  const [title, setTitle] = useState(video.title)

  const trimmedTitle = title.trim()
  const readyToSubmit = trimmedTitle != '' && trimmedTitle != video.title

  const submit = () => {
    onEditSaved({
      ...video,
      title: trimmedTitle
    })
  }

  return (
    <Modal size='md' opened={opened} onClose={close} title='Edit Video'>
      <Box pos='relative'>
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'green' }} />
        <Stack>
          <TextInput
            data-autofocus
            label='Title'
            variant='filled'
            placeholder='Video Title'
            value={title}
            onChange={event => setTitle(event.currentTarget.value)} />
          <Group justify='flex-end'>
            <Button variant='subtle' color='grey' onClick={close}>Cancel</Button>
            <Button variant='light' onClick={submit} disabled={!readyToSubmit}>Save</Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}

export default EditVideoModal


