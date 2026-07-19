import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ ciudad: string; barrio: string }>;
};

// Conserva enlaces históricos sin seguir exponiendo ni consultando barrios.
export default async function LegacyNeighborhoodPage({ params }: Props) {
  const { ciudad } = await params;
  redirect(`/ciudad/${encodeURIComponent(ciudad)}`);
}
