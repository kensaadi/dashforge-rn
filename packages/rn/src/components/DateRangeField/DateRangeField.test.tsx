import { useState } from 'react';
import { DashFormProvider } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { Modal as RNModal } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { DateRangeField } from './DateRangeField';
import { formatRange, formatShortDay, isComplete } from './dateRangeField.format';

const trigger = () => screen.getByRole('button', { name: /Periodo|Soggiorno/ });
const host = () => screen.UNSAFE_getByType(RNModal);

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

describe('how a range is written out', () => {
  it('writes both ends short', () => {
    // The long form twice over is a trigger nobody can read on a phone.
    const shown = formatRange({ start: '2026-03-14', end: '2026-03-20' }, 'it-IT');
    expect(shown).toMatch(/14/);
    expect(shown).toMatch(/20/);
    expect(shown).toContain('–');
  });

  it('drops from the first end whatever the second one already says', () => {
    // Inside one month the month and the year belong to the second end
    // only; inside one year, the year does. Across years, both write out.
    expect(formatRange({ start: '2026-03-14', end: '2026-03-20' }, 'it-IT')).toBe(
      '14 – 20 mar 2026',
    );
    expect(formatRange({ start: '2026-03-14', end: '2026-04-03' }, 'it-IT')).toBe(
      '14 mar – 3 apr 2026',
    );
    expect(formatRange({ start: '2026-12-30', end: '2027-01-02' }, 'it-IT')).toBe(
      '30 dic 2026 – 2 gen 2027',
    );
  });

  it('writes the first end alone while the second is being hunted for', () => {
    // Which is what tells somebody the field heard the first press.
    const shown = formatRange({ start: '2026-03-14', end: null }, 'it-IT');
    expect(shown).toMatch(/14/);
    expect(shown?.trim().endsWith('–')).toBe(true);
  });

  it('writes nothing at all when nothing has been chosen', () => {
    expect(formatRange({ start: null, end: null }, 'it-IT')).toBeNull();
    expect(formatRange(undefined, 'it-IT')).toBeNull();
  });

  it('shows nothing rather than rubbish', () => {
    expect(formatShortDay('non una data', 'it-IT')).toBeNull();
    expect(formatShortDay('2026-13-45', 'it-IT')).toBeNull();
  });

  it('knows when the answer is whole', () => {
    expect(isComplete({ start: '2026-03-14', end: '2026-03-20' })).toBe(true);
    expect(isComplete({ start: '2026-03-14', end: null })).toBe(false);
    expect(isComplete(undefined)).toBe(false);
  });
});

describe('the two presses', () => {
  it('reports the half-picked range as well as the finished one', () => {
    const onValueChange = jest.fn();
    render(
      <DateRangeField
        label="Periodo"
        value={{ start: null, end: null }}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.press(trigger());
    fireEvent.press(screen.getAllByRole('button', { name: /2026/ })[10]!);
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({ end: null }),
    );
  });

  it('stays open after the first and closes after the second', async () => {
    function Host() {
      const [range, setRange] = useState<{ start: string | null; end: string | null }>({
        start: null,
        end: null,
      });
      return (
        <DateRangeField label="Periodo" value={range} onValueChange={setRange} />
      );
    }
    render(<Host />);
    fireEvent.press(trigger());
    await waitFor(() => expect(host().props.visible).toBe(true));

    const days = screen.getAllByRole('button', { name: /2026/ });
    fireEvent.press(days[10]!);
    expect(host().props.visible).toBe(true);

    fireEvent.press(screen.getAllByRole('button', { name: /2026/ })[14]!);
    await waitFor(() => expect(host().props.visible).toBe(false));
  });

  it('says which press is next', () => {
    // The one thing a range picker has to say and most of them do not.
    render(
      <DateRangeField
        label="Periodo"
        value={{ start: '2026-03-14', end: null }}
        onValueChange={jest.fn()}
      />,
    );
    fireEvent.press(trigger());
    expect(screen.getByText(/Scegli la fine/)).toBeTruthy();
  });

  it('asks for the first one when there is nothing yet', () => {
    render(
      <DateRangeField
        label="Periodo"
        value={{ start: null, end: null }}
        onValueChange={jest.fn()}
      />,
    );
    fireEvent.press(trigger());
    expect(screen.getByText(/Scegli il primo giorno/)).toBeTruthy();
  });
});

describe('the trigger', () => {
  it('shows the placeholder while nothing has been chosen', () => {
    render(
      <DateRangeField
        label="Periodo"
        placeholder="Quando"
        value={{ start: null, end: null }}
        onValueChange={jest.fn()}
      />,
    );
    expect(screen.getByText('Quando')).toBeTruthy();
  });

  it('hands the answer to a reader as words', () => {
    render(
      <DateRangeField
        label="Periodo"
        value={{ start: '2026-03-14', end: '2026-03-20' }}
        onValueChange={jest.fn()}
      />,
    );
    expect(trigger().props.accessibilityValue.text).toContain('–');
  });

  it('is inert when disabled', () => {
    render(
      <DateRangeField
        label="Periodo"
        value={{ start: null, end: null }}
        disabled
        onValueChange={jest.fn()}
      />,
    );
    fireEvent.press(trigger());
    expect(host().props.visible).toBe(false);
  });
});

describe('in a form', () => {
  it('writes one field holding both ends', () => {
    // A range is one answer with two ends and not two answers.
    render(
      <DashFormProvider>
        <DateRangeField name="soggiorno" label="Soggiorno" />
      </DashFormProvider>,
    );
    fireEvent.press(trigger());
    fireEvent.press(screen.getAllByRole('button', { name: /2026|2025|2027/ })[10]!);
    expect(trigger().props.accessibilityValue.text).toBeTruthy();
  });

  it('is quiet about being unwired, since it is wired', () => {
    render(
      <DashFormProvider>
        <DateRangeField name="soggiorno" label="Soggiorno" />
      </DashFormProvider>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'booking', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(
      <DateRangeField
        label="Periodo"
        value={{ start: null, end: null }}
        onValueChange={jest.fn()}
        visibleWhen={() => false}
      />,
    );
    expect(screen.queryByText('Periodo')).toBeNull();
  });

  it('is inert when access disables it', () => {
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <DateRangeField
          label="Periodo"
          value={{ start: null, end: null }}
          onValueChange={jest.fn()}
          access={{ resource: 'booking', action: 'write', onUnauthorized: 'disable' }}
        />
      </RbacProvider>,
    );
    fireEvent.press(trigger());
    expect(host().props.visible).toBe(false);
  });
});
