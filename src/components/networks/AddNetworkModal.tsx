
import { useState } from 'react'

import { Modal, Button, Stack, Group, TextInput, Box, LoadingOverlay } from '@mantine/core'

export interface AddNetworkModalProps {
  opened: boolean
  loading: boolean
  close: () => void
  onNetworkAdded: (label: string, ssid: string, password: string) => void
}

export const AddNetworkModal = ({ opened, loading, close, onNetworkAdded: onVideoAdded }: AddNetworkModalProps) => {
  const [label, setLabel] = useState('')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')

  const readyToSubmit = label.trim() != '' && ssid.trim() != '' && password != ''

  const submit = () => {
    if (readyToSubmit) {
      onVideoAdded(label.trim(), ssid.trim(), password)
      setLabel('')
      setSsid('')
      setPassword('')
    }
  }

  return (
    <Modal size='md' opened={opened} onClose={close} title='Add Network'>
      <Box pos='relative'>
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'green' }} />
        <Stack>
          <TextInput
            data-autofocus
            label='Label'
            variant='filled'
            placeholder='Label to identify this network'
            value={label}
            onChange={event => setLabel(event.currentTarget.value)} />
          <TextInput
            data-autofocus
            label='Name (SSID)'
            variant='filled'
            placeholder='Network Name (SSID)'
            value={ssid}
            onChange={event => setSsid(event.currentTarget.value)} />
          <TextInput
            data-autofocus
            label='Password'
            variant='filled'
            placeholder='Network password'
            // type='password'
            value={password}
            onChange={event => setPassword(event.currentTarget.value)} />
          <Group justify='flex-end'>
            <Button disabled={!readyToSubmit} variant='light' onClick={submit}>Submit</Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}

export default AddNetworkModal
