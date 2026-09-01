export type ReportMetricInput = {
  createdAt: Date;
  resolvedAt: Date | null;
  status: string;
  reason: string;
  motel: { id: string; name: string };
};

export type ReportMetrics = {
  total: number;
  open: number;
  closed: number;
  averageResolutionHours: number | null;
  recurrentMotels: Array<{ motelId: string; motelName: string; reports: number; open: number }>;
  byReason: Array<{ reason: string; count: number }>;
};

export function calculateReportMetrics(reports: ReportMetricInput[]): ReportMetrics {
  const terminalStatuses = new Set(['RESOLVED', 'DISMISSED']);
  const resolutionHours = reports.flatMap((report) => {
    if (!report.resolvedAt) return [];
    const duration = report.resolvedAt.getTime() - report.createdAt.getTime();
    return duration >= 0 ? [duration / 3_600_000] : [];
  });
  const motelMap = new Map<string, { motelId: string; motelName: string; reports: number; open: number }>();
  const reasonMap = new Map<string, number>();

  for (const report of reports) {
    const motel = motelMap.get(report.motel.id) ?? {
      motelId: report.motel.id,
      motelName: report.motel.name,
      reports: 0,
      open: 0,
    };
    motel.reports += 1;
    if (!terminalStatuses.has(report.status)) motel.open += 1;
    motelMap.set(report.motel.id, motel);
    reasonMap.set(report.reason, (reasonMap.get(report.reason) ?? 0) + 1);
  }

  const closed = reports.filter((report) => terminalStatuses.has(report.status)).length;
  return {
    total: reports.length,
    open: reports.length - closed,
    closed,
    averageResolutionHours: resolutionHours.length
      ? Math.round((resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length) * 10) / 10
      : null,
    recurrentMotels: [...motelMap.values()]
      .filter((motel) => motel.reports >= 2)
      .sort((a, b) => b.reports - a.reports || b.open - a.open)
      .slice(0, 10),
    byReason: [...reasonMap.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}
