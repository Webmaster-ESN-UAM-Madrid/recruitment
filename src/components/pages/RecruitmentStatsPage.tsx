"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme, alpha } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MuiTooltip from "@mui/material/Tooltip";
import dynamic from "next/dynamic";
import type {
  ForceGraphMethods,
  ForceGraphProps,
  GraphData,
  NodeObject,
  LinkObject
} from "react-force-graph-2d";
import {
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";
import ActivityCalendar from "../calendar/ActivityCalendar";

interface StatsData {
  totalCandidates: number;
  totalInterviews: number;
  pendingInterviews: number;
  interviewedCandidatesCount: number;
  interviewedActiveCandidatesCount: number;
  committeeInterests: Record<string, { count: number; color?: string }>;
  eventAttendance: Record<string, { yes: number; maybe: number; no: number }>;
  currentRecruitmentId: string;
  inactiveCandidates: number;
  activities: any[];
  allCandidates: any[];
  newbieVoteGraph?: {
    nodes: VoteGraphNode[];
    links: VoteGraphLink[];
  };
}

interface VoteGraphNode {
  id: string;
  name: string;
  photoUrl: string;
  active: boolean;
  votesReceived: number;
  votesGiven: number;
  hasOutgoingVotes: boolean;
}

interface VoteGraphLink {
  source: string;
  target: string;
  value: number;
}

type VoteGraphNodeWithVal = VoteGraphNode & { val: number };
type VoteGraphNodeObject = VoteGraphNodeWithVal & NodeObject;
type VoteGraphLinkObject = VoteGraphLink & LinkObject;
type ForceGraphRef = ForceGraphMethods<VoteGraphNodeObject, VoteGraphLinkObject>;

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f7f",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#ffc0cb"
];

const DEFAULT_AVATAR = "/default-avatar.jpg";
const RANKING_GRID_TEMPLATE = "60px 250px 140px 1fr";
const MAX_VISIBLE_RANKING_ROWS = 4;

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false
}) as unknown as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<ForceGraphProps<VoteGraphNodeObject, VoteGraphLinkObject>> &
    React.RefAttributes<ForceGraphRef>
>;

function StatCard({
  title,
  value,
  icon
}: {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            title={title}
            sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} mt={0.5}>
            {value}
          </Typography>
        </Box>
        <Box color="text.secondary">{icon}</Box>
      </Box>
    </Paper>
  );
}

