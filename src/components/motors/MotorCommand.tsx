import { useEffect, useState } from 'react';
import { Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import {
    IconPlayerPlay, IconPlayerPause, IconRefresh, IconPlayerStop,
    IconTarget, IconRotate, IconHistory
} from '@tabler/icons-react';
import type { MotorId } from '../../services/api/motors/types/motortype';
import { postCommand, getLastCommand} from '../../services/api/motors/command';
type CommandAction = 'start' | 'pause' | 'resume' | 'stop' | 'zero' | 'reverse';


type Props = {
    motorId: MotorId;
    pollMs?: number;             // default 1500
    onActionDone?: (action: CommandAction) => void;
};

function fmtTs(ts?: number) {
    if (!ts) return '—';
    // human-ish, no i18n complexity
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString();
}

export default function MotorCommand({ motorId, pollMs = 1500, onActionDone }: Props) {
    const [lastAction, setLastAction] = useState<CommandAction>('stop');
    const [lastTs, setLastTs] = useState<number>(0);
    const [sending, setSending] = useState<CommandAction | null>(null);

    // initial load + polling for last command
    useEffect(() => {
        let alive = true;

        const load = async () => {
            try {
                const lc = await getLastCommand(motorId);
                if (!alive) return;
                setLastAction(lc.action);
                setLastTs(lc.ts);
            } catch { /* ignore */ }
        };

        load();
        const id = setInterval(load, pollMs);
        return () => { alive = false; clearInterval(id); };
    }, [motorId, pollMs]);

    const send = async (action: CommandAction) => {
        setSending(action);
        try {
            await postCommand(motorId, action);
            // optimistic update
            setLastAction(action);
            setLastTs(Math.floor(Date.now() / 1000));
            onActionDone?.(action);
        } finally {
            setSending(null);
        }
    };

    return (
        <Stack gap="xs">
            <Group justify="space-between" align="center">
                <Text fw={600}>Motor {motorId} • Command</Text>
                <Group gap="xs">
                    <IconHistory size={16} />
                    <Text c="dimmed" size="sm">
                        Last: <strong>{lastAction}</strong> at {fmtTs(lastTs)}
                    </Text>
                </Group>
            </Group>

            <Group gap="xs" wrap="wrap">
  {[
    { action: 'start', label: 'Start', icon: <IconPlayerPlay size={14} />, color: 'green' },
    { action: 'pause', label: 'Pause', icon: <IconPlayerPause size={14} />, color: 'orange' },
    { action: 'resume', label: 'Resume', icon: <IconRefresh size={14} />, color: 'blue' },
    { action: 'stop', label: 'Stop', icon: <IconPlayerStop size={14} />, color: 'red' },
    { action: 'zero', label: 'Zero', icon: <IconTarget size={14} />, color: 'gray', tooltip: 'Zero absolute encoder' },
    { action: 'reverse', label: 'Reverse', icon: <IconRotate size={14} />, color: 'gray', tooltip: 'Reverse program directions (controller-defined)' },
  ].map((btn) => {
    const button = (
      <Button
        key={btn.action}
        size="xs"
        variant={lastAction === btn.action ? 'filled' : 'default'}
        color={lastAction === btn.action ? btn.color : undefined}
        leftSection={btn.icon}
        onClick={() => send(btn.action as CommandAction)}
        loading={sending === btn.action}
      >
        {btn.label}
      </Button>
    );

    return btn.tooltip ? <Tooltip key={btn.action} label={btn.tooltip}>{button}</Tooltip> : button;
  })}
</Group>

        </Stack>
    );
}
