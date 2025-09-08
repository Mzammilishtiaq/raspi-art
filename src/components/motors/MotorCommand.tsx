import { useEffect, useState } from 'react';
import { ActionIcon, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import {
    IconPlayerPlay, IconPlayerPause, IconRefresh, IconPlayerStop,
    IconTarget, IconRotate, IconHistory
} from '@tabler/icons-react';
import type { MotorId } from '../../services/api/motors/types/motortype';
import { postCommand, getLastCommand, type CommandAction } from '../../services/api/motors/command';
import { USE_MOCK } from '../../services/helper/helper';

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
                        {USE_MOCK ? ' (mock)' : ''}
                    </Text>
                </Group>
            </Group>

            <Group gap="xs" wrap="wrap">
                <Button
                    size="xs"
                    leftSection={<IconPlayerPlay size={14} />}
                    onClick={() => send('start')}
                    loading={sending === 'start'}
                >
                    Start
                </Button>

                <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlayerPause size={14} />}
                    onClick={() => send('pause')}
                    loading={sending === 'pause'}
                >
                    Pause
                </Button>

                <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconRefresh size={14} />}
                    onClick={() => send('resume')}
                    loading={sending === 'resume'}
                >
                    Resume
                </Button>

                <Button
                    size="xs"
                    color="red"
                    leftSection={<IconPlayerStop size={14} />}
                    onClick={() => send('stop')}
                    loading={sending === 'stop'}
                >
                    Stop
                </Button>

                <Tooltip label="Zero absolute encoder">
                    <Button
                        size="xs"
                        variant="default"
                        leftSection={<IconTarget size={14} />}
                        onClick={() => send('zero')}
                        loading={sending === 'zero'}
                    >
                        Zero
                    </Button>
                </Tooltip>

                <Tooltip label="Reverse program directions (controller-defined)">
                    <Button
                        size="xs"
                        variant="default"
                        leftSection={<IconRotate size={14} />}
                        onClick={() => send('reverse')}
                        loading={sending === 'reverse'}
                    >
                        Reverse
                    </Button>
                </Tooltip>
            </Group>
        </Stack>
    );
}
