import { Modal, Button, Stack, Text, Group, Box, LoadingOverlay } from '@mantine/core';
import { Video } from '../../api';

export interface ConfirmDeleteModelProps {
  video: Video
  opened: boolean
  loading: boolean
  close: () => void
  onConfirmDelete: () => void
}

export const ConfirmDeleteModal = ({ video, opened, loading, close, onConfirmDelete }: ConfirmDeleteModelProps) => (
  <Modal size='md' opened={opened} onClose={close} title='Delete Video?'>
    <Box pos='relative'>
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'green' }} />
      <Stack>
        <Text>
          Are you sure you want to delete <b>{video.title}</b>?
        </Text>
        <Group justify='flex-end'>
          <Button variant='subtle' color='grey' onClick={close}>Cancel</Button>
          <Button variant='light' color='red' onClick={onConfirmDelete}>Delete</Button>
        </Group>
      </Stack>
    </Box>
  </Modal>
)

export default ConfirmDeleteModal