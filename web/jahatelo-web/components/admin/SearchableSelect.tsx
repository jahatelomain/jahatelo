'use client';

import { useId, useMemo, useState } from 'react';

type Option = { value: string; label: string; searchText?: string };
type Props = { value: string; options: Option[]; placeholder: string; disabled?: boolean; required?: boolean; onChange: (value: string) => void };

export default function SearchableSelect({ value, options, placeholder, disabled, required, onChange }: Props) {
  const selected = options.find((option) => option.value === value);
  const listboxId = useId();
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized || selected?.label === query) return options;
    return options.filter((option) => `${option.label} ${option.searchText ?? ''}`.toLocaleLowerCase('es').includes(normalized));
  }, [options, query, selected?.label]);

  return (
    <div className="relative">
      <input
        value={open ? query : selected?.label ?? query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); if (!event.target.value) onChange(''); }}
        onFocus={() => { setQuery(selected?.label ?? ''); setOpen(true); }}
        onBlur={() => window.setTimeout(() => { setOpen(false); setQuery(selected?.label ?? ''); }, 120)}
        placeholder={placeholder}
        disabled={disabled}
        required={required && !value}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-slate-100"
      />
      {open && !disabled && (
        <div id={listboxId} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
          {filtered.length ? filtered.map((option) => (
            <button key={option.value} role="option" aria-selected={option.value === value} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(option.value); setQuery(option.label); setOpen(false); }} className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-purple-50">
              {option.label}
            </button>
          )) : <p className="px-4 py-3 text-sm text-slate-400">Sin resultados</p>}
        </div>
      )}
    </div>
  );
}
