import { useEffect, useMemo, useState } from 'react';
import { ActionIcon,  CloseButton, Group, NumberInput, Stack, Switch, Table, Text, Textarea, Tooltip } from '@mantine/core';
import { IconCheck, IconChevronDown, IconChevronUp, IconDeviceFloppy, IconPlus, IconTrash} from '@tabler/icons-react';
import * as api from '../../services/api/motors/motorSettings';
import { MotorId, MotorSettingItem } from '../../services/api/motors/types/motortype';

type Props = { motorId: MotorId };

type Row = {
  index: number;
  max_speed: number;
  acceleration: number;
  invert: boolean;
  extraText: string; // JSON text for extra
  dirty?: boolean;
  validExtra?: boolean;
};

export default function MotorSettings({ motorId }: Props) {
  const MIN_DURATION_SECONDS = 0.1
const MAX_MOTOR_SPEED = 100000
const DURATION_NUM_DECIMAL_PLACES = 1
const INPUT_STEP_INTERVAL = 50
const INPUT_STEP_DELAY = 500
  const [rows, setRows] = useState<Row[]>([]);
  const [savingAll, setSavingAll] = useState(false);

  // load on motor change
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await api.listMotorSettings(motorId);
      if (!alive) return;
      const mapped: Row[] = res.map(it => ({
        index: it.index,
        max_speed: it.items.max_speed,
        acceleration: it.items.acceleration,
        invert: it.items.invert,
        extraText: JSON.stringify(it.items.extra ?? {}, null, 2),
        dirty: false,
        validExtra: true,
      }));
      setRows(mapped);
    })();
    return () => { alive = false; };
  }, [motorId]);

  const nextIndex = useMemo(() => (rows.length ? Math.max(...rows.map(r => r.index)) + 1 : 1), [rows]);

  const addRow = () => {
    setRows([
      ...rows,
      { index: nextIndex, max_speed: 10000, acceleration: 100, invert: false, extraText: "{}", dirty: true, validExtra: true },
    ]);
  };

  const update = (idx: number, patch: Partial<Row>) =>
    setRows(rows.map(r => (r.index === idx ? { ...r, ...patch, dirty: true } : r)));

  const remove = async (idx: number) => {
    await api.deleteMotorSetting(motorId, idx);
    setRows(rows.filter(r => r.index !== idx));
  };

  const saveOne = async (idx: number) => {
    const r = rows.find(x => x.index === idx);
    if (!r) return;
    let extra: any = {};
    try {
      extra = r.extraText?.trim() ? JSON.parse(r.extraText) : {};
    } catch {
      update(idx, { validExtra: false });
      return;
    }
    await api.putMotorSetting(motorId, idx, {
      max_speed: Number(r.max_speed) || 0,
      acceleration: Number(r.acceleration) || 0,
      invert: !!r.invert,
      extra,
    });
    update(idx, { dirty: false, validExtra: true });
  };

  // const saveAll = async () => {
  //   setSavingAll(true);
  //   const items: MotorSettingItem[] = [];
  //   for (const r of rows) {
  //     try {
  //       const extra = r.extraText?.trim() ? JSON.parse(r.extraText) : {};
  //       items.push({
  //         index: r.index,
  //         items: {
  //           max_speed: Number(r.max_speed) || 0,
  //           acceleration: Number(r.acceleration) || 0,
  //           invert: !!r.invert,
  //           extra,
  //         },
  //       });
  //     } catch {
  //       // mark invalid extras and abort
  //       setRows(rs => rs.map(x => (x.index === r.index ? { ...x, validExtra: false } : x)));
  //       setSavingAll(false);
  //       return;
  //     }
  //   }
  //   await api.putMotorSettings(motorId, items);
  //   // clear dirty flags
  //   setRows(rs => rs.map(x => ({ ...x, dirty: false, validExtra: true })));
  //   setSavingAll(false);
  // };

  const generateTableRows = (events: MotorSettingItem[]) => events.map((event, index) => (
      <Table.Tr key={index}>
        <Table.Td>{index + 1}</Table.Td>
        <Table.Td>{event.items.max_speed}</Table.Td>
        <Table.Td>{event.items.acceleration}</Table.Td>
        <Table.Td>{event.items.invert}</Table.Td>
        {/* <Table.Td>{event.items.extra}</Table.Td> */}
      </Table.Tr>
    ))
  
    const generateEditTableRows = (events: MotorSettingItem[]) => events.map((event, index) => (
      <Table.Tr key={index}>
        <Table.Td>
          <NumberInput
            min={MIN_DURATION_SECONDS}
            decimalScale={DURATION_NUM_DECIMAL_PLACES}
            value={event.items.max_speed}
            step={MIN_DURATION_SECONDS}
            allowNegative={false}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            minLength={5}
            // onChange={value => updateEvent({ max_speed: value.toString() }, index)} 
            />
        </Table.Td>
        <Table.Td>
          <NumberInput
            min={-MAX_MOTOR_SPEED}
            max={MAX_MOTOR_SPEED}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            allowDecimal={false}
            minLength={5}
            value={event.items.acceleration}
            // onChange={value => updateEvent({ speed: value.toString() }, index)}
             />
        </Table.Td>
        <Table.Td>
          <NumberInput
            min={-MAX_MOTOR_SPEED}
            max={MAX_MOTOR_SPEED}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            allowDecimal={false}
            minLength={5}
            value={JSON.stringify(event.items.invert)}
            // onChange={value => updateEvent({ speed: value.toString() }, index)}
             />
        </Table.Td>
        <Table.Td>
          <NumberInput
            min={-MAX_MOTOR_SPEED}
            max={MAX_MOTOR_SPEED}
            stepHoldDelay={INPUT_STEP_DELAY}
            stepHoldInterval={INPUT_STEP_INTERVAL}
            allowDecimal={false}
            minLength={5}
            value={JSON.stringify(event.items.extra)}
            // onChange={value => updateEvent({ speed: value.toString() }, index)}
             />
        </Table.Td>
        <Table.Td width={120}>
          <Group>
            <Group gap={0}>
              <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Move Up'>
                <ActionIcon
                  hidden={events.length <= 1}
                  disabled={index == 0}
                  variant='subtle'
                  radius='xl'
                  // onClick={() => moveEvent(index, false)}
                  >
                  <IconChevronUp />
                </ActionIcon>
              </Tooltip>
              <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Move Down'>
                <ActionIcon
                  hidden={events.length <= 1}
                  disabled={index == events.length - 1}
                  variant='subtle'
                  radius='xl'
                  // onClick={() => moveEvent(index, true)}
                  >
                  <IconChevronDown />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Delete Row'>
              <CloseButton
                hidden={events.length <= 1}
                disabled={events.length <= 1}
                radius='xl'
                // onClick={() => deleteEvent(index)} 
                />
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    ))

  return (
    <Stack>
      {/* <Group justify="space-between">
        <Text fw={600}>Motor {motorId} • Settings</Text>
        <Group>
          <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={addRow}>Add Setting</Button>
          <Button size="xs" leftSection={<IconDeviceFloppy size={14} />} onClick={saveAll} loading={savingAll}>
            Save All
          </Button>
        </Group>
      </Group> */}

      <Table withRowBorders={false} highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Max Speed</Table.Th>
            <Table.Th>Acceleration</Table.Th>
            <Table.Th>Invert</Table.Th>
            <Table.Th>Extra (JSON)</Table.Th>
            <Table.Th style={{ width: 120 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map(r => (
            <Table.Tr key={r.index}>
              <Table.Td>{r.index}</Table.Td>
              <Table.Td>
                <NumberInput value={r.max_speed} onChange={(v) => update(r.index, { max_speed: Number(v) })} />
              </Table.Td>
              <Table.Td>
                <NumberInput value={r.acceleration} onChange={(v) => update(r.index, { acceleration: Number(v) })} />
              </Table.Td>
              <Table.Td>
                <Switch checked={r.invert} onChange={(e) => update(r.index, { invert: e.currentTarget.checked })} />
              </Table.Td>
              <Table.Td>
                <Textarea
                  autosize
                  minRows={2}
                  value={r.extraText}
                  onChange={(e) => update(r.index, { extraText: e.currentTarget.value, validExtra: true })}
                  error={r.validExtra === false ? 'Invalid JSON' : undefined}
                />
              </Table.Td>
              <Table.Td>
                <Group gap={6} justify="right">
                  <ActionIcon
                    variant={r.dirty ? 'filled' : 'light'}
                    color={r.dirty ? 'blue' : 'gray'}
                    title="Save row"
                    onClick={() => saveOne(r.index)}
                  >
                    {r.dirty ? <IconDeviceFloppy size={16} /> : <IconCheck size={16} />}
                  </ActionIcon>
                  <ActionIcon color="red" variant="light" title="Delete row" onClick={() => remove(r.index)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Group justify="space-between">
                  <Text c="dimmed">No settings yet. Click “Add Setting”.</Text>
                  <ActionIcon onClick={addRow} title="Add"><IconPlus size={16} /></ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
