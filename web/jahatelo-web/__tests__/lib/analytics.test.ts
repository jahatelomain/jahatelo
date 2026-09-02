import { trackVisitor } from '@/lib/analytics';

describe('visitor analytics', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.cookie = 'jhtl_did=; Max-Age=0; path=/';
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it('crea una sesión y la reutiliza para los eventos posteriores', async () => {
    await trackVisitor({ event: 'page_view', path: '/' });
    await trackVisitor({ event: 'motel_view', path: '/moteles/demo' });

    expect(fetch).toHaveBeenCalledTimes(3);
    const payloads = (fetch as jest.Mock).mock.calls.map((call) => JSON.parse(call[1].body));
    expect(payloads.map((payload) => payload.event)).toEqual(['session_start', 'page_view', 'motel_view']);
    expect(new Set(payloads.map((payload) => payload.sessionId)).size).toBe(1);
    expect(new Set(payloads.map((payload) => payload.eventId)).size).toBe(3);
  });
});
