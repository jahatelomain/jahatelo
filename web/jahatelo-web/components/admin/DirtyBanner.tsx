'use client';

type DirtyBannerProps = {
  visible: boolean;
  message?: string;
};

export default function DirtyBanner({ visible, message = 'Cambios sin guardar' }: DirtyBannerProps) {
  if (!visible) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      {message}
    </div>
  );
}
