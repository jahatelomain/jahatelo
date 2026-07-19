import AdminImage from './AdminImage';

type Props = {
  motelName: string;
  webPhoto: string | null;
  appPhoto: string | null;
};

export default function FeaturedPhotoDisplay({ motelName, webPhoto, appPhoto }: Props) {
  return (
    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-medium text-slate-500 uppercase">Foto principal</dt>
      {webPhoto || appPhoto ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <PhotoVariant label="Web (16:9)" photo={webPhoto} alt={`${motelName} - Web`} ratio="web" />
          <PhotoVariant label="App (4:5)" photo={appPhoto} alt={`${motelName} - App`} ratio="app" />
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-400">Sin foto principal</p>
      )}
    </div>
  );
}

function PhotoVariant({ label, photo, alt, ratio }: { label: string; photo: string | null; alt: string; ratio: 'web' | 'app' }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
      {photo ? (
        <div className="mt-2">
          <AdminImage src={photo} alt={alt} width={800} height={ratio === 'web' ? 450 : 1000} className={`w-full ${ratio === 'web' ? 'aspect-[16/9]' : 'aspect-[4/5]'} object-cover rounded-xl border border-slate-200 shadow-sm`} />
          <p className="mt-2 text-xs text-slate-500 truncate">{photo}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Sin foto {ratio}</p>
      )}
    </div>
  );
}
