import { View } from 'react-native';
import { Typography } from '@dashforge/rn';
import { useTheme } from '@dashforge/rn/theme';
import { Card, Caption, Label } from '../ui';

const RAMPS = [
  'primary',
  'success',
  'warning',
  'danger',
  'info',
  'neutral',
] as const;
const STEPS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
] as const;
const FEEDBACK = ['success', 'warning', 'danger', 'info'] as const;

export function TokensSection() {
  const theme = useTheme();
  const s = theme.semantic;

  return (
    <>
      <Card>
        <Label>Rampe</Label>
        <Caption>Ogni gradino è un tono L*, non un numero arbitrario.</Caption>
        {RAMPS.map(name => (
          <View key={name} style={{ gap: 4 }}>
            <Caption>{name}</Caption>
            <View
              style={{
                flexDirection: 'row',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {STEPS.map(step => (
                <View
                  key={step}
                  style={{
                    flex: 1,
                    height: 22,
                    backgroundColor: theme.palette[name][step],
                  }}
                />
              ))}
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Label>Superfici</Label>
        <View
          style={{
            backgroundColor: s.surface.sunken,
            borderRadius: s.radius.control,
            padding: s.space.inset,
            gap: 4,
          }}
        >
          <Typography>Testo primario su superficie incassata</Typography>
          <Typography variant="bodySmall" color="secondary">
            Testo secondario
          </Typography>
          <Typography variant="caption" color="muted">
            Testo attenuato
          </Typography>
        </View>
      </Card>

      <Card>
        <Label>Feedback</Label>
        {FEEDBACK.map(role => (
          <View
            key={role}
            style={{
              backgroundColor: s.feedback[role].bg,
              borderColor: s.feedback[role].border,
              borderWidth: s.borderWidth.default,
              borderRadius: s.radius.control,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Typography variant="bodySmall" sx={{ color: s.feedback[role].fg }}>
              {role}
            </Typography>
          </View>
        ))}
      </Card>

      <Card>
        <Label>Separatori</Label>
        <Caption>
          Traslucido e opaco sono due componenti, non uno con un'opacità.
        </Caption>
        <View style={{ height: 1, backgroundColor: s.separator.default }} />
        <Caption>default</Caption>
        <View style={{ height: 1, backgroundColor: s.separator.opaque }} />
        <Caption>opaque</Caption>
      </Card>
    </>
  );
}
