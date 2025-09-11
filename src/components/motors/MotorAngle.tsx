import React, { useEffect, useState } from 'react';
import { NumberInput, Button, Group, Text } from '@mantine/core';
import { getAngle, putAngle, postZero, AngleData, AngleUpdate} from '../../services/api/motors/motorAngle';
import type { MotorId } from '../../services/api/motors/types/motortype';
interface AngleProps {
  motorId: MotorId;
}

export const MotorAngle: React.FC<AngleProps> = ({ motorId }) => {
  const [angleData, setAngleData] = useState<AngleData>({ position_deg: 0 });
  const [target, setTarget] = useState<number>(0);
  const [rpm, setRpm] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch current angle on mount
  useEffect(() => {
    async function fetchAngle() {
      const data = await getAngle(String(motorId));
      setAngleData(data);
      setTarget(data.position_deg); // default target = current position
    }
    fetchAngle();
  }, [motorId]);

  // Update absolute target
  const handleUpdate = async () => {
    setLoading(true);
    const payload: AngleUpdate = { target_deg: target, rpm };
    const res = await putAngle(String(motorId), payload);
    console.log('PUT Response:', res);
    setAngleData({ position_deg: res.request.target_deg });
    setLoading(false);
  };

  // Zero the angle
  const handleZero = async () => {
    setLoading(true);
    const res = await postZero(String(motorId));
    console.log('Zero Response:', res);
    if (res.ok) {
      setAngleData({ position_deg: 0 });
      setTarget(0);
    }
    setLoading(false);
  };

  return (
    <div>
      <Text size="lg" fw={800}>Current Angle: {angleData.position_deg}°</Text>
      <Group gap="xs" align="end" style={{ marginTop: 10 }}>
        <NumberInput
          label="Target Angle (°)"
          value={target}
          onChange={(val) => setTarget(Number(val) || 0)}
        />
        <NumberInput
          label="RPM"
          value={rpm}
          onChange={(val) => setRpm(Number(val) || 0)}
        />
        <Button loading={loading} onClick={handleUpdate}>
          Set Angle
        </Button>
        <Button loading={loading} color="red" onClick={handleZero}>
          Zero
        </Button>
      </Group>
    </div>
  );
};
