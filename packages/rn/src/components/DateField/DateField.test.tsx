import { DashFormProvider } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Modal as RNModal } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DashforgeNativeProvider, runtime } from '../../theme/Provider';
import { setMode } from '../../theme/store';
import type { DatePickerAdapter } from '../../theme/theme.types';
import { DateField } from './DateField';
import { formatValue, isWithin, usesTwelveHourClock } from './dateField.format';

const trigger = () => screen.getByRole('button', { name: /Data|Orario|Quando/ });
const host = () => screen.UNSAFE_getByType(RNModal);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  runtime.datePicker = null;
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  runtime.datePicker = null;
  warn.mockRestore();
});

/**
 * What appears on the trigger for a given answer, and what appears for
 * an answer that is not one. Pure, so it can be held at all.
 */
describe('how an answer is written out', () => {
  it('writes a day in the language it was given', () => {
    expect(formatValue('2026-03-14', 'date', 'it-IT')).toContain('14');
    expect(formatValue('2026-03-14', 'date', 'it-IT')).toMatch(/marzo/i);
  });

  it('writes a time on the clock the language uses', () => {
    expect(formatValue('14:30', 'time', 'it-IT')).toBe('14:30');
    expect(usesTwelveHourClock('it-IT')).toBe(false);
  });

  it('shows nothing rather than rubbish', () => {
    // A field handed nonsense by an API shows the placeholder. Putting
    // the nonsense on screen puts it in front of somebody who cannot
    // fix it.
    expect(formatValue('non una data', 'date', 'it-IT')).toBeNull();
    expect(formatValue('2026-13-45', 'date', 'it-IT')).toBeNull();
    expect(formatValue('99:99', 'time', 'it-IT')).toBeNull();
    expect(formatValue(undefined, 'date', 'it-IT')).toBeNull();
  });
});

describe('the fence', () => {
  it('is inclusive at both ends', () => {
    expect(isWithin('2026-03-14', '2026-03-14', '2026-03-20')).toBe(true);
    expect(isWithin('2026-03-20', '2026-03-14', '2026-03-20')).toBe(true);
    expect(isWithin('2026-03-13', '2026-03-14', undefined)).toBe(false);
    expect(isWithin('2026-03-21', undefined, '2026-03-20')).toBe(false);
  });

  it('works on times too, because both sort as strings', () => {
    // Which is the whole reason the payload carries strings.
    expect(isWithin('09:30', '09:00', '17:00')).toBe(true);
    expect(isWithin('18:00', '09:00', '17:00')).toBe(false);
  });

  it('is not a fence where it was not given one', () => {
    expect(isWithin('2026-03-14', undefined, undefined)).toBe(true);
  });
});

