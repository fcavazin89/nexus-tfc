import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListPartnerships, useCreatePartnership, useUpdatePartnership, useDeletePartnership, getListPartnershipsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Handshake, Trash2, Pencil, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  active: "text-primary bg-primary/10 border-primary/30",
  pending: "text-chart-5 bg-chart-5/10 border-chart-5/30",
  negotiating: "text-chart-2 bg-chart-2/10 border-chart-2/30",
  closed: "text-muted-foreground bg-muted/10 border-border",
};

const TYPE_COLORS: Record<string, string> = {
  protocol: "text-primary",
  infrastructure: "text-chart-2",
  dao: "text-chart-3",
  exchange: "text-chart-4",
  launchpad: "text-chart-5",
  other: "text-muted-foreground",
};

type PartnerForm = { name: string; type: string; status: string; description: string; website: string };
const EMPTY: PartnerForm = { name: "", type: "protocol", status: "pending", description: "", website: "" };

export default function Partnerships() {
  const { data: partnerships = [], isLoading } = useListPartnerships();
  const createPartnership = useCreatePartnership();
  const updatePartnership = useUpdatePartnership();
  const deletePartnership = useDeletePartnership();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<PartnerForm>(EMPTY);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListPartnershipsQueryKey() });

  function openCreate() { setForm(EMPTY); setEditId(null); setOpen(true); }
  function openEdit(p: any) {
    setForm({ name: p.name, type: p.type, status: p.status, description: p.description ?? "", website: p.website ?? "" });
    setEditId(p.id); setOpen(true);
  }

  async function submit() {
    if (!form.name.trim()) return;
    const data: any = { name: form.name, type: form.type, status: form.status };
    if (form.description) data.description = form.description;
    if (form.website) data.website = form.website;
    try {
      if (editId !== null) {
        await updatePartnership.mutateAsync({ id: editId, data });
        toast({ title: "Partnership updated" });
      } else {
        await createPartnership.mutateAsync({ data });
        toast({ title: "Partnership created" });
      }
      invalidate();
      setOpen(false);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  async function remove(id: number) {
    await deletePartnership.mutateAsync({ id });
    invalidate();
    toast({ title: "Partnership removed" });
  }

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-primary glow-text">Partnerships</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">{partnerships.length} strategic alliances in the NEXUS network</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-mono">
          <Plus className="w-4 h-4" /> New Partnership
        </Button>
      </motion.div>

      <div className="space-y-3">
        <AnimatePresence>
          {partnerships.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 glow-border group hover:border-primary/20 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Handshake className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{p.name}</p>
                  <span className={`text-[10px] font-mono uppercase ${TYPE_COLORS[p.type] ?? ""}`}>{p.type}</span>
                </div>
                {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                {p.website && (
                  <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-chart-2 font-mono hover:underline flex items-center gap-1 mt-1">
                    <Globe className="w-3 h-3" /> {p.website}
                  </a>
                )}
              </div>
              <span className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border shrink-0 ${STATUS_COLORS[p.status] ?? ""}`}>
                {p.status.toUpperCase()}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs border-border/50 gap-1" onClick={() => openEdit(p)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => remove(p.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLoading && partnerships.length === 0 && (
        <div className="text-center py-20 text-muted-foreground font-mono">
          <Handshake className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No partnerships yet.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-primary tracking-widest">{editId ? "Edit Partnership" : "New Partnership"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="Partner name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Type</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {["protocol", "infrastructure", "dao", "exchange", "launchpad", "other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {["active", "pending", "negotiating", "closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">Description</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="Brief description" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">Website</label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-border/50">Cancel</Button>
            <Button onClick={submit} className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono">{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
