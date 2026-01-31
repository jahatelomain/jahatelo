'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface ContactMessage {
  id: string;
  name: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InboxPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<{ readCount: number; unreadCount: number }>({
    readCount: 0,
    unreadCount: 0,
  });
  const pageSize = 20;
  const hasMore = messages.length < totalItems;
  const filtersKeyRef = useRef('');
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const { showToast } = useToast();

  const fetchMessages = async (isLoadingMore = false) => {
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (filter === 'read') params.set('status', 'read');
      if (filter === 'unread') params.set('status', 'unread');
      const response = await fetch(`/api/admin/inbox?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar mensajes');
      const data = await response.json();
      const messagesData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      const meta = Array.isArray(data) ? undefined : data?.meta;
      setMessages((prev) => (isLoadingMore ? [...prev, ...messagesData] : messagesData));
      setTotalItems(meta?.total ?? messagesData.length);
      setSummary({
        readCount: meta?.summary?.readCount ?? 0,
        unreadCount: meta?.summary?.unreadCount ?? 0,
      });
    } catch (error) {
      if (!isLoadingMore) {
        showToast('Error al cargar mensajes', 'error');
      }
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const nextKey = filter;
    if (filtersKeyRef.current !== nextKey) {
      filtersKeyRef.current = nextKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    const isLoadingMore = page > 1;
    fetchMessages(isLoadingMore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const { sentinelRef } = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: () => setPage((prev) => prev + 1),
    threshold: 200,
  });

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/inbox/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !currentStatus }),
      });

      if (!response.ok) throw new Error('Error al actualizar mensaje');

      await fetchMessages();
      showToast(
        !currentStatus ? 'Mensaje marcado como leído' : 'Mensaje marcado como no leído',
        'success'
      );
    } catch (error) {
      showToast('Error al actualizar mensaje', 'error');
      console.error('Error toggling read status:', error);
    }
  };

  const deleteMessage = async (id: string) => {
    setConfirmAction({
      title: 'Eliminar mensaje',
      message: '¿Estás seguro de eliminar este mensaje? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/inbox/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Error al eliminar mensaje');

          await fetchMessages();
          showToast('Mensaje eliminado exitosamente', 'success');
        } catch (error) {
          showToast('Error al eliminar mensaje', 'error');
          console.error('Error deleting message:', error);
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Inbox</h1>
          <p className="text-slate-600 mt-1">
            Mensajes de contacto recibidos ({summary.unreadCount} sin leer)
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({summary.readCount + summary.unreadCount})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            No leídos ({summary.unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'read'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Leídos ({summary.readCount})
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-slate-600">Cargando mensajes...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && messages.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            No hay mensajes {filter !== 'all' && filter === 'unread' ? 'sin leer' : 'leídos'}
          </h3>
          <p className="mt-2 text-slate-500">
            {filter === 'all'
              ? 'Aún no has recibido ningún mensaje de contacto.'
              : 'Cambia el filtro para ver otros mensajes.'}
          </p>
        </div>
      )}

      {/* Messages List */}
      {!loading && messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all shadow-sm ${
                message.isRead
                  ? 'border-slate-200'
                  : 'border-purple-300 bg-purple-50/30'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Status Indicator */}
                    <div className="mt-1">
                      {message.isRead ? (
                        <div className="w-3 h-3 rounded-full bg-slate-300" title="Leído" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-purple-600" title="No leído" />
                      )}
                    </div>

                    {/* Name and Date */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {message.name}
                        </h3>
                        <span className="text-sm text-slate-500">
                          {new Date(message.createdAt).toLocaleString('es-PY', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {message.phone && (
                        <p className="text-sm text-slate-600 mt-1">
                          📞 {message.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="pl-6">
                    <p className="text-slate-700 whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2 lg:items-end">
                  <button
                    onClick={() => toggleReadStatus(message.id, message.isRead)}
                    className="flex-1 lg:flex-initial px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    title={message.isRead ? 'Marcar como no leído' : 'Marcar como leído'}
                  >
                    {message.isRead ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        No leído
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Leído
                      </span>
                    )}
                  </button>
                  <details className="relative">
                    <summary className="list-none inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm-10 0a2 2 0 114 0 2 2 0 01-4 0z" />
                      </svg>
                    </summary>
                    <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel y loader */}
      {!loading && messages.length > 0 && (
        <div ref={sentinelRef}>
          {loadingMore && (
            <div className="flex justify-center items-center gap-2 py-4">
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-600">Cargando más mensajes...</span>
            </div>
          )}
          {!hasMore && totalItems > pageSize && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500">
                Mostrando todos los mensajes ({messages.length} de {totalItems})
              </p>
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText}
        cancelText={confirmAction?.cancelText}
        danger={confirmAction?.danger}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </div>
  );
}
