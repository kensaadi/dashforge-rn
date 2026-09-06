/**
 * The application's one dialog channel.
 *
 * Written once, in its own module, so a store or a service can import
 * `ask` without importing a component or a hook. Two dialogs never
 * coexist, so there is exactly one of these.
 */
import { useState } from 'react';
import {
  Button,
  Stack,
  TextField,
  Typography,
  createDialogs,
} from '@dashforge/rn';
import type { DialogComponent } from '@dashforge/rn';

/**
 * A dialog that is really a piece of interface: it has a field, it
 * validates, and it answers with what was typed. The JSX lives here, in
 * the view layer, behind a name the business layer can hold without
 * importing anything.
 */
const RenameProject: DialogComponent<{ current: string }, string> = ({
  current,
  close,
}) => {
  const [name, setName] = useState(current);
  const tooShort = name.trim().length < 3;

  return (
    <>
      <Typography variant="subtitle" accessibilityRole="header">
        Rinomina il progetto
      </Typography>
      <TextField
        // Like every other field: `fullWidth` is false by default, the
        // same as on the MUI and Tailwind renderers, so a form written
        // for one looks the same in the other.
        fullWidth
        label="Nome"
        value={name}
        onChangeText={setName}
        error={tooShort}
        helperText={tooShort ? 'Almeno tre caratteri.' : undefined}
      />
      <Stack direction="row" justify="end" gap="inline">
        <Button
          size="sm"
          variant="ghost"
          color="secondary"
          onPress={() => close()}
        >
          Annulla
        </Button>
        <Button
          size="sm"
          disabled={tooShort}
          onPress={() => close(name.trim())}
        >
          Rinomina
        </Button>
      </Stack>
    </>
  );
};

export const { DialogHost, ask, useDialog } = createDialogs({
  renameProject: RenameProject,
});
