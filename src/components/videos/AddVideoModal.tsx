
import { useState } from 'react'

import { Modal, Button, Stack, Group, FileButton, Pill, TextInput, Box, LoadingOverlay } from '@mantine/core'
import { IconUpload } from '@tabler/icons-react'

export interface AddVideoModalProps {
  opened: boolean
  loading: boolean
  close: () => void
  onVideoAdded: (title: string, file: File) => void
}

export const AddVideoModal = ({ opened, loading, close, onVideoAdded }: AddVideoModalProps) => {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const readyToSubmit = file != null && title.trim() != ''

  const clearFile = () => {
    setFile(null)
  }

  const submit = () => {
    if (readyToSubmit) {
      onVideoAdded(title, file)
      setTitle('')
      setFile(null)
    }
  }

  return (
    <Modal size='md' opened={opened} onClose={close} title='Add Video'>
      <Box pos='relative'>
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'green' }} />
        <Stack>
          <TextInput
            data-autofocus
            // label='Title'
            variant='filled'
            placeholder='Video Title'
            value={title}
            onChange={event => setTitle(event.currentTarget.value)} />
          {file ?
            <Group>
              <Pill withRemoveButton onRemove={clearFile}>{file.name}</Pill>
            </Group>
            :
            <FileButton accept='video/mp4 video/webm video/ogg' onChange={setFile}>
              {props => <Button {...props} leftSection={<IconUpload size={14} />} size='sm' variant='light'>
                Add File
              </Button>}
            </FileButton>
          }
          <Group justify='flex-end'>
            <Button disabled={!readyToSubmit} variant='light' onClick={submit}>Submit</Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}

export default AddVideoModal
