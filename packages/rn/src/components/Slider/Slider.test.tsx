import { DashFormProvider } from '@dashforge/forms';
import { RbacProvider, type RbacPolicy } from '@dashforge/rbac';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { setMode } from '../../theme/store';
import { semanticLight } from '../../tokens/semantic';
import { Slider, valueAt } from './Slider';

const flat = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.flat(9).filter(Boolean))
    : ((style ?? {}) as Record<string, unknown>);

const slider = () => screen.getByRole('adjustable');

let warn: jest.SpyInstance;

beforeEach(() => {
  setMode('light');
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

/**
 * The gesture itself is not exercised here: React Native's test renderer
 * does not run `PanResponder`. What is testable is the arithmetic, which
 * is why it lives outside the closure.
 */
describe('where a touch lands', () => {
  const limits = { min: 0, max: 100, step: 1 };

  it('reads the ends as the ends', () => {
    expect(valueAt(0, 200, limits)).toBe(0);
    expect(valueAt(200, 200, limits)).toBe(100);
  });

  it('reads the middle as the middle', () => {
    expect(valueAt(100, 200, limits)).toBe(50);
  });

  it('never leaves the fence, whatever the finger did', () => {
    expect(valueAt(-80, 200, limits)).toBe(0);
    expect(valueAt(900, 200, limits)).toBe(100);
  });

  it('lands on a step', () => {
    expect(valueAt(100, 200, { min: 0, max: 100, step: 10 })).toBe(50);
    expect(valueAt(107, 200, { min: 0, max: 100, step: 10 })).toBe(50);
    expect(valueAt(113, 200, { min: 0, max: 100, step: 10 })).toBe(60);
  });

  it('reaches the ceiling even when the step does not divide the range', () => {
    // With a step of three in a range of ten the reachable values are 0,
    // 3, 6 and 9. A slider whose far end means nine is one where the
    // ceiling cannot be answered at all.
    expect(valueAt(200, 200, { min: 0, max: 10, step: 3 })).toBe(10);
    expect(valueAt(0, 200, { min: 2, max: 10, step: 3 })).toBe(2);
  });

  it('does not put float noise in the payload', () => {
    // A slider that reported 0.30000000000000004 would put that in the
    // payload and in the request.
    expect(valueAt(60, 200, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
  });

  it('answers the floor before it has been measured', () => {
    expect(valueAt(50, 0, limits)).toBe(0);
  });
});

describe('what it shows', () => {
  it('writes the number beside the label', () => {
    render(<Slider label="Raggio" value={30} onValueChange={jest.fn()} />);
    expect(screen.getByText('Raggio')).toBeTruthy();
    expect(screen.getByText('30')).toBeTruthy();
  });

  it('writes it the way the caller asked', () => {
    // The rail says how far along; only the caller knows along what.
    render(
      <Slider label="Raggio" value={30} formatValue={(v) => `${v} km`} onValueChange={jest.fn()} />,
    );
    expect(screen.getByText('30 km')).toBeTruthy();
  });

  it('keeps quiet when it was told to', () => {
    render(<Slider label="Raggio" value={30} showValue={false} onValueChange={jest.fn()} />);
    expect(screen.queryByText('30')).toBeNull();
  });
});

describe('what it tells a screen reader', () => {
  it('hands over the number and its fence', () => {
    render(<Slider label="Raggio" min={10} max={50} value={30} onValueChange={jest.fn()} />);
    expect(slider().props.accessibilityValue).toEqual({
      min: 10,
      max: 50,
      now: 30,
      text: '30',
    });
  });

  it('can be answered without the gesture', () => {
    // A rail is a gesture, and a gesture is not something a reader can
    // make.
    const onValueChange = jest.fn();
    const onSlidingComplete = jest.fn();
    render(
      <Slider
        label="Raggio"
        value={30}
        step={5}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
      />,
    );
    act(() => {
      fireEvent(slider(), 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      });
    });
    expect(onValueChange).toHaveBeenCalledWith(35);
    expect(onSlidingComplete).toHaveBeenCalledWith(35);
  });

  it('stops at the ceiling when the reader keeps going', () => {
    const onValueChange = jest.fn();
    render(<Slider label="Raggio" max={40} value={40} onValueChange={onValueChange} />);
    act(() => {
      fireEvent(slider(), 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      });
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('being inert', () => {
  it('is dimmed and cannot be adjusted', () => {
    const onValueChange = jest.fn();
    render(<Slider label="Raggio" value={30} disabled onValueChange={onValueChange} />);
    expect(flat(slider().props.style).opacity).toBe(semanticLight.opacity.disabled);
    act(() => {
      fireEvent(slider(), 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      });
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('in a form', () => {
  it('is quiet about being unwired, since it is wired', () => {
    render(
      <DashFormProvider>
        <Slider name="sconto" label="Sconto" />
      </DashFormProvider>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('says so when it is wired to nothing at all', () => {
    render(<Slider label="Sconto" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Slider'));
  });
});

describe('the Dashforge props', () => {
  const POLICY: RbacPolicy = {
    roles: [{ name: 'viewer', permissions: [{ resource: 'price', action: 'read' }] }],
  };

  it('is gone when visibleWhen says so', () => {
    render(<Slider label="Raggio" value={1} onValueChange={jest.fn()} visibleWhen={() => false} />);
    expect(screen.queryByText('Raggio')).toBeNull();
  });

  it('is inert when access disables it', () => {
    const onValueChange = jest.fn();
    render(
      <RbacProvider policy={POLICY} subject={{ id: 'u1', roles: ['viewer'] }}>
        <Slider
          label="Raggio"
          value={30}
          onValueChange={onValueChange}
          access={{ resource: 'price', action: 'write', onUnauthorized: 'disable' }}
        />
      </RbacProvider>,
    );
    act(() => {
      fireEvent(slider(), 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      });
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
