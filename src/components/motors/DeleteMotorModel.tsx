import { Modal, Stack, Box, LoadingOverlay, Button, Text} from '@mantine/core';

export interface AddVideoModalProps {
    opened: boolean
    loading: boolean
    close: () => void
    onDelete: (title: string, file: File) => void
}

export const AddVideoModal = ({ opened, loading, close}: AddVideoModalProps) => {

    return (
        <Modal size='md' opened={opened} onClose={close}  centered withCloseButton={false}>
            <Box pos='relative'>
                <LoadingOverlay
                    visible={loading}
                    zIndex={1000}
                    overlayProps={{ radius: 'sm', blur: 2 }}
                    loaderProps={{ color: 'green' }} />
                <Stack>
                    <Text fw={600}>Are you confirm delete setting item</Text>
                    <Button.Group>
                        <Button variant='filled' color='green'>Cancel</Button>
                        <Button variant='light' color='red' ml={10}>Delete</Button>
                    </Button.Group>
                </Stack>
            </Box>
        </Modal>
    )
}

export default AddVideoModal;