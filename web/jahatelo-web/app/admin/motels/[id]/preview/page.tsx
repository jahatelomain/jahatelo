'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

type Motel = { name: string; city: string; description?: string | null; featuredPhoto?: string | null; featuredPhotoWeb?: string | null; featuredPhotoApp?: string | null; logoUrl?: string | null; plan?: string; status: string; isActive: boolean };

export default function MotelPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [motel, setMotel] = useState<Motel | null>(null);
  useEffect(() => { fetch(`/api/admin/motels/${id}?fresh=${Date.now()}`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).then(setMotel); }, [id]);
  if (!motel) return <main className="p-8 text-slate-500">Cargando previsualización…</main>;
  const webImage = motel.featuredPhotoWeb || motel.featuredPhoto || motel.featuredPhotoApp;
  const appImage = motel.featuredPhotoApp || motel.featuredPhoto || motel.featuredPhotoWeb;
  return <main className="space-y-7 p-4 md:p-8"><div><p className="text-sm font-semibold text-violet-600">Previsualización sin publicar</p><h1 className="text-3xl font-bold">{motel.name}</h1><p className="mt-1 text-slate-600">Así se verá el contenido guardado. Estado actual: {motel.status} · {motel.isActive ? 'habilitado' : 'deshabilitado'}.</p></div><div className="grid gap-8 xl:grid-cols-[1fr_390px]"><PreviewCard label="Web · 16:9" image={webImage} motel={motel} ratio="aspect-video" /><PreviewCard label="App · 4:5" image={appImage} motel={motel} ratio="aspect-[4/5]" /></div></main>;
}
function PreviewCard({ label, image, motel, ratio }: { label: string; image?: string | null; motel: Motel; ratio: string }) { return <section><p className="mb-2 text-sm font-semibold text-slate-500">{label}</p><article className={`relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl ${ratio}`}>{image ? <Image src={image} alt="" fill unoptimized className="object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-800" />}<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6 text-white"><p className="text-sm font-semibold text-fuchsia-200">{motel.city} · {motel.plan}</p><h2 className="mt-1 text-3xl font-bold">{motel.name}</h2>{motel.description && <p className="mt-2 line-clamp-2 text-sm text-white/80">{motel.description}</p>}</div></article></section>; }
