import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNexusAnalyze } from "@workspace/api-client-react";
import type { NexusAnalysis, NexusAnalyzeBody } from "@workspace/api-client-react";
import {
  Sparkles, Zap, Network, Handshake, TrendingUp, DollarSign,
  ChevronRight, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const IMPACT_COLORS = {
  high: "text-primary bg-primary/10 border-primary/30",
  medium: "text-chart-5 bg-chart-5/10 border-chart-5/30",
  low: "text-muted-foreground bg-muted/10 border-border",
};

const STAGE_LABELS = { idea: "💡 Idea", mvp: "🛠️ MVP", growth: "🚀 Growth", scale: "🌐 Scale" };

const GOALS = [
  "Increase TVL", "Expand to new chains", "Build community", "Raise capital",
  "Find technical partners", "Launch token", "DAO governance", "Increase volume",
];

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90 absolute" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(240 10% 12%)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke="hsl(189 100% 50%)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c}
          animate={{ strokeDashoffset: c - filled }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 6px hsl(189 100% 50% / 0.6))" }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-center"
      >
        <p className="text-3xl font-display text-primary glow-text">{score}</p>
        <p className="text-[10px] text-muted-foreground font-mono uppercase">Score</p>
      </motion.div>
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

function ResultView({ data }: { data: NexusAnalysis }) {
  return (
    <div className="space-y-4">
      {/* Score + Summary */}
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
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Integrations */}
        <Section icon={Zap} title="Recommended Integrations" delay={0.1}>
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

        {/* Partnerships */}
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

        {/* Expansion Strategy */}
        <Section icon={Network} title="Expansion Strategy" delay={0.2}>
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

        {/* Capital Strategy */}
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

export default function Connect() {
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
      goals: f.goals?.includes(goal)
        ? f.goals.filter(g => g !== goal)
        : [...(f.goals ?? []), goal],
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
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-display text-primary glow-text">NEXUS Intelligence</h1>
        </div>
        <p className="text-muted-foreground text-sm font-mono ml-14">
          "Your startup doesn't scale alone. It connects." — AI-powered ecosystem analysis
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-1"
        >
          <div className="glass-card rounded-xl p-6 glow-border space-y-5 sticky top-8">
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Project Input</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Project Name</label>
                  <Input
                    value={form.projectName}
                    onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                    className="mt-1 bg-secondary/50 border-border/50 focus:border-primary/50"
                    placeholder="e.g. NexSwap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase">Type</label>
                    <Select value={form.projectType} onValueChange={v => setForm(f => ({ ...f, projectType: v as any }))}>
                      <SelectTrigger className="mt-1 bg-secondary/50 border-border/50 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border/50">
                        {["DeFi", "NFT", "Gaming", "DAO", "Infrastructure", "Bridge", "Oracle", "Social", "Other"].map(t => (
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
                      {["Ethereum", "Polygon", "Solana", "Arbitrum", "Base", "Optimism", "BNB Chain", "Avalanche", "Sui", "Aptos"].map(c => (
                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Community Size</label>
                  <Input
                    type="number"
                    value={form.communitySize ?? ""}
                    onChange={e => setForm(f => ({ ...f, communitySize: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="mt-1 bg-secondary/50 border-border/50 text-xs"
                    placeholder="e.g. 5000"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Description</label>
                  <Input
                    value={form.description ?? ""}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="mt-1 bg-secondary/50 border-border/50 text-xs"
                    placeholder="Brief project description"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase block mb-2">Goals (select all that apply)</label>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map(goal => {
                  const active = form.goals?.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`text-[10px] font-mono px-2 py-1 rounded-full border transition-all duration-200 ${
                        active
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-secondary/40 border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={submit}
              disabled={analyze.isPending || !form.projectName.trim()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono gap-2 relative overflow-hidden"
            >
              {analyze.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run NEXUS Analysis
                </>
              )}
              {analyze.isPending && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}
            </Button>

            {result && !analyze.isPending && (
              <button
                onClick={() => setResult(null)}
                className="w-full text-xs font-mono text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> New Analysis
              </button>
            )}
          </div>
        </motion.div>

        {/* Result Panel */}
        <div className="xl:col-span-2">
          <AnimatePresence mode="wait">
            {analyze.isPending && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-xl p-12 glow-border flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <p className="font-display text-primary glow-text text-lg mb-2">NEXUS Analyzing</p>
                <p className="text-muted-foreground text-sm font-mono">Scanning ecosystem connections...</p>
                <div className="mt-4 flex gap-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {error && !analyze.isPending && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-xl p-8 glow-border flex items-center gap-4"
              >
                <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
                <div>
                  <p className="font-display text-destructive">Analysis Failed</p>
                  <p className="text-sm text-muted-foreground font-mono mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            {result && !analyze.isPending && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ResultView data={result} />
              </motion.div>
            )}

            {!result && !analyze.isPending && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-xl p-16 glow-border flex flex-col items-center justify-center text-center"
              >
                <div className="w-24 h-24 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center mb-6">
                  <Network className="w-10 h-10 text-primary/40" />
                </div>
                <p className="font-display text-foreground/60 text-lg mb-2 tracking-widest">Ready to Connect</p>
                <p className="text-muted-foreground text-sm font-mono max-w-xs">
                  Fill in your project details and run the NEXUS Intelligence analysis to discover your optimal connection strategy.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-xs">
                  {[
                    { icon: Zap, label: "Integrations" },
                    { icon: Handshake, label: "Partnerships" },
                    { icon: Network, label: "Expansion" },
                    { icon: DollarSign, label: "Capital" },
                  ].map(({ icon: Icon, label }) => (
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
    </div>
  );
}