export default function RecruitmentStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Responsive helpers
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.down("md"));
  const chartHeight = isXs ? 220 : isMd ? 260 : 320;
  const graphRef = useRef<ForceGraphRef | null>(null);
  const setGraphRef = useCallback((instance: ForceGraphRef | null) => {
    graphRef.current = instance;
  }, []);
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 });
  const imageCache = useRef(new Map<string, HTMLImageElement>());
  const voteGraphData = useMemo<GraphData<VoteGraphNodeObject, VoteGraphLinkObject> | null>(() => {
    if (!stats?.newbieVoteGraph) return null;
    const nodes: VoteGraphNodeObject[] = stats.newbieVoteGraph.nodes.map((node) => ({
      ...node,
      val: Math.max(1, node.votesReceived + 1)
    })) as VoteGraphNodeObject[];
    const links: VoteGraphLinkObject[] = stats.newbieVoteGraph.links.map((link) => ({
      ...link
    })) as VoteGraphLinkObject[];
    return { nodes, links };
  }, [stats]);

  const voteTotals = useMemo(() => {
    if (!stats?.newbieVoteGraph) return { voters: 0, votes: 0 };
    const voters = stats.newbieVoteGraph.nodes.filter((node) => node.votesGiven > 0).length;
    const votes = stats.newbieVoteGraph.links.reduce((sum, link) => sum + link.value, 0);
    return { voters, votes };
  }, [stats]);

  const voteSummary = useMemo(() => {
    if (!stats?.newbieVoteGraph)
      return [] as Array<{
        node: VoteGraphNode;
        voters: Array<{ id: string; name: string; photoUrl: string }>;
        votesReceived: number;
      }>;

    const nodeById = new Map(stats.newbieVoteGraph.nodes.map((node) => [node.id, node]));
    const votersByCandidate = new Map<string, Set<string>>();

    for (const link of stats.newbieVoteGraph.links) {
      const targetId = String(link.target);
      const sourceId = String(link.source);
      if (!votersByCandidate.has(targetId)) {
        votersByCandidate.set(targetId, new Set());
      }
      votersByCandidate.get(targetId)!.add(sourceId);
    }

    return stats.newbieVoteGraph.nodes
      .map((node) => {
        const voterIds = votersByCandidate.get(node.id) ?? new Set<string>();
        const voters = Array.from(voterIds)
          .map((id) => nodeById.get(id))
          .filter((candidate): candidate is VoteGraphNode => Boolean(candidate))
          .map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            photoUrl: candidate.photoUrl || DEFAULT_AVATAR
          }));

        return {
          node,
          voters,
          votesReceived: node.votesReceived
        };
      })
      .sort((a, b) => b.votesReceived - a.votesReceived || a.node.name.localeCompare(b.node.name));
  }, [stats]);

  // ── Candidate Activity Stacked Bar Chart data ──
  const { candidateActivityData, activityCommittees } = useMemo(() => {
    if (!stats) return { candidateActivityData: [], activityCommittees: [] as string[] };
    const committeeColorMap: Record<string, string> = {};
    for (const [name, d] of Object.entries(stats.committeeInterests)) {
      if (d.color) committeeColorMap[name] = d.color;
    }

    const candidateMap = new Map<string, { name: string; photoUrl: string }>();
    for (const c of stats.allCandidates as any[]) {
      candidateMap.set(String(c.id), {
        name: c.name ?? "Sin nombre",
        photoUrl: c.photoUrl || DEFAULT_AVATAR
      });
    }

    const dataMap = new Map<
      string,
      {
        _name: string;
        _photoUrl: string;
        _total: number;
        _tooltips: Record<string, string[]>;
        [committee: string]: any;
      }
    >();
    const committeeSet = new Set<string>();

    for (const activity of stats.activities as any[]) {
      const committee = activity.committee || "Sin comité";
      committeeSet.add(committee);
      for (const candidateId of activity.candidates ?? []) {
        const id = String(candidateId);
        const candidateInfo = candidateMap.get(id);
        if (!candidateInfo) continue;
        if (!dataMap.has(id)) {
          dataMap.set(id, {
            _name: candidateInfo.name,
            _photoUrl: candidateInfo.photoUrl,
            _total: 0,
            _tooltips: {}
          });
        }
        const entry = dataMap.get(id)!;
        entry[committee] = (entry[committee] || 0) + 1;
        entry._total += 1;
        if (!entry._tooltips[committee]) entry._tooltips[committee] = [];
        entry._tooltips[committee].push(activity.title || "Actividad");
      }
    }

    const sorted = Array.from(dataMap.values()).sort((a, b) => b._total - a._total);
    const committees = Array.from(committeeSet);
    return { candidateActivityData: sorted, activityCommittees: committees };
  }, [stats]);

  // ── Popular Committees Horizontal Bar data ──
  const popularCommitteeData = useMemo(() => {
    if (!stats) return [];
    const committeeColorMap: Record<string, string> = {};
    for (const [name, d] of Object.entries(stats.committeeInterests)) {
      if (d.color) committeeColorMap[name] = d.color;
    }

    const countMap = new Map<string, number>();
    for (const activity of stats.activities as any[]) {
      const committee = activity.committee || "Sin comité";
      const candidatesCount = (activity.candidates ?? []).length;
      countMap.set(committee, (countMap.get(committee) ?? 0) + candidatesCount);
    }

    return Array.from(countMap.entries())
      .map(([committee, count]) => ({
        committee,
        count,
        color: committeeColorMap[committee] || COLORS[0]
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  // Committee color lookup for the stacked bars
  const committeeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!stats) return map;
    for (const [name, d] of Object.entries(stats.committeeInterests)) {
      if (d.color) map[name] = d.color;
    }
    return map;
  }, [stats]);

  const hasMoreVotes = voteSummary.length > MAX_VISIBLE_RANKING_ROWS;

  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      setGraphSize({ width, height });
    });
    observer.observe(container);
    setGraphSize({ width: container.clientWidth, height: container.clientHeight });
    return () => observer.disconnect();
  }, [voteGraphData, isXs, isMd]);

  const getNodeRadius = useCallback((node: VoteGraphNodeObject) => {
    const baseRadius = 6;
    const scale = 1.75;
    return baseRadius + Math.log2((node.votesReceived ?? 0) + 1) * scale;
  }, []);

  const getImage = useCallback((url: string) => {
    if (!url) return null;
    const cache = imageCache.current;
    let image = cache.get(url);
    if (!image) {
      image = new Image();
      image.src = url;
      cache.set(url, image);
    }
    return image;
  }, []);

  const nodeCanvasObject = useCallback<
    NonNullable<ForceGraphProps<VoteGraphNodeObject, VoteGraphLinkObject>["nodeCanvasObject"]>
  >(
    (nodeObj, ctx, _globalScale) => {
      void _globalScale;
      const radius = getNodeRadius(nodeObj);
      const x = nodeObj.x ?? 0;
      const y = nodeObj.y ?? 0;
      const image = getImage(nodeObj.photoUrl);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();

      if (image && image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
      } else {
        ctx.fillStyle = theme.palette.grey[300] ?? "#d1d1d1";
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      ctx.restore();

      if (!nodeObj.active && nodeObj.votesGiven > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = theme.palette.mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.5)";
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = theme.palette.background.paper;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    },
    [getImage, getNodeRadius, theme]
  );

  const nodePointerAreaPaint = useCallback<
    NonNullable<ForceGraphProps<VoteGraphNodeObject, VoteGraphLinkObject>["nodePointerAreaPaint"]>
  >(
    (nodeObj, color, ctx) => {
      const radius = getNodeRadius(nodeObj);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nodeObj.x ?? 0, nodeObj.y ?? 0, radius, 0, 2 * Math.PI);
      ctx.fill();
    },
    [getNodeRadius]
  );

  useEffect(() => {
    if (!graphRef.current || !voteGraphData || voteGraphData.nodes.length === 0) return;
    const fg = graphRef.current;
    const chargeForce = fg.d3Force("charge");
    if (chargeForce?.strength) {
      chargeForce.strength(-250);
    }
    const linkForce = fg.d3Force("link");
    if (linkForce?.distance) {
      linkForce.distance(250);
    }
    if (linkForce?.strength) {
      linkForce.strength(0.05);
    }
    const timeout = window.setTimeout(() => {
      fg.zoomToFit(600, 48);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [voteGraphData]);

  const nodeLabelAccessor = useCallback(
    (node: VoteGraphNodeObject) => `${node.name}<br>Votos recibidos: ${node.votesReceived}`,
    []
  );

  const linkWidthAccessor = useCallback((link: VoteGraphLinkObject) => {
    const value = link.value ?? 1;
    return Math.min(6, 1 + (value - 1) * 0.8);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats/recruitment");
        if (!res.ok) throw new Error("No se pudieron obtener las estadísticas");
        const data: StatsData = await res.json();
        setStats(data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Ha ocurrido un error";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <Typography color="error">{error || "Sin datos"}</Typography>
      </Box>
    );
  }

  const committeeData = Object.entries(stats.committeeInterests)
    .map(([name, d]) => ({ name, count: d.count, color: d.color }))
    .sort((a, b) => {
      const aIsGD = /^gd?[at]/i.test(a.name.trim()); // gda or gdt
      const bIsGD = /^gd?[at]/i.test(b.name.trim());
      if (aIsGD !== bIsGD) return aIsGD ? 1 : -1; // place gda/gdt at the end
      return b.count - a.count; // sort descending within each group
    });
  const eventData = Object.entries(stats.eventAttendance).map(([name, v]) => ({
    name,
    yes: v.yes,
    maybe: v.maybe,
    no: v.no
  }));

  const interviewRate = stats
    ? Math.round((stats.interviewedActiveCandidatesCount / (stats.totalCandidates || 1)) * 100)
    : 0;

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Estadísticas de reclutamiento
        </Typography>
        <Typography color="text.secondary">
          Reclutamiento actual: {stats.currentRecruitmentId}
        </Typography>
      </Box>

      {/* Stats cards */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(7, 1fr)" }
        }}
      >
        <Box>
          <StatCard title="Cands. activos" value={stats.totalCandidates} />
        </Box>
        <Box>
          <StatCard title="Entrev. realizadas" value={stats.totalInterviews} />
        </Box>
        <Box>
          <StatCard title="Entrev. pendientes" value={stats.pendingInterviews} />
        </Box>
        <Box>
          <StatCard title="Entrevistados (totales)" value={stats.interviewedCandidatesCount} />
        </Box>
        <Box>
          <StatCard
            title="Entrevistados (activos)"
            value={stats.interviewedActiveCandidatesCount}
          />
        </Box>
        <Box>
          <StatCard title="Tasa entrevistas" value={`${interviewRate}%`} />
        </Box>
        <Box>
          <StatCard title="Cands. inactivos" value={stats.inactiveCandidates} />
        </Box>
      </Box>

      <Box
        sx={{
          mt: 1,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }
        }}
      >
        {/* Committee interests bar chart */}
        <Box>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Intereses por comité
            </Typography>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={committeeData}
                margin={{ top: 5, right: 10, left: isXs ? 0 : 10, bottom: isXs ? 10 : 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={isXs ? "preserveStartEnd" : 0}
                  angle={isXs ? 0 : -20}
                  textAnchor={isXs ? "middle" : "end"}
                  height={isXs ? 40 : 60}
                />
                <YAxis allowDecimals={false} />
                <RechartsTooltip
                  formatter={(value: number) => [value, "Total"]}
                  labelFormatter={(label: string | number) => <strong>{String(label)}</strong>}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {committeeData.map((entry, index) => (
                    <Cell
                      key={`cell-committee-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Event attendance stacked bar chart */}
        <Box>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Asistencia a eventos (Sí / Quizás / No)
            </Typography>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={eventData}
                margin={{ top: 5, right: 10, left: isXs ? 0 : 10, bottom: isXs ? 10 : 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={isXs ? "preserveStartEnd" : 0}
                  angle={0}
                  textAnchor="middle"
                  height={isXs ? 40 : 60}
                />
                <YAxis allowDecimals={false} />
                <RechartsTooltip
                  labelFormatter={(label: string | number) => <strong>{String(label)}</strong>}
                />
                <Bar dataKey="yes" fill="#4caf50" name="Sí" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maybe" fill="#ff9800" name="Quizás" radius={[4, 4, 0, 0]} />
                <Bar dataKey="no" fill="#f44336" name="No" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>

      {/* Event details table */}
      <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" mb={2}>
          Detalle de asistencia a eventos (Sí / Quizás / No)
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e0e0e0" }}>
                  Evento
                </th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e0e0e0" }}>
                  Sí
                </th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e0e0e0" }}>
                  Quizás
                </th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e0e0e0" }}>
                  No
                </th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e0e0e0" }}>
                  Total
                </th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #e0e0e0" }}>
                  % Sí (de respuestas)
                </th>
              </tr>
            </thead>
            <tbody>
              {eventData.map((row) => {
                const total = row.yes + row.maybe + row.no;
                const pctYes = total > 0 ? Math.round((row.yes / total) * 100) : 0;
                return (
                  <tr key={row.name}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{row.name}</td>
                    <td
                      style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}
                    >
                      {row.yes}
                    </td>
                    <td
                      style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}
                    >
                      {row.maybe}
                    </td>
                    <td
                      style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}
                    >
                      {row.no}
                    </td>
                    <td
                      style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}
                    >
                      {total}
                    </td>
                    <td
                      style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}
                    >
                      {pctYes}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Paper>

      {/* Activity Calendar Section */}
      <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Calendario de Actividades
        </Typography>
        <ActivityCalendar 
          activities={stats.activities.map(a => ({
            ...a,
            date: a.date ? new Date(a.date).toISOString() : undefined
          }))} 
          candidates={stats.allCandidates} 
          mode="stats"
          committeeColors={Object.fromEntries(
            Object.entries(stats.committeeInterests).map(([name, d]) => [name, d.color || ""])
          )}
        />
      </Paper>

      {/* ── Candidate Activity & Popular Committees Charts ── */}
      {candidateActivityData.length > 0 && (
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }
          }}
        >
          {/* Left: Candidates by activities (stacked) */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Asistencia de candidato
            </Typography>
            <ResponsiveContainer width="100%" height={Math.max(chartHeight, 360)}>
              <BarChart
                data={candidateActivityData}
                margin={{ top: 48, right: 10, left: isXs ? 0 : 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="_name"
                  tick={false}
                  height={5}
                />
                <YAxis allowDecimals={false} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0]?.payload;
                    if (!data) return null;
                    return (
                      <Paper
                        elevation={3}
                        sx={{
                          p: 1.5,
                          maxWidth: 280,
                          bgcolor: "background.paper"
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Avatar
                            src={data._photoUrl !== DEFAULT_AVATAR ? data._photoUrl : undefined}
                            alt={data._name}
                            sx={{ width: 28, height: 28, fontSize: 13, fontWeight: 700 }}
                          >
                            {data._name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {data._name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({data._total})
                          </Typography>
                        </Box>
                        {Object.entries(data._tooltips as Record<string, string[]>).map(
                          ([committee, activities]) => (
                            <Box key={committee} mb={0.5}>
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{ color: committeeColorMap[committee] || "text.primary" }}
                              >
                                {committee}
                              </Typography>
                              {(activities as string[]).map((actName, i) => (
                                <Typography
                                  key={i}
                                  variant="caption"
                                  display="block"
                                  sx={{ pl: 1, color: "text.secondary" }}
                                >
                                  • {actName}
                                </Typography>
                              ))}
                            </Box>
                          )
                        )}
                      </Paper>
                    );
                  }}
                />

                {activityCommittees.map((committee, idx) => (
                  <Bar
                    key={committee}
                    dataKey={committee}
                    stackId="activities"
                    fill={committeeColorMap[committee] || COLORS[idx % COLORS.length]}
                    name={committee}
                    shape={((props: any) => {
                      const { x, y, width, height, fill: barFill, payload } = props;
                      if (!width || !height) return null;
                      // Check if this is the topmost segment: no later committee has a value
                      const isTop = activityCommittees
                        .slice(idx + 1)
                        .every((c) => !payload?.[c]);
                      const r = isTop ? 4 : 0;
                      if (r === 0) {
                        return <rect x={x} y={y} width={width} height={height} fill={barFill} />;
                      }
                      const clampedR = Math.min(r, width / 2, height);
                      return (
                        <path
                          d={`M${x},${y + clampedR}
                              Q${x},${y} ${x + clampedR},${y}
                              L${x + width - clampedR},${y}
                              Q${x + width},${y} ${x + width},${y + clampedR}
                              L${x + width},${y + height}
                              L${x},${y + height}Z`}
                          fill={barFill}
                        />
                      );
                    }) as any}
                  >
                    {/* Show profile pic on top of the last stacked segment */}
                    {idx === activityCommittees.length - 1 && (
                      <LabelList
                        content={(props: any) => {
                          const { x, width, y, index } = props;
                          if (index == null || !candidateActivityData[index]) return null;
                          const entry = candidateActivityData[index];
                          const imgSize = 28;
                          const cx = (x ?? 0) + (width ?? 0) / 2;
                          const cy = (y ?? 0) - imgSize / 2 - 4;
                          const hasPhoto = entry._photoUrl && entry._photoUrl !== DEFAULT_AVATAR;
                          return (
                            <foreignObject
                              x={cx - imgSize / 2}
                              y={cy - imgSize / 2}
                              width={imgSize}
                              height={imgSize}
                            >
                              {hasPhoto ? (
                                <img
                                  src={entry._photoUrl}
                                  alt={entry._name}
                                  style={{
                                    width: imgSize,
                                    height: imgSize,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: `2px solid ${theme.palette.background.paper}`
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: imgSize,
                                    height: imgSize,
                                    borderRadius: "50%",
                                    backgroundColor: theme.palette.grey[400],
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    border: `2px solid ${theme.palette.background.paper}`
                                  }}
                                >
                                  {entry._name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                              )}
                            </foreignObject>
                          );
                        }}
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Right: Most popular committees */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Comités con mayor asistencia
            </Typography>
            <ResponsiveContainer
              width="100%"
              height={Math.max(chartHeight, popularCommitteeData.length * 44 + 40)}
            >
              <BarChart
                data={popularCommitteeData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: isXs ? 10 : 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="committee"
                  width={isXs ? 80 : 120}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip
                  formatter={(value: number) => [value, "Participaciones"]}
                  labelFormatter={(label: string | number) => <strong>{String(label)}</strong>}
                />
                <Bar dataKey="count" name="Participaciones" radius={[0, 4, 4, 0]}>
                  {popularCommitteeData.map((entry, index) => (
                    <Cell key={`cell-pop-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      )}

      <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" mb={2}>
          Red de votos de newbies
        </Typography>
        {voteGraphData && voteGraphData.nodes.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {voteTotals.votes} votos emitidos por {voteTotals.voters} newbies. Arrastra los nodos
              para explorar conexiones y pasa el ratón por encima para ver nombres.
            </Typography>
            <Box
              ref={graphContainerRef}
              sx={{
                width: "100%",
                height: { xs: 340, sm: 420, lg: 520 },
                position: "relative",
                "& canvas": {
                  borderRadius: 1
                }
              }}
            >
              {graphSize.width > 0 && graphSize.height > 0 && voteGraphData && (
                <ForceGraph2D
                  ref={setGraphRef}
                  graphData={voteGraphData}
                  width={graphSize.width}
                  height={graphSize.height}
                  nodeCanvasObject={nodeCanvasObject}
                  nodePointerAreaPaint={nodePointerAreaPaint}
                  nodeLabel={
                    nodeLabelAccessor as ForceGraphProps<
                      VoteGraphNodeObject,
                      VoteGraphLinkObject
                    >["nodeLabel"]
                  }
                  backgroundColor={theme.palette.background.default}
                  linkColor={() =>
                    theme.palette.mode === "dark" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.28)"
                  }
                  linkWidth={
                    linkWidthAccessor as ForceGraphProps<
                      VoteGraphNodeObject,
                      VoteGraphLinkObject
                    >["linkWidth"]
                  }
                  linkDirectionalArrowLength={0}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleSpeed={0.0035}
                  cooldownTicks={140}
                  onEngineStop={() => {
                    graphRef.current?.zoomToFit(500, 40);
                  }}
                />
              )}
            </Box>
          </>
        ) : (
          <Typography color="text.secondary">
            Aún no hay votos registrados en el sistema.
          </Typography>
        )}
      </Paper>

      {voteSummary.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" mb={2}>
            Ranking de candidatos por votos
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Box
              sx={{
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
                minWidth: "max-content"
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: RANKING_GRID_TEMPLATE,
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5 },
                  px: { xs: 1, sm: 1.5 },
                  py: 1,
                  backgroundColor: "background.paper",
                  borderBottom: "1px solid",
                  borderColor: "divider"
                }}
              >
                <p style={{ fontWeight: "bold", textAlign: "center" }}>Avatar</p>
                <p style={{ fontWeight: "bold" }}>Nombre</p>
                <p style={{ fontWeight: "bold", textAlign: "center" }}>Votos recibidos</p>
                <p style={{ fontWeight: "bold" }}>Votantes</p>
              </Box>
              <Box
                sx={{
                  position: "relative",
                  maxHeight: expanded ? 2000 : 300,
                  overflow: "hidden",
                  transition: (theme) =>
                    theme.transitions.create("max-height", {
                      duration: 400,
                      easing: theme.transitions.easing.easeInOut
                    })
                }}
              >
                {voteSummary.map((detail, index) => {
                  const candidatePhoto = detail.node.photoUrl || DEFAULT_AVATAR;
                  const hasVoters = detail.voters.length > 0;
                  const fadeStep = index - (MAX_VISIBLE_RANKING_ROWS - 1);
                  const opacity =
                    expanded || index < MAX_VISIBLE_RANKING_ROWS
                      ? 1
                      : Math.max(0.15, 1 - fadeStep * 0.18);
                  return (
                    <Box
                      key={detail.node.id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: RANKING_GRID_TEMPLATE,
                        alignItems: "center",
                        gap: { xs: 1, sm: 1.5 },
                        px: { xs: 1, sm: 1.5 },
                        py: 1.2,
                        borderBottom: index === voteSummary.length - 1 ? "none" : "1px solid",
                        borderColor: "divider",
                        opacity,
                        transition: "opacity 220ms ease, background-color 200ms ease",
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            theme.palette.mode === "dark" ? 0.14 : 0.08
                          ),
                          opacity: 1
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Avatar
                          src={candidatePhoto}
                          alt={detail.node.name}
                          sx={{ width: 44, height: 44 }}
                        />
                      </Box>
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {detail.node.name}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600
                        }}
                      >
                        {detail.votesReceived}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {hasVoters ? (
                          detail.voters.map((voter) => (
                            <MuiTooltip key={voter.id} title={voter.name} arrow>
                              <Avatar
                                src={voter.photoUrl || DEFAULT_AVATAR}
                                alt={voter.name}
                                sx={{ width: 32, height: 32 }}
                              />
                            </MuiTooltip>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sin votos
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
                {!expanded && hasMoreVotes && (
                  <Box
                    sx={{
                      pointerEvents: "none",
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 112,
                      background: `linear-gradient(180deg, ${alpha(
                        theme.palette.background.paper,
                        0
                      )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 70%, ${
                        theme.palette.background.paper
                      } 100%)`
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
          {hasMoreVotes && (
            <Box textAlign="center" mt={2}>
              <button
                type="button"
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.palette.primary.main} 15%, transparent)`,
                  border: "none",
                  color: theme.palette.primary.main,
                  padding: "8px 16px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: 600,
                  minWidth: 100
                }}
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
