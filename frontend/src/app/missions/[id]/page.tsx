import { MissionDetail } from "@/components/missions/mission-detail";

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MissionDetail id={id} />;
}
