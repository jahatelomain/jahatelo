'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';

const periodOptions = [7, 30, 90];

type AnalyticsResponse = {
  period: { days: number; startDate: string; endDate: string };
  summary: { totalViews: number; totalClicks: number; ctr: number };
  charts: {
    viewsByDay: { date: string; count: number }[];
    byDevice: { label: string; count: number }[];
    bySource: { label: string; count: number }[];
  };
};

export default function AdvertisementAnalyticsPage() {
  const params = useParams();
  const toast = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [title, setTitle] = useState('');
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const fetchAnalytics = async (selectedPeriod: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/banners/${id}/analytics?period=${selectedPeriod}`);
      if (!res.ok) throw new Error('Error al cargar analíticas');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar analíticas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTitle = async () => {
    try {
      const res = await fetch(`/api/admin/banners/${id}`);
      if (!res.ok) return;
      const ad = await res.json();
      setTitle(ad.title || 'Anuncio');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchTitle();
    fetchAnalytics(period);
  }, [id, period]);

  if (loading && !data) return <TableSkeleton />;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics de publicidad</h2>
          <p className="text-slate-500">{title}</p>
        </div>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2"
          value={period}
          onChange={(event) => setPeriod(Number(event.target.value))}
        >
          {periodOptions.map((value) => (
            <option key={value} value={value}>
              Últimos {value} días
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-500">Vistas</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.totalViews}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-500">Clicks</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.totalClicks}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-500">CTR</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.ctr}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Por dispositivo</h3>
              <div className="space-y-2">
                {data.charts.byDevice.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin datos.</p>
                ) : (
                  data.charts.byDevice.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm text-slate-600">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Por fuente</h3>
              <div className="space-y-2">
                {data.charts.bySource.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin datos.</p>
                ) : (
                  data.charts.bySource.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm text-slate-600">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Vistas por día</h3>
            <div className="space-y-2">
              {data.charts.viewsByDay.length === 0 ? (
                <p className="text-sm text-slate-400">Sin datos.</p>
              ) : (
                data.charts.viewsByDay.map((item) => (
                  <div key={item.date} className="flex items-center justify-between text-sm text-slate-600">
                    <span>{item.date}</span>
                    <span className="font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-500">Sin datos disponibles.</p>
      )}
    </div>
  );
}
