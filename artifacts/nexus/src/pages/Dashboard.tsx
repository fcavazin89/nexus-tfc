import { motion } from "framer-motion";
import { useGetStatsSummary, useGetActivityFeed, useGetChainBreakdown } from "@workspace/api-client-react";
import { Activity, Cpu, Network, Handshake, Boxes, TrendingUp, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

function StatCard({ icon: Icon, label, value, sub, index }: { icon: any; label: string; value: string | number; sub?: string; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-xl p-5 glow-border relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-display text-foreground">{value}</p>
          {sub && <p className="text-primary text-xs font-mono mt-1">{sub}</p>}
        </div>
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

const activityColors: Record<string, string> = {
  agent_deployed: "text-primary bg-primary/10",
  chain_added: "text-chart-2 bg-chart-2/10",
  partnership_signed: "text-chart-3 bg-chart-3/10",
  project_launched: "text-chart-5 bg-chart-5/10",
  transaction: "text-chart-4 bg-chart-4/10",
  alert: "text-destructive bg-destructive/10",
};

const activityLabels: Record<string, string> = {
  agent_deployed: "AGENT",
  chain_added: "CHAIN",
  partnership_signed: "PARTNER",
  project_launched: "PROJECT",
  transaction: "TX",
  alert: "ALERT",
};

export default function Dashboard() {
  const { data: stats } = useGetStatsSummary();
  const { data: activity = [] } = useGetActivityFeed();
  const { data: breakdown = [] } = useGetChainBreakdown();

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-display text-primary glow-text">Mission Control</h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Como conectar com o mundo? — Real-time global Web3 operations</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Cpu} label="Total Agents" value={stats?.totalAgents ?? "—"} sub={`${stats?.activeAgents ?? 0} active`} index={0} />
        <StatCard icon={Network} label="Networks" value={stats?.totalChains ?? "—"} sub="multi-chain" index={1} />
        <StatCard icon={Handshake} label="Partnerships" value={stats?.totalPartnerships ?? "—"} sub={`${stats?.activePartnerships ?? 0} active`} index={2} />
        <StatCard icon={Boxes} label="Ecosystem" value={stats?.totalEcosystemProjects ?? "—"} sub={`${stats?.liveProjects ?? 0} live`} index={3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chain Breakdown Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card rounded-xl p-6 glow-border"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display text-foreground tracking-widest">Chain Activity</h2>
          </div>
          {breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={breakdown} barGap={4}>
                <XAxis dataKey="chainSymbol" tick={{ fill: "hsl(240 5% 65%)", fontSize: 11, fontFamily: "Menlo, monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(240 5% 65%)", fontSize: 11, fontFamily: "Menlo, monospace" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 10% 12%)", borderRadius: 8, fontFamily: "Menlo, monospace", fontSize: 12 }}
                  labelStyle={{ color: "hsl(189 100% 50%)" }}
                />
                <Bar dataKey="agentCount" name="Agents" radius={[4, 4, 0, 0]} fill="hsl(189 100% 50%)" fillOpacity={0.85} />
                <Bar dataKey="projectCount" name="Projects" radius={[4, 4, 0, 0]} fill="hsl(213 100% 50%)" fillOpacity={0.85} />
                <Bar dataKey="partnershipCount" name="Partners" radius={[4, 4, 0, 0]} fill="hsl(280 100% 60%)" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm font-mono">No chain data yet</div>
          )}
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card rounded-xl p-6 glow-border"
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display text-foreground tracking-widest">Activity Feed</h2>
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {activity.length === 0 && (
              <p className="text-muted-foreground text-sm font-mono text-center py-8">No activity yet</p>
            )}
            {activity.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${activityColors[item.type] ?? "text-muted-foreground bg-muted"}`}>
                  {activityLabels[item.type] ?? item.type}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{item.description}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Network Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-xl p-6 glow-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display tracking-widest">Network Health</h2>
          </div>
          <span className="text-primary font-display text-2xl glow-text">{stats?.networkHealth ?? 0}%</span>
        </div>
        <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stats?.networkHealth ?? 0}%` }}
            transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground font-mono">Total TX: {(stats?.totalTransactions ?? 0).toLocaleString()}</span>
          <span className="text-xs text-muted-foreground font-mono">TVL: {stats?.totalTvl ?? "$0"}</span>
        </div>
      </motion.div>
    </div>
  );
}
