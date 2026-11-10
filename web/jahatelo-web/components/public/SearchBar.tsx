'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

type SearchSuggestion = {
  type: 'motel' | 'city' | string;
  label: string;
  slug?: string;
  subtitle?: string;
};

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setNoResults(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setNoResults(false);
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error('Error');
        const data: unknown = await res.json();
        const nextSuggestions = isSuggestionResponse(data) ? data.suggestions : [];
        setSuggestions(nextSuggestions);
        setNoResults(nextSuggestions.length === 0);
        setOpen(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setNoResults(true);
      }
      setLoading(false);
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (item: SearchSuggestion) => {
    setOpen(false);
    if (item.type === 'motel') {
      router.push(`/motels/${item.slug}`);
      return;
    }
    if (item.type === 'city') {
      router.push(`/search?city=${encodeURIComponent(item.label)}`);
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && (suggestions.length > 0 || loading || noResults);
  const activeDescendant =
    open && activeIndex >= 0 && suggestions[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <div className="relative z-[80]" ref={containerRef}>
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Busca moteles o ciudades"
        className="search-pulse w-full rounded-2xl border-0 bg-white/95 backdrop-blur-sm pl-12 pr-4 py-4 text-gray-900 caret-purple-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xl text-base"
      />

      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[90] overflow-hidden max-h-80 overflow-y-auto"
        >
          {loading && (
            <li aria-live="polite" aria-busy="true" className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
                <span className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </li>
          )}
          {!loading && noResults && (
            <li aria-live="polite" className="px-4 py-3 text-sm text-slate-500">
              Sin resultados para "{query}"
            </li>
          )}
          {!loading &&
            suggestions.map((item, index) => {
              const optionId = `${listboxId}-option-${index}`;
              const isActive = index === activeIndex;
              return (
                <li
                  key={`${item.type}-${item.label}-${index}`}
                  id={optionId}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full text-left px-4 py-3 text-sm cursor-pointer ${
                    isActive ? 'bg-purple-50' : 'bg-white'
                  } hover:bg-purple-50`}
                >
                  <div className="font-medium text-slate-900">{item.label}</div>
                  {item.subtitle && <div className="text-xs text-slate-500">{item.subtitle}</div>}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

function isSuggestionResponse(value: unknown): value is { suggestions: SearchSuggestion[] } {
  return typeof value === 'object' && value !== null &&
    Array.isArray((value as { suggestions?: unknown }).suggestions);
}