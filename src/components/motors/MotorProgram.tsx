import { useEffect, useState } from 'react';
import {
  ActionIcon, Button, CloseButton, Group, NumberInput, Stack, Table, Text, Tooltip,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconPlus, IconEdit } from '@tabler/icons-react';
import type { MotorId, Program, ProgramStep, ProgramSummary } from '../../services/api/motors/types/motortype';
import { getProgram, postQuickSequence, getProgramTotalDuration } from '../../services/api/motors/motorProgram';
import ClassNames from './style/motor.module.css'
import { INPUT_STEP_DELAY, INPUT_STEP_INTERVAL } from '../../constants';
type Props = {
  motorId: MotorId;              // 1..4
  compact?: boolean;             // optional tighter layout
};

const clampRpm = (v: number) => Math.max(-1000, Math.min(1000, v));
const minDur = (v: number) => Math.max(0.1, Number.isFinite(v) ? v : 0.1);

export default function MotorProgramUI({ motorId, compact }: Props) {
  const MIN_DURATION_SECONDS = 0.1
  const MAX_MOTOR_SPEED = 100000
  const DURATION_NUM_DECIMAL_PLACES = 1
  const [program, setProgram] = useState<Program>({ mode: 'sequence', steps: [], summary: { mode: 'sequence', total_duration_s: 0, steps_count: 0 } });
  const [rows, setRows] = useState(program.steps);
  const [summary, setSummary] = useState<ProgramSummary>({ mode: 'sequence', total_duration_s: 0, steps_count: 0 });
  const [loading, setLoading] = useState(true);
  const [quickDur] = useState(1.0);
  const [quickRpm] = useState(0);
  const [isEditing, setIsEditing] = useState(false)

  const toNumberOrReturnValue = (value: string) => {
    const converted = parseFloat(value)
    return isNaN(converted) ? value : converted
  }
  // load current program
  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getProgram(motorId);
        if (!on) return;
        setProgram(res.program);
        setRows(res.program.steps);
        setSummary(res.summary);
      } finally {
        setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [motorId]);

  const cancelEdit = () => { }

  // derived total in UI (before save)
  // const totalUI = useMemo(() => rows.reduce((a, b) => a + (b.duration_s || 0), 0), [rows]);

  // const addRow = () =>
  //   setRows([...rows, { index: rows.length + 1, duration_s: 1.0, rpm: 0 }]);

  const delRow = (index: number) => {
    if (isEditing) {
      // remove from the editable buffer
      setRows(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i + 1 })));
    } else {
      // remove from the saved program
      setProgram(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i + 1 })),
      }));
    }
  };
  // replace your moveRow with this:
  const moveRow = (index: number, moveForward: boolean) => {
    if (isEditing) {
      // editing: table renders from `rows`
      setRows(curr => {
        const j = moveForward ? index + 1 : index - 1;
        if (j < 0 || j >= curr.length) return curr;
        const copy = curr.slice();
        [copy[index], copy[j]] = [copy[j], copy[index]];
        return copy.map((s, i) => ({ ...s, index: i + 1 })); // reindex
      });
    } else {
      // view mode: table renders from `program.steps`
      setProgram(prev => {
        const steps = prev.steps.slice();
        const j = moveForward ? index + 1 : index - 1;
        if (j < 0 || j >= steps.length) return prev;
        [steps[index], steps[j]] = [steps[j], steps[index]];
        const reindexed = steps.map((s, i) => ({ ...s, index: i + 1 }));
        return { ...prev, steps: reindexed };
      });
    }
  };


  const updateEvent = (i: number, patch: Partial<Program['steps'][number]>) =>
    setRows(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const saveEdit = async () => {
    try {
      const normalized: Program = {
        mode: 'sequence',
        steps: rows.map((s, i) => ({
          index: i,
          duration_s: minDur(Number(s.duration_s)),
          rpm: clampRpm(Number(s.rpm)),
        })),
        summary,
      };
      // const sum = await putProgram(motorId, normalized);
      setProgram(normalized);
      // setSummary(sum);
      const d = await getProgramTotalDuration(motorId);
      setSummary(s => ({ ...s, total_duration_s: d, steps_count: rows.length }));
      setIsEditing(false);
    } finally {
    }
  };

  // const refreshTotalFromServer = async () => {
  //   const d = await getProgramTotalDuration(motorId);
  //   setSummary(s => ({ ...s, total_duration_s: d, steps_count: rows.length }));
  // };

  const addRow = async () => {
    const newStep = {
      index: rows.length + 1,
      duration_s: minDur(quickDur),
      rpm: clampRpm(quickRpm),
    };

    // update UI immediately
    setRows(prev => [...prev, newStep]);

    // still send to backend
    try {
      const sum = await postQuickSequence(motorId, {
        duration_s: newStep.duration_s,
        rpm: newStep.rpm,
      });
      setSummary(sum);
    } catch (err) {
      console.error("Failed to post quick sequence", err);
    }
  };


  const SequenceTableRows = (events: ProgramStep[]) => events.map((event, index) => (
    <Table.Tr key={index}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{event?.duration_s}</Table.Td>
      <Table.Td>{event.rpm}</Table.Td>
    </Table.Tr>
  ))

  const generateEditTableRows = (events: ProgramStep[]) => events.map((event, index) => (
    <Table.Tr key={index}>
      <Table.Td>
        <NumberInput
          min={MIN_DURATION_SECONDS}
          decimalScale={DURATION_NUM_DECIMAL_PLACES}
          value={toNumberOrReturnValue(String(event?.duration_s || ''))}
          step={MIN_DURATION_SECONDS}
          allowNegative={false}
          stepHoldDelay={INPUT_STEP_DELAY}
          stepHoldInterval={INPUT_STEP_INTERVAL}
          minLength={5}
          onChange={value => updateEvent(index, { duration_s: value as any })} />
      </Table.Td>
      <Table.Td>
        <NumberInput
          min={-MAX_MOTOR_SPEED}
          max={MAX_MOTOR_SPEED}
          stepHoldDelay={INPUT_STEP_DELAY}
          stepHoldInterval={INPUT_STEP_INTERVAL}
          allowDecimal={false}
          minLength={5}
          value={toNumberOrReturnValue(String(event?.rpm || ''))}
          onChange={value => updateEvent(index, { rpm: value as any })} />
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
                onClick={() => moveRow(index, false)}>
                <IconChevronUp />
              </ActionIcon>
            </Tooltip>
            <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Move Down'>
              <ActionIcon
                hidden={events.length <= 1}
                disabled={index == events.length - 1}
                variant='subtle'
                radius='xl'
                onClick={() => moveRow(index, true)}>
                <IconChevronDown />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Tooltip hidden={events.length <= 1} disabled={events.length <= 1} label='Delete Row'>
            <CloseButton
              hidden={events.length <= 1}
              disabled={events.length <= 1}
              radius='xl'
              onClick={() => delRow(index)} />
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))
  const viewRows = isEditing ? rows : program.steps;

  const sequencerows = isEditing
    ? generateEditTableRows(viewRows)
    : SequenceTableRows(viewRows);
  return (
    <Stack gap={compact ? 'xs' : 'md'}>
      <Group align="center" justify='space-between' gap={'xs'}>
        <Text fw={600}>Motor {motorId} • Program (sequence)</Text>
        <Group gap="xs">
          {/* <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={addRow}>Add Step</Button> */}
          {/* <Button size="xs" variant="light" onClick={refreshTotalFromServer}>Refresh Total</Button> */}
          {isEditing ? (
            <Button.Group className={ClassNames.motorbuttongroup}>
              <Button
                className={ClassNames.motorSaveEditButton}
                variant="filled"
                onClick={async () => {
                  saveEdit()
                }}
                loading={loading}
              >
                Save
              </Button>
              <Button
                className={ClassNames.motorSaveCancelButton}
                variant="light"
                onClick={() => {
                  setIsEditing(false)
                  cancelEdit()
                }}
                disabled={loading}
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
              Edit
            </Button>
          )}
        </Group>
      </Group>
      <Text c="dimmed">
        <p>
          {/* <strong>Step Count:</strong> {summary.steps_count} */}
          <strong>Total Duration:</strong> {summary.total_duration_s.toFixed(1)} s</p>
        {/* {totalUI !== summary.total_duration_s && (
          <> • <Tooltip label="Unsaved edits total (UI)">
            <span><strong>Total Duration:</strong> {totalUI.toFixed(1)} s</span>
          </Tooltip></>
        )} */}
      </Text>
      <Table withRowBorders={false} highlightOnHover striped={compact}>
        <Table.Thead>
          <Table.Tr>
            {!isEditing && <Table.Th>#</Table.Th>}
            <Table.Th>Duration (s)</Table.Th>
            <Table.Th>RPM</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{sequencerows}</Table.Tbody>
        {isEditing && <Table.Caption>
          <Group justify='center'>
            <Button variant='subtle' color='green' leftSection={<IconPlus size={14} />} onClick={addRow}>
              Add Row
            </Button>
            {/* <Menu.Target>
                        <Button
                          variant='subtle'
                          leftSection={<IconCopy size={14} />}
                         Menu rightSection={<IconChevronDown size={14} />} >
                          Load Data
                        </Button>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>From</Menu.Label>
                        {sequences.filter((_, i) => i != index).map((s, i) =>
                          <MenuItem key={i} onClick={() => loadDataFrom(s)}>Motor {s.id}</MenuItem>
                        )}
                      </Menu.Dropdown>
                    </Menu> */}
            {/* <Button
                      variant='subtle'
                      color='red'
                      leftSection={<IconTrash size={14} />}
                      onClick={clearEvents}
                      disabled={internalEvents.length == 1 && angularInternalEvents[0] == DEFAULT_EVENTAngular}>
                      Clear All
                    </Button> */}
          </Group>
        </Table.Caption>}
      </Table>
    </Stack>
  );
}
