'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function Tabs({ tabs, defaultTab }: TabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const initialTab = tabFromQuery && tabs.some((tab) => tab.id === tabFromQuery)
    ? tabFromQuery
    : (defaultTab || tabs[0]?.id);
  const [activeTab, setActiveTab] = useState(initialTab);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Escuchar cambios en hash
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      const match = tabs.find((tab) => tab.id === hash);
      if (match) {
        setActiveTab(match.id);
      }
    };

    const frame = window.requestAnimationFrame(applyHash);
    window.addEventListener('hashchange', applyHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', applyHash);
    };
  }, [tabs]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Actualizar URL con query param
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;

    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex = Math.max(0, Math.min(tabs.length - 1, activeIndex + (dx < 0 ? 1 : -1)));
    if (nextIndex !== activeIndex) handleTabChange(tabs[nextIndex].id);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div key={activeTab} className="animate-[tabFadeIn_360ms_ease-out] py-6">
        {activeTabContent}
      </div>
    </div>
  );
}
