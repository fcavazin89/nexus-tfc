import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListChains, useCreateChain, useUpdateChain, useDeleteChain, getListChainsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Network, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  active: "text-primary bg-primary/10 border-primary/30",
  inactive: "text-muted-foreground bg-muted/10 border-border",
  testing: "text-chart-5 bg-chart-5/10 border-chart-5/30",
};

type ChainForm = { name: string; symbol: string; chainId: string; rpcUrl: string; status: string; tvl: string };
const EMPTY: ChainForm = { name: "", symbol: "", chainId: "", rpcUrl: "", status: "active", tvl: "" };

export default function Chains() {
  const { data: chains = [], isLoading } = useListChains();
  const createChain = useCreateChain();
  const updateChain = useUpdateChain();
  const deleteChain = useDeleteChain();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ChainForm>(EMPTY);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListChainsQueryKey() });

  function openCreate() { setForm(EMPTY); setEditId(null); setOpen(true); }
  function openEdit(c: any) {
    setForm({ name: c.name, symbol: c.symbol, chainId: c.chainId?.toString() ?? "", rpcUrl: c.rpcUrl ?? "", status: c.status, tvl: c.tvl ?? "" });
    setEditId(c.id); setOpen(true);
  }

  async function submit() {
    if (!form.name.trim() || !form.symbol.trim()) return;
    const data: any = { name: form.name, symbol: form.symbol, status: form.status };
    if (form.chainId) data.chainId = parseInt(form.chainId);
    if (form.rpcUrl) data.rpcUrl = form.rpcUrl;
    if (form.tvl) data.tvl = form.tvl;
    try {
      if (editId !== null) {
        await updateChain.mutateAsync({ id: editId, data });
        toast({ title: "Chain updated" });
      } else {
        await createChain.mutateAsync({ data });
        toast({ title: "Chain added" });
      }
      invalidate();
      setOpen(false);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  async function remove(id: number) {
    await deleteChain.mutateAsync({ id });
    invalidate();
    toast({ title: "Chain removed" });
  }

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-primary glow-text">Networks</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">Multi-chain integration layer — {chains.length} networks connected</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-mono">
          <Plus className="w-4 h-4" /> Add Network
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {chains.map((chain, i) => (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 glow-border group hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-primary font-display text-xs">{chain.symbol}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{chain.name}</p>
                    {chain.chainId && <p className="text-xs text-muted-foreground font-mono">Chain ID: {chain.chainId}</p>}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full border ${STATUS_COLORS[chain.status] ?? ""}`}>
                  {chain.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">TVL</p>
                  <p className="text-foreground font-medium">{chain.tvl ?? "—"}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">Agents</p>
                  <p className="text-foreground font-medium">{chain.agentCount ?? 0}</p>
                </div>
              </div>

              {chain.rpcUrl && (
                <p className="text-xs text-muted-foreground font-mono truncate mb-3">{chain.rpcUrl}</p>
              )}

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1 border-border/50" onClick={() => openEdit(chain)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => remove(chain.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLoading && chains.length === 0 && (
        <div className="text-center py-20 text-muted-foreground font-mono">
          <Network className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No networks connected yet.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-primary tracking-widest">{editId ? "Edit Network" : "Add Network"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Name</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="Ethereum" />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Symbol</label>
                <Input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="ETH" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Chain ID</label>
                <Input type="number" value={form.chainId} onChange={e => setForm(f => ({ ...f, chainId: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="1" />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {["active", "inactive", "testing"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">RPC URL</label>
              <Input value={form.rpcUrl} onChange={e => setForm(f => ({ ...f, rpcUrl: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">TVL</label>
              <Input value={form.tvl} onChange={e => setForm(f => ({ ...f, tvl: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="$1.2B" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-border/50">Cancel</Button>
            <Button onClick={submit} className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono">{editId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
