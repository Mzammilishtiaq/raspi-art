import { useState } from 'react'
import { Modal, Button, Stack, Group, TextInput, Box, LoadingOverlay } from '@mantine/core'

import { Network } from '../../api'

export interface EditNetworkModalProps {
  network: Network
  opened: boolean
  loading: boolean
  connected: boolean
  close: () => void
  onEditSaved: (network: Network) => void
}

export const EditNetworkModal = ({ network, opened, loading, connected, close, onEditSaved }: EditNetworkModalProps) => {
  const [label, setLabel] = useState(network.label)
  const [ssid, setSsid] = useState(network.ssid)
  const [password, setPassword] = useState(network.password)

  const validValues = label.trim() != '' && ssid.trim() != '' && password != ''
  const valuesChanged = label.trim() != network.label
    || ssid.trim() != network.ssid
    || password != network.password

  const readyToSubmit = validValues && valuesChanged

  const submit = () => {
    onEditSaved({
      ...network,
      label,
      ssid,
      password
    })
  }

  return (
    <Modal size='md' opened={opened} onClose={close} title='Edit Network'>
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
            label='SSID'
            variant='filled'
            placeholder='Network SSID'
            disabled={connected}
            value={ssid}
            onChange={event => setSsid(event.currentTarget.value)} />
          <TextInput
            data-autofocus
            label='Password'
            variant='filled'
            placeholder='Network password'
            type='password'
            disabled={connected}
            value={password}
            onChange={event => setPassword(event.currentTarget.value)} />
          <Group justify='flex-end'>
            <Button variant='subtle' color='grey' onClick={close}>Cancel</Button>
            <Button variant='light' onClick={submit} disabled={!readyToSubmit}>Save</Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}

export default EditNetworkModal