describe('with a platform picker', () => {
  const adapter = (answer: string | null): DatePickerAdapter => ({
    open: jest.fn().mockResolvedValue(answer),
  });

  it('asks it rather than drawing anything', async () => {
    // Bucket three: a date picker is a surface somebody recognises as
    // belonging to their phone.
    const picker = adapter('2026-03-14');
    runtime.datePicker = picker;
    const onValueChange = jest.fn();
    render(<DateField label="Data" onValueChange={onValueChange} />);

    await act(async () => {
      fireEvent.press(trigger());
    });

    expect(picker.open).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'date', label: 'Data' }),
    );
    expect(onValueChange).toHaveBeenCalledWith('2026-03-14');
    expect(host().props.visible).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it('hands it the current answer and the fence', async () => {
    const picker = adapter(null);
    runtime.datePicker = picker;
    render(
      <DateField
        label="Data"
        value="2026-03-14"
        min="2026-03-01"
        max="2026-03-31"
        onValueChange={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(trigger());
    });
    expect(picker.open).toHaveBeenCalledWith(
      expect.objectContaining({ value: '2026-03-14', min: '2026-03-01', max: '2026-03-31' }),
    );
  });

  it('writes nothing when it was dismissed', async () => {
    // Somebody who changed their mind has not cleared the field.
    runtime.datePicker = adapter(null);
    const onValueChange = jest.fn();
    render(<DateField label="Data" value="2026-03-14" onValueChange={onValueChange} />);
    await act(async () => {
      fireEvent.press(trigger());
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('refuses an answer outside the fence', async () => {
    runtime.datePicker = adapter('2026-04-01');
    const onValueChange = jest.fn();
    render(
      <DateField label="Data" max="2026-03-31" onValueChange={onValueChange} />,
    );
    await act(async () => {
      fireEvent.press(trigger());
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('without one', () => {
  it('falls back to a calendar of ours, and says so', async () => {
    // An adapter has to degrade to something, and the only thing below
    // the platform's picker that is not "unanswerable" is a calendar.
    render(<DateField label="Data" onValueChange={jest.fn()} />);
    await act(async () => {
      fireEvent.press(trigger());
    });
    await waitFor(() => expect(host().props.visible).toBe(true));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no `datePicker`'));
  });

  it('answers with the day that was pressed', async () => {
    const onValueChange = jest.fn();
    render(
      <DateField label="Data" value="2026-03-14" onValueChange={onValueChange} />,
    );
    await act(async () => {
      fireEvent.press(trigger());
    });
    await waitFor(() => expect(host().props.visible).toBe(true));

    fireEvent.press(screen.getByLabelText(/20 marzo 2026/i));
    expect(onValueChange).toHaveBeenCalledWith('2026-03-20');
  });

  it('refuses a day outside the fence rather than offering it', async () => {
    const onValueChange = jest.fn();
    render(
      <DateField
        label="Data"
        value="2026-03-14"
        max="2026-03-15"
        onValueChange={onValueChange}
      />,
    );
    await act(async () => {
      fireEvent.press(trigger());
    });
    await waitFor(() => expect(host().props.visible).toBe(true));

    const late = screen.getByLabelText(/20 marzo 2026/i);
    expect(late.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(late);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('offers times a step apart, and reaches the end of the day', async () => {
    // The engine's default stops at half past eleven, which loses the
    // last half hour for anything finer than thirty minutes.
    render(
      <DateField mode="time" label="Orario" minuteStep={30} onValueChange={jest.fn()} />,
    );
    await act(async () => {
      fireEvent.press(trigger());
    });
    await waitFor(() => expect(host().props.visible).toBe(true));
    expect(screen.getByText('09:30')).toBeTruthy();
    expect(screen.getByText('23:30')).toBeTruthy();
  });

  it('clears the field when asked, which is an answer of its own', async () => {
    const onValueChange = jest.fn();
    render(<DateField label="Data" value="2026-03-14" onValueChange={onValueChange} />);
    await act(async () => {
      fireEvent.press(trigger());
    });
    await waitFor(() => expect(host().props.visible).toBe(true));
    fireEvent.press(screen.getByText('Cancella'));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });
});

describe('the trigger', () => {
  it('shows the placeholder while nothing has been chosen', () => {
    render(<DateField label="Data" placeholder="Scegli un giorno" onValueChange={jest.fn()} />);
    expect(screen.getByText('Scegli un giorno')).toBeTruthy();
  });

  it('hands the answer to a reader as words, not as an ISO string', () => {
    render(<DateField label="Data" value="2026-03-14" onValueChange={jest.fn()} />);
    expect(trigger().props.accessibilityValue.text).toMatch(/marzo/i);
  });

  it('reads the message out when the answer is wrong', () => {
    render(
      <DateField label="Data" error helperText="Serve una data" onValueChange={jest.fn()} />,
    );
    expect(trigger().props.accessibilityHint).toBe('Serve una data');
  });

  it('is inert when disabled', async () => {
    runtime.datePicker = { open: jest.fn().mockResolvedValue('2026-03-14') };
    render(<DateField label="Data" disabled onValueChange={jest.fn()} />);
    await act(async () => {
      fireEvent.press(trigger());
    });
    expect(runtime.datePicker.open).not.toHaveBeenCalled();
  });
});

describe('in a form', () => {
  it('registers and takes its value from the engine', async () => {
    // Answered through the picker rather than the grid, so the month on
    // screen does not depend on what day the suite is run.
    runtime.datePicker = { open: jest.fn().mockResolvedValue('2026-03-14') };
    render(
      <DashFormProvider>
        <DateField name="quando" label="Quando" />
      </DashFormProvider>,
    );
    await act(async () => {
      fireEvent.press(trigger());
    });
    await waitFor(() =>
      expect(trigger().props.accessibilityValue.text).toMatch(/marzo/i),
    );
  });

  it('is quiet about being unwired, since it is wired', () => {
    render(
      <DashFormProvider>
        <DateField name="quando" label="Quando" />
      </DashFormProvider>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('the provider', () => {
  it('takes the picker and puts it where the field can find it', async () => {
    // `runtime` is a proxy, so the reference that comes back out is not
    // the one that went in. What matters is that the field reaches it.
    const open = jest.fn().mockResolvedValue('2026-03-14');
    const picker: DatePickerAdapter = { open };
    const onValueChange = jest.fn();
    render(
      <DashforgeNativeProvider datePicker={picker}>
        <DateField label="Data" onValueChange={onValueChange} />
      </DashforgeNativeProvider>,
    );
    await act(async () => {
      fireEvent.press(trigger());
    });
    expect(open).toHaveBeenCalled();
    expect(onValueChange).toHaveBeenCalledWith('2026-03-14');
  });

  it('degrades to none rather than throwing', () => {
    render(
      <DashforgeNativeProvider>
        <DateField label="Data" onValueChange={jest.fn()} />
      </DashforgeNativeProvider>,
    );
    expect(runtime.datePicker).toBeNull();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'booking', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(<DateField label="Data" visibleWhen={() => false} onValueChange={jest.fn()} />);
    expect(screen.queryByText('Data')).toBeNull();
  });

  it('is inert when access disables it', async () => {
    runtime.datePicker = { open: jest.fn().mockResolvedValue('2026-03-14') };
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <DateField
          label="Data"
          onValueChange={jest.fn()}
          access={{ resource: 'booking', action: 'write', onUnauthorized: 'disable' }}
        />
      </RbacProvider>,
    );
    await act(async () => {
      fireEvent.press(trigger());
    });
    expect(runtime.datePicker.open).not.toHaveBeenCalled();
  });
});
