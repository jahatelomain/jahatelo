'use client';

import { useEffect, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  // Inicializar tab desde query params o hash en el primer render
  useEffect(() => {
    // Prioridad: query param > hash > default
    const tabFromQuery = searchParams.get('tab');
    const hash = window.location.hash.replace('#', '');

    let initialTab = defaultTab || tabs[0]?.id;

    if (tabFromQuery && tabs.find((tab) => tab.id === tabFromQuery)) {
      initialTab = tabFromQuery;
    } else if (hash && tabs.find((tab) => tab.id === hash)) {
      initialTab = hash;
    }

    setActiveTab(initialTab);
  }, []);

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

    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [tabs]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Actualizar URL con query param
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div>
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
      <div className="py-6">
        {activeTabContent}
      </div>
    </div>
  );
}
