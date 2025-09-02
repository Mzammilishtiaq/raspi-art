import { useEffect, useState } from 'react'
import { Alert,  Button, Group, Skeleton, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { IconExclamationCircle, IconPlus, IconWifi, IconWifiOff } from '@tabler/icons-react'

import * as api from '../../api'
import { Network } from '../../api'
import useAsync from '../../useAsync'

import ConfirmDeleteModal from './ConfirmDeleteModal'
import AddNetworkModal from './AddNetworkModal'
import NetworkListItem from './NetworkListItem'
import EditNetworkModal from './EditNetworkModal'
import Classes from './style/network.module.css'
export const NetworkSection = () => {
  const { value: networks, setValue: setNetworks, loading, error } = useAsync(api.getNetworks, [])
  const { value: connectedNetworkUuid, setValue: setConnectedNetworkUuid } = useAsync(api.getConnectedNetworkUuid, [])

  const [modalNetwork, setModalNetwork] = useState<Network | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // TODO REVERT
        // const newConnectedNetworkUuid = await api.getConnectedNetworkUuid()
        // setConnectedNetworkUuid(newConnectedNetworkUuid)
      } catch (e) {
        // ignore
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [setConnectedNetworkUuid])

  const showErrorAlert = (error: Error) => {
    notifications.show({
      id: 'networks-error',
      withCloseButton: true,
      autoClose: 7000,
      title: 'Error',
      message: error.message,
      color: 'red'
    })
  }

  const showEditModal = (network: Network) => {
    setModalNetwork(network)
    openEdit()
  }

  const showDeleteModal = (network: Network) => {
    setModalNetwork(network)
    openDelete()
  }

  const addNetwork = async (label: string, ssid: string, password: string) => {
    if (networks == null) {
      return
    }

    setModalLoading(true)
    try {
      const network = await api.addNetwork(label, ssid, password)
      setNetworks([...networks, network])
      notifications.show({
        id: 'network-added',
        withCloseButton: true,
        autoClose: 2000,
        title: 'Network Added',
        message: `Successfully added ${label}`,
        color: 'green'
      })
    } catch (e) {
      showErrorAlert(e as Error)
    }

    closeAdd()
    setModalLoading(false)
  }

  const updateNetwork = async (network: Network) => {
    if (networks == null) {
      return
    }

    setModalLoading(true)
    try {
      await api.updateNetwork(network)
      setNetworks(networks.map(n => n.id == network.id ? network : n))
    } catch (e) {
      showErrorAlert(e as Error)
    }

    closeEdit()
    setModalLoading(false)
  }

  const deleteModalNetwork = async () => {
    if (networks == null || modalNetwork == null) {
      return
    }
    setModalLoading(true)
    try {
      await api.deleteNetwork(modalNetwork)
      setNetworks(networks.filter(network => network.id !== modalNetwork.id))
    } catch (e) {
      showErrorAlert(e as Error)
    }
    closeDelete()
    setModalLoading(false)
  }

  const header =
    <Group justify='space-between'>
     <Group>
      <IconWifi />
       <Title ta='left' order={3} size={20}>Networks</Title>
     </Group>
      <Button
        variant='filled'
        leftSection={<IconPlus size={14} />}
        onClick={openAdd}>
        Add Network
      </Button>
    </Group>

  if (loading) {
    return (
      <Stack>
        {header}
        <Stack key='loading-skeletons'>
          {[...Array(3).keys()].map(id =>
            <Stack key={id}>
              <Skeleton height={16} />
              <Skeleton height={16} width='20%' />
            </Stack>
          )}
        </Stack>
      </Stack >
    )
  }

  if (error || networks == null) {
    return (
      <Alert variant='light' color='red' title='Error loading network' icon={<IconExclamationCircle />}>
        <Text c='grey' size='sm'>{error?.message}</Text>
      </Alert>
    )
  }

  return (
    <>
      <Stack mih={0} gap={0} className={Classes.networkSection}>
        {header}
        {networks.length ?
          <>
            {networks.map(network => <NetworkListItem
              key={`network-${network.id}`}
              network={network}
              connected={network.uuid == connectedNetworkUuid}
              onEditClicked={() => showEditModal(network)}
              onDeleteClicked={() => showDeleteModal(network)}
            />
            )}
          </>
          :
          <Stack justify='center' align='center' py='xl' gap='sm' c='dimmed'>
            <IconWifiOff size={50} />
              <Title ta='center' order={6} fw={400}>No Networks</Title>
              <Text size='xs' c='dimmed'>Click Add Network above to add a network</Text>
          </Stack>
        }
      </Stack>
      <AddNetworkModal
        opened={addOpened}
        loading={modalLoading}
        close={closeAdd}
        onNetworkAdded={addNetwork} />
      {modalNetwork &&
        <>
          <ConfirmDeleteModal
            network={modalNetwork}
            opened={deleteOpened}
            loading={modalLoading}
            close={closeDelete}
            onConfirmDelete={deleteModalNetwork} />

          <EditNetworkModal
            key={modalNetwork.id}
            network={modalNetwork}
            opened={editOpened}
            loading={modalLoading}
            connected={modalNetwork.uuid == connectedNetworkUuid}
            close={closeEdit}
            onEditSaved={updateNetwork} />
        </>
      }
    </>
  )

}

export default NetworkSection
