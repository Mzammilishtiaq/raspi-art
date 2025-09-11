import { useEffect, useState } from 'react';
import { ActionIcon, Button, CloseButton, Group, NumberInput, Stack, Switch, Table, Text, Tooltip } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconEdit, IconTrash } from '@tabler/icons-react';
import * as api from '../../services/api/motors/motorSettings';
import { MotorId, MotorSettingItem} from '../../services/api/motors/types/motortype';
import ClassNames from './style/motor.module.css'
// import DeleteMotorModel from './DeleteMotorModel';
type Props = { motorId: MotorId };

export default function MotorSettings({ motorId }: Props) {
  // const MIN_DURATION_SECONDS = 0.1
  // const MAX_MOTOR_SPEED = 100000
  // const DURATION_NUM_DECIMAL_PLACES = 1
  // const INPUT_STEP_INTERVAL = 50
  // const INPUT_STEP_DELAY = 500
  const [rows, setRows] = useState<MotorSettingItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<{ motorId: number | null; index: number | null }>({
    motorId: null,
    index: null,
  });
  const [isSingleEdit, setIsSingleEdit] = useState<{ motorId: number | null; index: number | null }>({
    motorId: null,
    index: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  // load on motor change
  const saveallSettings = async () => {
    try {
      // API call to update motor settings
      const updatedSettings: MotorSettingItem[] = rows.map((row) => ({
        ...row, // Ensure you structure the rows as needed
      }));

      // Call API to save updated settings
      await api.putMotorSettings(motorId, updatedSettings);

      setRows(updatedSettings); // Update local rows state with the updated settings
      setIsEditing(false); // Stop editing mode after saving
    } catch (error) {
      console.error('Error saving motor settings:', error);
    }
  };

  const savesingleSettings = async (index: number) => {
    try {
      // Get the specific setting to save based on index
      const settingToSave = rows.find((row) => row.index === index);

      if (!settingToSave) {
        console.error("Setting not found");
        return;
      }

      // API call to save the specific motor setting
      await api.putMotorSetting(motorId, index, settingToSave.items);

      // Update the local rows state with the updated setting (optional)
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.index === index ? { ...row, ...settingToSave } : row
        )
      );
      setIsSingleEdit({ motorId: null, index: null })
    } catch (error) {
      console.error("Error saving motor setting:", error);
    }
  };

  const updateEvent = (patch: Partial<MotorSettingItem['items']>, index: number) => {
    setRows((rows) =>
      rows.map((row) => (row.index === index ? { ...row, items: { ...row.items, ...patch } } : row))
    );
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await api.listMotorSettings(motorId);
      if (!alive) return;
      setRows(res); // res is already MotorSettingItem[]
    })();
    return () => { alive = false; };
  }, [motorId]);

  // const nextIndex = useMemo(() => (rows.length ? Math.max(...rows.map(r => r.index)) + 1 : 1), [rows]);

  // const addRow = () => {
  //   setRows([
  //     ...rows,
  //     { index: nextIndex, max_speed: 10000, acceleration: 100, invert: false, extraText: "{}", dirty: true, validExtra: true },
  //   ]);
  // };

  // const update = (idx: number, patch: Partial<Row>) =>
  //   setRows(rows.map(r => (r.index === idx ? { ...r, ...patch, dirty: true } : r)));

  // const remove = async (idx: number) => {
  //   await api.deleteMotorSetting(motorId, idx);
  //   setRows(rows.filter(r => r.index !== idx));
  // };

  // const saveOne = async (idx: number) => {
  //   const r = rows.find(x => x.index === idx);
  //   if (!r) return;
  //   let extra: any = {};
  //   try {
  //     extra = r.extraText?.trim() ? JSON.parse(r.extraText) : {};
  //   } catch {
  //     update(idx, { validExtra: false });
  //     return;
  //   }
  //   await api.putMotorSetting(motorId, idx, {
  //     max_speed: Number(r.max_speed) || 0,
  //     acceleration: Number(r.acceleration) || 0,
  //     invert: !!r.invert,
  //     extra,
  //   });
  //   update(idx, { dirty: false, validExtra: true });
  // };

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

  const handleRowSelect = (index: number, motorId: number) => {
    setSelectedRow((prev) => {
      // Toggle selection for the current row
      if (prev.motorId === motorId && prev.index === index) {
        return { motorId: null, index: null }; // Deselect the row
      } else {
        return { motorId, index }; // Select the row
      }
    });
  };
  const handleSingleEdit = (index: number, motorId: number) => {
    setIsSingleEdit({ motorId, index });
  };

  // Delete motor setting
  const deleteEvent = async (index: number) => {
    try {
      // Call the API to delete the motor setting
      await api.deleteMotorSetting(motorId, index);

      // Update local rows state by removing the deleted row
      setRows((prevRows) => prevRows.filter((row) => row.index !== index));
    } catch (error) {
      console.error("Error deleting motor setting:", error);
    }
  };

  const generateTableRows = (events: MotorSettingItem[]): JSX.Element[] => events.map((event, index) => (
    <Table.Tr key={index}
      onClick={() => handleRowSelect(event.index, motorId)}
      style={{
        backgroundColor: selectedRow.motorId === motorId && selectedRow.index === event.index ? '#f0f0f0' : 'transparent',
      }}>
      {isSingleEdit.index == event.index && isSingleEdit.motorId == motorId
        ? (<>
          <Table.Td>
            <NumberInput
              // min={MIN_DURATION_SECONDS}
              // decimalScale={DURATION_NUM_DECIMAL_PLACES}
              // step={MIN_DURATION_SECONDS}
              // allowNegative={false}
              // stepHoldDelay={INPUT_STEP_DELAY}
              // stepHoldInterval={INPUT_STEP_INTERVAL}
              // minLength={5}
              value={event.items.max_speed}
              onChange={(value) => updateEvent({ max_speed: Number(value) || 0 }, event.index)}
            />
          </Table.Td>
          <Table.Td>
            <NumberInput
              // min={-MAX_MOTOR_SPEED}
              // max={MAX_MOTOR_SPEED}
              // stepHoldDelay={INPUT_STEP_DELAY}
              // stepHoldInterval={INPUT_STEP_INTERVAL}
              // allowDecimal={false}
              // minLength={5}
              value={event.items.acceleration}
              onChange={(value) => updateEvent({ acceleration: Number(value) || 0 }, event.index)}
            />
          </Table.Td>
          <Table.Td>
            <Switch
              size="lg"
              onLabel="True"
              offLabel="False"
              checked={event.items.invert}
              onChange={(e) =>
                updateEvent({ invert: e.currentTarget.checked }, event.index) // Update invert
              }
            />
          </Table.Td>
          <Table.Td>
            <NumberInput
              // min={-MAX_MOTOR_SPEED}
              // max={MAX_MOTOR_SPEED}
              // stepHoldDelay={INPUT_STEP_DELAY}
              // stepHoldInterval={INPUT_STEP_INTERVAL}
              // allowDecimal={false}
              // minLength={5}
              value={JSON.stringify(event.items.extra)}
              onChange={(value) => updateEvent({ extra: JSON.parse(String(value)) }, event.index)}
            />
          </Table.Td>
          <Table.Td width={120}>
            <Group>
              <Button
                className={ClassNames.motorSaveEditButton}
                variant="filled"
                onClick={() => savesingleSettings(event.index)}
              >
                Save
              </Button>
            </Group>
          </Table.Td>
        </>)
        : (<>
          <Table.Td>{event.index}</Table.Td>
          <Table.Td>{event.items.max_speed}</Table.Td>
          <Table.Td>{event.items.acceleration}</Table.Td>
          <Table.Td>{event.items.invert ? 'true' : 'false'}</Table.Td>
          <Table.Td>{JSON.stringify(event.items.extra)}</Table.Td>
          <Table.Td>
            <Group>
              <ActionIcon
                onClick={() => handleSingleEdit(event.index, motorId)}
                variant="light"
                title="Edit"
              >
                <IconEdit />
              </ActionIcon>
              <ActionIcon
                 onClick={() => deleteEvent(event.index)}
                title="Delete">
                <IconTrash size={20} />
              </ActionIcon>
            </Group>
          </Table.Td>
        </>
        )}
    </Table.Tr >
  ));


  const generateEditTableRows = (events: MotorSettingItem[]): JSX.Element[] => events.map((event, index) => (
    <Table.Tr key={index}>
      <Table.Td>
        <NumberInput
          // min={MIN_DURATION_SECONDS}
          // decimalScale={DURATION_NUM_DECIMAL_PLACES}
          value={event.items.max_speed}
          // step={MIN_DURATION_SECONDS}
          // allowNegative={false}
          // stepHoldDelay={INPUT_STEP_DELAY}
          // stepHoldInterval={INPUT_STEP_INTERVAL}
          // minLength={5}
          onChange={(value) => updateEvent({ max_speed: Number(value) || 0 }, event.index)} // Update max_speed
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          // min={-MAX_MOTOR_SPEED}
          // max={MAX_MOTOR_SPEED}
          // stepHoldDelay={INPUT_STEP_DELAY}
          // stepHoldInterval={INPUT_STEP_INTERVAL}
          // allowDecimal={false}
          // minLength={5}
          value={event.items.acceleration}
          onChange={(value) => updateEvent({ acceleration: Number(value) || 0 }, event.index)} // Update acceleration
        />
      </Table.Td>
      <Table.Td>
        <Switch
          size="lg"
          onLabel="True"
          offLabel="False"
          checked={event.items.invert}
          onChange={(e) =>
            updateEvent({ invert: e.currentTarget.checked }, event.index) // Update invert
          }
        />
      </Table.Td>
      <Table.Td>
        <input
          type="text"
          // min={-MAX_MOTOR_SPEED}
          // max={MAX_MOTOR_SPEED}
          // stepHoldDelay={INPUT_STEP_DELAY}
          // stepHoldInterval={INPUT_STEP_INTERVAL}
          // allowDecimal={false}
          // minLength={5}
          value={JSON.stringify(event.items.extra)}
          onChange={(value) => updateEvent({ extra: JSON.parse(String(value)) }, event.index)} // Update extra
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

  const rowsToSetting = isEditing ? generateEditTableRows(rows) : generateTableRows(rows);

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

      <Group justify='space-between'>
        <Text fw={600}>Motor {motorId} • Settings</Text>
        {isEditing ? (
          <Button.Group className={ClassNames.motorbuttongroup}>
            <Button
              className={ClassNames.motorSaveEditButton}
              variant="filled"
              onClick={async () => {
                saveallSettings()
              }}
            // loading={loading}
            >
              Save
            </Button>
            <Button
              className={ClassNames.motorSaveCancelButton}
              variant="light"
              onClick={() => {
                setIsEditing(false)
                // cancelEdit()
              }}
            // disabled={loading}
            >
              Cancel
            </Button>
          </Button.Group>
        ) : (
          <Button
            variant="subtle"
            leftSection={<IconEdit size={14} />}
            onClick={() => setIsEditing(true)}
          >
            Edit All
          </Button>)}
      </Group>
      <Table withRowBorders={false} highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {!isEditing && isSingleEdit.index == null && isSingleEdit.motorId == null && <Table.Th>#</Table.Th>}
            <Table.Th>Max Speed</Table.Th>
            <Table.Th>Acceleration</Table.Th>
            <Table.Th>Invert</Table.Th>
            <Table.Th>Extra (JSON)</Table.Th>
            <Table.Th style={{ width: 120 }} />
          </Table.Tr>
        </Table.Thead>
        {/* <Table.Tbody>
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
        </Table.Tbody> */}
        <Table.Tbody>{rowsToSetting}</Table.Tbody>
      </Table>
      {/* <DeleteMotorModel
        opened={false}
        loading={false}
        close={false}
      /> */}
    </Stack>
  );
}
