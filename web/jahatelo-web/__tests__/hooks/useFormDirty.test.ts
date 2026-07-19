import { act, renderHook } from '@testing-library/react';
import useFormDirty from '@/hooks/useFormDirty';

describe('useFormDirty', () => {
  it('captures the form when it opens and detects subsequent changes', () => {
    const { result, rerender } = renderHook(
      ({ value, active }) => useFormDirty(value, active),
      { initialProps: { value: { name: 'Inicial' }, active: false } },
    );

    expect(result.current).toBe(false);

    act(() => rerender({ value: { name: 'Inicial' }, active: true }));
    expect(result.current).toBe(false);

    act(() => rerender({ value: { name: 'Editado' }, active: true }));
    expect(result.current).toBe(true);
  });

  it('resets the snapshot after closing and reopening', () => {
    const { result, rerender } = renderHook(
      ({ value, active }) => useFormDirty(value, active),
      { initialProps: { value: { name: 'A' }, active: true } },
    );

    act(() => rerender({ value: { name: 'B' }, active: true }));
    expect(result.current).toBe(true);

    act(() => rerender({ value: { name: 'B' }, active: false }));
    act(() => rerender({ value: { name: 'B' }, active: true }));
    expect(result.current).toBe(false);
  });
});
