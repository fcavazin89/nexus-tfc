import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListAgents, useCreateAgent, useUpdateAgent, useDeleteAgent, getListAgentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Cpu, Trash2, Pencil, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  active: "text-primary bg-primary/10 border-primary/30",
  idle: "text-chart-5 bg-chart-5/10 border-chart-5/30",
  paused: "text-muted-foreground bg-muted/10 border-border",
  error: "text-destructive bg-destructive/10 border-destructive/30",
};

const TYPE_COLORS: Record<string, string> = {
  nexus: "text-primary",
  bridge: "text-chart-2",
  oracle: "text-chart-3",
  guardian: "text-chart-4",
  scout: "text-chart-5",
  executor: "text-chart-1",
};

type AgentForm = { name: string; type: string; status: string; description: string };
const EMPTY: AgentForm = { name: "", type: "nexus", status: "idle", description: "" };

export default function Agents() {
  const { data: agents = [], isLoading } = useListAgents();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AgentForm>(EMPTY);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAgentsQueryKey() });

  function openCreate() { setForm(EMPTY); setEditId(null); setOpen(true); }
  function openEdit(a: any) { setForm({ name: a.name, type: a.type, status: a.status, description: a.description ?? "" }); setEditId(a.id); setOpen(true); }

  async function submit() {
    if (!form.name.trim()) return;
    try {
      if (editId !== null) {
        await updateAgent.mutateAsync({ id: editId, data: form as any });
        toast({ title: "Agent updated" });
      } else {
        await createAgent.mutateAsync({ data: form as any });
        toast({ title: "Agent deployed" });
      }
      invalidate();
      setOpen(false);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  async function remove(id: number) {
    await deleteAgent.mutateAsync({ id });
    invalidate();
    toast({ title: "Agent removed" });
  }

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-primary glow-text">2AG Agents</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">{agents.length} agents deployed across the network</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-mono">
          <Plus className="w-4 h-4" /> Deploy Agent
        </Button>
      </motion.div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-40 animate-pulse" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 glow-border group hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Cpu className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{agent.name}</p>
                    <p className={`text-xs font-mono uppercase ${TYPE_COLORS[agent.type] ?? "text-muted-foreground"}`}>{agent.type}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full border ${STATUS_COLORS[agent.status] ?? ""}`}>
                  {agent.status === "active" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping mr-1" />}
                  {agent.status.toUpperCase()}
                </span>
              </div>

              {agent.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">TX Processed</p>
                  <p className="text-foreground font-medium">{(agent.transactionsProcessed ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">Uptime</p>
                  <p className="text-foreground font-medium">{agent.uptime?.toFixed(1) ?? 0}%</p>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1 border-border/50" onClick={() => openEdit(agent)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => remove(agent.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLoading && agents.length === 0 && (
        <div className="text-center py-20 text-muted-foreground font-mono">
          <Cpu className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No agents deployed yet.</p>
          <p className="text-xs mt-1">Deploy your first 2AG agent to get started.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-primary tracking-widest">
              {editId ? "Update Agent" : "Deploy Agent"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="Agent name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Type</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {["nexus", "bridge", "oracle", "guardian", "scout", "executor"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {["active", "idle", "paused", "error"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">Description</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-border/50">Cancel</Button>
            <Button onClick={submit} className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono">
              {editId ? "Update" : "Deploy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
