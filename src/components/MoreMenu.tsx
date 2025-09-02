
import { Menu, ActionIcon, rem } from '@mantine/core'
import { IconDots, IconPencil, IconTrash } from '@tabler/icons-react'

export interface MoreMenuProps {
  onEdit: () => void
  onDelete: () => void
  deleteDisabled?: boolean
}

export const MoreMenu = ({ onEdit, onDelete, deleteDisabled }: MoreMenuProps) => (
  <Menu position='bottom-start' shadow='sm'>
    <Menu.Target>
      <ActionIcon variant='subtle' color='gray' radius='xl' onClick={e => e.stopPropagation()}>
        <IconDots style={{ width: rem(16), height: rem(16) }} />
      </ActionIcon>
    </Menu.Target>

    <Menu.Dropdown>
      <Menu.Item
        onClick={e => {
          e.stopPropagation();
          onEdit()
        }}
        leftSection={<IconPencil style={{ width: rem(14), height: rem(14) }} />}>
        Edit
      </Menu.Item>
      <Menu.Item
        onClick={onDelete}
        disabled={deleteDisabled}
        leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
        color='red'
      >
        Delete
      </Menu.Item>
    </Menu.Dropdown>
  </Menu>
)

export default MoreMenu
