'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error('Error');
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
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

  const handleSelect = (item: any) => {
    setOpen(false);
    if (item.type === 'motel') {
      router.push(`/motels/${item.slug}`);
      return;
    }
    if (item.type === 'city') {
      router.push(`/motels?city=${encodeURIComponent(item.label)}`);
      return;
    }
    if (item.type === 'neighborhood') {
      router.push(`/motels?search=${encodeURIComponent(item.label)}`);
      return;
    }
    router.push(`/motels?search=${encodeURIComponent(query)}`);
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
        router.push(`/motels?search=${encodeURIComponent(query)}`);
      }
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Busca moteles, ciudades o barrios"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-black caret-black placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {suggestions.map((item, index) => (
            <button
              key={`${item.type}-${item.label}-${index}`}
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-3 text-sm ${index === activeIndex ? 'bg-purple-50' : 'bg-white'} hover:bg-purple-50`}
            >
              <div className="font-medium text-slate-900">{item.label}</div>
              {item.subtitle && <div className="text-xs text-slate-500">{item.subtitle}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
