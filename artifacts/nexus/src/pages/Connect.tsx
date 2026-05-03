import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNexusAnalyze, useGetNexusGraph, useAddStartupToGraph } from "@workspace/api-client-react";
import type { NexusAnalysis, NexusAnalyzeBody, NexusMatchScore, NexusGraphData } from "@workspace/api-client-react";
import {
  Sparkles, Zap, Network, Handshake, TrendingUp, DollarSign,
  ChevronRight, Loader2, AlertCircle, RefreshCw, GitBranch,
  CheckCircle2, Plus, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const IMPACT_COLORS = {
  high: "text-primary bg-primary/10 border-primary/30",
  medium: "text-chart-5 bg-chart-5/10 border-chart-5/30",
  low: "text-muted-foreground bg-muted/10 border-border",
};

const NODE_COLORS: Record<string, string> = {
  protocol: "hsl(189 100% 50%)",
  chain: "hsl(270 80% 60%)",
  dao: "hsl(142 70% 45%)",
  investor: "hsl(45 90% 55%)",
  startup: "hsl(0 0% 100%)",
};

const NODE_BG: Record<string, string> = {
  protocol: "bg-primary/10 border-primary/30 text-primary",
  chain: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  dao: "bg-green-500/10 border-green-500/30 text-green-400",
  investor: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  startup: "bg-white/10 border-white/30 text-white",
};

const STAGE_LABELS = { idea: "💡 Idea", mvp: "🛠️ MVP", growth: "🚀 Growth", scale: "🌐 Scale" };

const GOALS = [
  "Increase TVL", "Expand to new chains", "Build community", "Raise capital",
  "Find technical partners", "Launch token", "DAO governance", "Increase volume",
];

type TabId = "analyze" | "graph";

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color = score >= 75 ? "hsl(189 100% 50%)" : score >= 50 ? "hsl(45 90% 55%)" : "hsl(0 80% 55%)";
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90 absolute" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(240 10% 12%)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c}
          animate={{ strokeDashoffset: c - filled }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-center"
      >
        <p className="text-3xl font-display glow-text" style={{ color }}>{score}</p>
        <p className="text-[10px] text-muted-foreground font-mono uppercase">Network</p>
      </motion.div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-mono text-muted-foreground uppercase">{label}</span>
        <span className="text-[10px] font-mono" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-secondary/60 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children, delay }: { icon: any; title: string; children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-xl p-5 glow-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-display tracking-widest text-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function GraphMatchCard({ match, index }: { match: NexusMatchScore; index: number }) {
  const color = NODE_COLORS[match.type] ?? "#ffffff";
  const pct = Math.round(match.matchScore * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="p-3 rounded-lg bg-secondary/40 border border-border/40 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
          <span className="text-sm font-medium text-foreground">{match.name}</span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${NODE_BG[match.type] ?? ""}`}>{match.type}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-16 rounded-full bg-secondary/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            />
          </div>
          <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <ScoreBar label="Category" value={match.breakdown.categoryMatch} color={color} />
        <ScoreBar label="Chain" value={match.breakdown.chainAlignment} color={color} />
        <ScoreBar label="Tags" value={match.breakdown.tagRelevance} color={color} />
      </div>
      <div className="flex items-center gap-1">
        <GitBranch className="w-2.5 h-2.5 text-muted-foreground" />
        <span className="text-[9px] font-mono text-muted-foreground">{match.relationshipType}</span>
        {match.chains && match.chains.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {match.chains.slice(0, 3).map((c) => (
              <span key={c} className="text-[8px] font-mono text-muted-foreground bg-secondary/50 px-1 py-0.5 rounded">{c}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HubGraph({ projectName, matches }: { projectName: string; matches: NexusMatchScore[] }) {
  const top8 = matches.slice(0, 8);
  const cx = 200, cy = 200, r = 140;
  return (
    <div className="glass-card rounded-xl p-4 glow-border">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Connection Graph</p>
      <div className="flex justify-center">
        <svg width="400" height="400" viewBox="0 0 400 400" className="w-full max-w-sm">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {top8.map((m, i) => {
            const angle = (i / top8.length) * 2 * Math.PI - Math.PI / 2;
            const nx = cx + r * Math.cos(angle);
            const ny = cy + r * Math.sin(angle);
            const color = NODE_COLORS[m.type] ?? "#ffffff";
            const opacity = 0.3 + m.matchScore * 0.7;
            return (
              <motion.line
                key={`edge-${i}`}
                x1={cx} y1={cy} x2={nx} y2={ny}
                stroke={color}
                strokeWidth={1 + m.matchScore * 2}
                strokeOpacity={opacity}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.06 }}
                filter="url(#glow)"
              />
            );
          })}
          <motion.circle
            cx={cx} cy={cy} r={24}
            fill="hsl(240 10% 8%)"
            stroke="hsl(189 100% 50%)"
            strokeWidth={2}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            filter="url(#glow)"
          />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8" fill="hsl(189 100% 50%)" fontFamily="monospace">
            {projectName.length > 8 ? projectName.slice(0, 8) : projectName}
          </text>
          {top8.map((m, i) => {
            const angle = (i / top8.length) * 2 * Math.PI - Math.PI / 2;
            const nx = cx + r * Math.cos(angle);
            const ny = cy + r * Math.sin(angle);
            const color = NODE_COLORS[m.type] ?? "#ffffff";
            const nr = 16 + m.matchScore * 8;
            return (
              <g key={`node-${i}`}>
                <motion.circle
                  cx={nx} cy={ny} r={nr}
                  fill="hsl(240 10% 8%)"
                  stroke={color}
                  strokeWidth={1.5}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                  filter="url(#glow)"
                />
                <motion.text
                  x={nx} y={ny + 3}
                  textAnchor="middle"
                  fontSize="6"
                  fill={color}
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.06 }}
                >
                  {m.name.length > 9 ? m.name.slice(0, 9) : m.name}
                </motion.text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {Object.entries(NODE_COLORS).filter(([k]) => k !== "startup").map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-mono text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcosystemGraph({ data }: { data: NexusGraphData }) {
  const nodes = data.nodes.slice(0, 30);
  const edges = data.edges.slice(0, 50);
  const W = 600, H = 500;

  const positions = nodes.reduce<Record<number, { x: number; y: number }>>((acc, node, i) => {
    const byType = nodes.filter((n) => n.type === node.type);
    const ti = byType.indexOf(node);
    const typeOrder = ["chain", "protocol", "dao", "investor", "startup"];
    const col = typeOrder.indexOf(node.type);
    const cols = typeOrder.length;
    const x = (W / (cols + 1)) * (col + 1);
    const y = (H / (byType.length + 1)) * (ti + 1);
    acc[node.id] = { x, y };
    return acc;
  }, {});

  return (
    <div className="glass-card rounded-xl p-4 glow-border overflow-hidden">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
        Ecosystem Graph — {data.nodes.length} nodes · {data.edges.length} edges
      </p>
      <div className="overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
          <defs>
            <filter id="glow2"><feGaussianBlur stdDeviation="1.5" result="cb" /><feMerge><feMergeNode in="cb" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {edges.map((e) => {
            const from = positions[e.fromNodeId];
            const to = positions[e.toNodeId];
            if (!from || !to) return null;
            const fromNode = nodes.find((n) => n.id === e.fromNodeId);
            const color = NODE_COLORS[fromNode?.type ?? "protocol"] ?? "#ffffff";
            return (
              <line
                key={e.id}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={color}
                strokeWidth={0.5}
                strokeOpacity={0.25}
              />
            );
          })}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const color = NODE_COLORS[node.type] ?? "#ffffff";
            const isStartup = node.type === "startup";
            return (
              <g key={node.id}>
                <circle
                  cx={pos.x} cy={pos.y}
                  r={isStartup ? 8 : 5}
                  fill="hsl(240 10% 8%)"
                  stroke={color}
                  strokeWidth={isStartup ? 2 : 1}
                  filter="url(#glow2)"
                />
                <text
                  x={pos.x} y={pos.y - 8}
                  textAnchor="middle"
                  fontSize="6"
                  fill={color}
                  fontFamily="monospace"
                  opacity={0.8}
                >
                  {node.name.length > 10 ? node.name.slice(0, 10) : node.name}
                </text>
              </g>
            );
          })}
          {["chain", "protocol", "dao", "investor", "startup"].map((type, ci) => {
            const cols = 5;
            const x = (W / (cols + 1)) * (ci + 1);
            return (
              <text key={type} x={x} y={16} textAnchor="middle" fontSize="7" fill={NODE_COLORS[type]} fontFamily="monospace" opacity={0.6} textTransform="uppercase">
                {type.toUpperCase()}S
              </text>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-mono text-muted-foreground capitalize">
              {type} ({data.nodes.filter((n) => n.type === type).length})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultView({ data, projectName, onAddToGraph }: { data: NexusAnalysis; projectName: string; onAddToGraph: () => void }) {
  const [added, setAdded] = useState(false);
  const addMutation = useAddStartupToGraph();

  async function handleAdd() {
    try {
      await addMutation.mutateAsync({ data: { projectName, projectType: "startup", chain: "Ethereum" } });
      setAdded(true);
      onAddToGraph();
    } catch { setAdded(true); }
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-xl p-6 glow-border flex items-center gap-6"
      >
        <ScoreRing score={data.networkScore} />
        <div className="flex-1">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Strategic Analysis</p>
          <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
        </div>
        <div className="shrink-0">
          {added ? (
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4" />
              In Graph
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="border-primary/30 text-primary hover:bg-primary/10 text-xs font-mono gap-1.5"
            >
              {addMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add to Graph
            </Button>
          )}
        </div>
      </motion.div>

      {data.graphMatches && data.graphMatches.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Section icon={Network} title="Graph Matches — Structural Scoring" delay={0.05}>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data.graphMatches.slice(0, 6).map((m, i) => (
                <GraphMatchCard key={m.nodeId} match={m} index={i} />
              ))}
            </div>
            <p className="text-[9px] font-mono text-muted-foreground mt-2">
              Score = category(40%) + chain_alignment(30%) + tag_relevance(30%)
            </p>
          </Section>
          <HubGraph projectName={projectName} matches={data.graphMatches} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section icon={Zap} title="AI Recommended Integrations" delay={0.1}>
          <div className="space-y-2">
            {data.recommendedIntegrations.map((int, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/40"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <ChevronRight className="w-3 h-3 text-primary" />
                  <span className="text-sm font-medium text-foreground">{int.name}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${IMPACT_COLORS[int.impact]}`}>
                    {int.impact}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{int.reason}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section icon={Handshake} title="Strategic Partnerships" delay={0.15}>
          <div className="space-y-2">
            {data.partnerships.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/40"
              >
                <div className="w-8 h-8 rounded-lg bg-chart-3/10 border border-chart-3/20 flex items-center justify-center shrink-0">
                  <Handshake className="w-3.5 h-3.5 text-chart-3" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <span className="text-[10px] font-mono text-chart-3 uppercase">{p.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.synergy}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section icon={TrendingUp} title="Expansion Strategy" delay={0.2}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-2">Target Chains</p>
              <div className="flex flex-wrap gap-2">
                {data.expansionStrategy.primaryChains.map((chain, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary"
                  >
                    {chain}
                  </motion.span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
              <p className="text-xs font-mono text-muted-foreground mb-1">Timeline</p>
              <p className="text-sm text-foreground font-medium">{data.expansionStrategy.timeline}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{data.expansionStrategy.rationale}</p>
          </div>
        </Section>

        <Section icon={DollarSign} title="Capital Strategy" delay={0.25}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <p className="text-xs font-mono text-muted-foreground mb-1">Funding Stage</p>
                <p className="text-sm text-foreground font-medium">{data.capitalStrategy.fundingStage}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <p className="text-xs font-mono text-muted-foreground mb-1">Range</p>
                <p className="text-sm text-primary font-display">{data.capitalStrategy.estimatedRange}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-2">Investor Types</p>
              <div className="flex flex-wrap gap-1.5">
                {data.capitalStrategy.investorTypes.map((type, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-0.5 rounded-full bg-chart-5/10 border border-chart-5/20 text-chart-5">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function GraphTab() {
  const { data, isLoading, error } = useGetNexusGraph({});
  if (isLoading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <span className="text-sm font-mono text-muted-foreground">Loading graph...</span>
    </div>
  );
  if (error || !data) return (
    <div className="flex items-center gap-3 p-6 glass-card rounded-xl glow-border">
      <AlertCircle className="w-5 h-5 text-destructive" />
      <span className="text-sm font-mono text-muted-foreground">Failed to load graph</span>
    </div>
  );
  return (
    <div className="space-y-4">
      <EcosystemGraph data={data} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["chain","protocol","dao","investor","startup"] as const).map((type) => {
          const count = data.nodes.filter((n) => n.type === type).length;
          return (
            <div key={type} className="glass-card rounded-xl p-4 glow-border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
                <span className="text-xs font-mono text-muted-foreground capitalize">{type}s</span>
              </div>
              <p className="text-2xl font-display" style={{ color: NODE_COLORS[type] }}>{count}</p>
            </div>
          );
        })}
      </div>
      <div className="glass-card rounded-xl p-4 glow-border">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">All Nodes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {data.nodes.map((node) => (
            <div key={node.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/30">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[node.type] ?? "#fff" }} />
              <span className="text-xs font-medium text-foreground truncate">{node.name}</span>
              <span className={`text-[8px] font-mono shrink-0 px-1 py-0.5 rounded border ${NODE_BG[node.type] ?? ""}`}>{node.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Connect() {
  const [tab, setTab] = useState<TabId>("analyze");
  const [form, setForm] = useState<NexusAnalyzeBody>({
    projectName: "",
    projectType: "DeFi",
    stage: "mvp",
    chain: "Ethereum",
    communitySize: undefined,
    goals: [],
    description: "",
  });
  const [result, setResult] = useState<NexusAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useNexusAnalyze();

  function toggleGoal(goal: string) {
    setForm(f => ({
      ...f,
      goals: f.goals?.includes(goal) ? f.goals.filter(g => g !== goal) : [...(f.goals ?? []), goal],
    }));
  }

  async function submit() {
    if (!form.projectName.trim()) return;
    setError(null);
    setResult(null);
    try {
      const data = await analyze.mutateAsync({ data: form });
      setResult(data);
    } catch {
      setError("NEXUS analysis failed. Check your connection and try again.");
    }
  }

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-display text-primary glow-text">NEXUS Intelligence</h1>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border/30">
            {([["analyze", Sparkles, "Analyze"], ["graph", Eye, "Graph"]] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setTab(id as TabId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  tab === id ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-sm font-mono ml-14">
          "Your startup doesn't scale alone. It connects." — AI + Graph matching engine
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "graph" ? (
          <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GraphTab />
          </motion.div>
        ) : (
          <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-1">
                <div className="glass-card rounded-xl p-6 glow-border space-y-5 sticky top-8">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Project Input</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Project Name</label>
                        <Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                          className="mt-1 bg-secondary/50 border-border/50 focus:border-primary/50" placeholder="e.g. NexSwap" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-mono text-muted-foreground uppercase">Type</label>
                          <Select value={form.projectType} onValueChange={v => setForm(f => ({ ...f, projectType: v as any }))}>
                            <SelectTrigger className="mt-1 bg-secondary/50 border-border/50 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-card border-border/50">
                              {["DeFi","NFT","Gaming","DAO","Infrastructure","Bridge","Oracle","Social","Other"].map(t => (
                                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-mono text-muted-foreground uppercase">Stage</label>
                          <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v as any }))}>
                            <SelectTrigger className="mt-1 bg-secondary/50 border-border/50 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-card border-border/50">
                              {Object.entries(STAGE_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Primary Chain</label>
                        <Select value={form.chain} onValueChange={v => setForm(f => ({ ...f, chain: v }))}>
                          <SelectTrigger className="mt-1 bg-secondary/50 border-border/50 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-border/50">
                            {["Ethereum","Polygon","Solana","Arbitrum","Base","Optimism","BNB Chain","Avalanche","Sui","Aptos"].map(c => (
                              <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Community Size</label>
                        <Input type="number" value={form.communitySize ?? ""} onChange={e => setForm(f => ({ ...f, communitySize: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="mt-1 bg-secondary/50 border-border/50 text-xs" placeholder="e.g. 5000" />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Description</label>
                        <Input value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          className="mt-1 bg-secondary/50 border-border/50 text-xs" placeholder="Brief project description" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase block mb-2">Goals (select all that apply)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {GOALS.map(goal => {
                        const active = form.goals?.includes(goal);
                        return (
                          <button key={goal} onClick={() => toggleGoal(goal)}
                            className={`text-[10px] font-mono px-2 py-1 rounded-full border transition-all duration-200 ${
                              active ? "bg-primary/15 border-primary/40 text-primary" : "bg-secondary/40 border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                            }`}>
                            {goal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button onClick={submit} disabled={analyze.isPending || !form.projectName.trim()}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono gap-2 relative overflow-hidden">
                    {analyze.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Run NEXUS Analysis</>}
                    {analyze.isPending && (
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                    )}
                  </Button>
                  {result && !analyze.isPending && (
                    <button onClick={() => setResult(null)} className="w-full text-xs font-mono text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
                      <RefreshCw className="w-3 h-3" /> New Analysis
                    </button>
                  )}
                </div>
              </motion.div>

              <div className="xl:col-span-2">
                <AnimatePresence mode="wait">
                  {analyze.isPending && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="glass-card rounded-xl p-12 glow-border flex flex-col items-center justify-center text-center">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <motion.div className="absolute inset-0 rounded-full border-2 border-primary"
                          animate={{ scale: [1, 1.5], opacity: [1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      </div>
                      <p className="font-display text-primary glow-text text-lg mb-2">NEXUS Analyzing</p>
                      <p className="text-muted-foreground text-sm font-mono">AI + Graph matching engine running...</p>
                      <div className="mt-4 flex gap-1">
                        {[0,1,2,3,4].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                            animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {error && !analyze.isPending && (
                    <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="glass-card rounded-xl p-8 glow-border flex items-center gap-4">
                      <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
                      <div>
                        <p className="font-display text-destructive">Analysis Failed</p>
                        <p className="text-sm text-muted-foreground font-mono mt-1">{error}</p>
                      </div>
                    </motion.div>
                  )}
                  {result && !analyze.isPending && (
                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <ResultView data={result} projectName={form.projectName} onAddToGraph={() => setTab("graph")} />
                    </motion.div>
                  )}
                  {!result && !analyze.isPending && !error && (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="glass-card rounded-xl p-16 glow-border flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center mb-6">
                        <Network className="w-10 h-10 text-primary/40" />
                      </div>
                      <p className="font-display text-foreground/60 text-lg mb-2 tracking-widest">Ready to Connect</p>
                      <p className="text-muted-foreground text-sm font-mono max-w-xs">
                        Fill in your project details. NEXUS will run AI analysis + graph matching to find your optimal connections.
                      </p>
                      <div className="mt-6 p-3 rounded-lg bg-secondary/30 border border-border/30 max-w-xs w-full">
                        <p className="text-[9px] font-mono text-muted-foreground text-left mb-1.5">MATCHING FORMULA</p>
                        <p className="text-[10px] font-mono text-primary/80 text-left">
                          score = category(40%) + chain(30%) + tags(30%)
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-xs">
                        {[{icon: Zap, label: "AI Integrations"},{icon: Handshake, label: "Partnerships"},{icon: Network, label: "Graph Matches"},{icon: DollarSign, label: "Capital"}].map(({ icon: Icon, label }) => (
                          <div key={label} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-secondary/20">
                            <Icon className="w-3.5 h-3.5 text-primary/50" />
                            <span className="text-xs font-mono text-muted-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
