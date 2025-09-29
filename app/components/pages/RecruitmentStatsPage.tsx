"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
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
  Tooltip,
  ResponsiveContainer
} from "recharts";

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
    const baseRadius = 9;
    const scale = 3;
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
      ctx.lineWidth = 2;
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
      linkForce.distance(125);
    }
    if (linkForce?.strength) {
      linkForce.strength(0.05);
    }
    const timeout = window.setTimeout(() => {
      fg.zoomToFit(600, 48);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [voteGraphData]);

  const nodeLabelAccessor = useCallback((node: VoteGraphNodeObject) => node.name, []);

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
                <Tooltip
                  formatter={(value: number) => [value, "Total"]}
                  labelFormatter={(label: string | number) => <strong>{String(label)}</strong>}
                />
                <Bar dataKey="count">
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
                <Tooltip
                  labelFormatter={(label: string | number) => <strong>{String(label)}</strong>}
                />
                <Bar dataKey="yes" fill="#4caf50" name="Sí" />
                <Bar dataKey="maybe" fill="#ff9800" name="Quizás" />
                <Bar dataKey="no" fill="#f44336" name="No" />
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
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={3}
                  linkDirectionalArrowColor={() =>
                    theme.palette.mode === "dark" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.65)"
                  }
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
    </Box>
  );
}
