import { Group, Pill, Stack, Text } from '@mantine/core';
import { Network } from '../../api';
import MoreMenu from '../MoreMenu';
import { IconWifi } from '@tabler/icons-react';

export interface NetworkListItemProps {
  network: Network
  connected: boolean
  onEditClicked: () => void
  onDeleteClicked: () => void
}

export const NetworkListItem = ({ network, connected, onEditClicked, onDeleteClicked }: NetworkListItemProps) => (
  <Group justify='space-between' py={5}>
    <Stack gap={0} >
      <IconWifi color='#40c057' size={20} />
      <Text>{network.label}</Text>
      <Text size='xs' c='dimmed'>SSID: {network.ssid}</Text>
    </Stack>
    <Group>
      {connected && <Pill variant='contrast'>Connected</Pill>}
      <MoreMenu onEdit={onEditClicked} onDelete={onDeleteClicked} deleteDisabled={connected} />
    </Group>
  </Group>
)

export default NetworkListItem
