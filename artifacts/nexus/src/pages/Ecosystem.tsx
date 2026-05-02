import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListEcosystemProjects, useCreateEcosystemProject, useUpdateEcosystemProject, useDeleteEcosystemProject, getListEcosystemProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Boxes, Trash2, Pencil, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  live: "text-primary bg-primary/10 border-primary/30",
  building: "text-chart-2 bg-chart-2/10 border-chart-2/30",
  planned: "text-chart-5 bg-chart-5/10 border-chart-5/30",
  paused: "text-muted-foreground bg-muted/10 border-border",
};

const CATEGORY_COLORS: Record<string, string> = {
  defi: "text-primary",
  nft: "text-chart-3",
  gaming: "text-chart-5",
  dao: "text-chart-4",
  infrastructure: "text-chart-2",
  bridge: "text-chart-1",
  oracle: "text-chart-2",
  other: "text-muted-foreground",
};

type ProjectForm = { name: string; category: string; status: string; description: string; website: string; tvl: string; users: string };
const EMPTY: ProjectForm = { name: "", category: "defi", status: "building", description: "", website: "", tvl: "", users: "" };

export default function Ecosystem() {
  const { data: projects = [], isLoading } = useListEcosystemProjects();
  const createProject = useCreateEcosystemProject();
  const updateProject = useUpdateEcosystemProject();
  const deleteProject = useDeleteEcosystemProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListEcosystemProjectsQueryKey() });

  function openCreate() { setForm(EMPTY); setEditId(null); setOpen(true); }
  function openEdit(p: any) {
    setForm({ name: p.name, category: p.category, status: p.status, description: p.description ?? "", website: p.website ?? "", tvl: p.tvl ?? "", users: p.users?.toString() ?? "" });
    setEditId(p.id); setOpen(true);
  }

  async function submit() {
    if (!form.name.trim()) return;
    const data: any = { name: form.name, category: form.category, status: form.status };
    if (form.description) data.description = form.description;
    if (form.website) data.website = form.website;
    if (form.tvl) data.tvl = form.tvl;
    if (form.users) data.users = parseInt(form.users);
    try {
      if (editId !== null) {
        await updateProject.mutateAsync({ id: editId, data });
        toast({ title: "Project updated" });
      } else {
        await createProject.mutateAsync({ data });
        toast({ title: "Project added to ecosystem" });
      }
      invalidate();
      setOpen(false);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  async function remove(id: number) {
    await deleteProject.mutateAsync({ id });
    invalidate();
    toast({ title: "Project removed" });
  }

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-primary glow-text">Ecosystem</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">{projects.length} projects building on NEXUS</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-mono">
          <Plus className="w-4 h-4" /> Add Project
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 glow-border group hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">{project.name}</p>
                  </div>
                  <span className={`text-[10px] font-mono uppercase font-medium ${CATEGORY_COLORS[project.category] ?? ""}`}>
                    {project.category}
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full border shrink-0 ${STATUS_COLORS[project.status] ?? ""}`}>
                  {project.status.toUpperCase()}
                </span>
              </div>

              {project.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">TVL</p>
                  <p className="text-foreground font-medium">{project.tvl ?? "—"}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-muted-foreground mb-0.5"><Users className="w-3 h-3" /> Users</div>
                  <p className="text-foreground font-medium">{(project.users ?? 0).toLocaleString()}</p>
                </div>
              </div>

              {project.website && (
                <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-xs text-chart-2 font-mono hover:underline flex items-center gap-1 mb-3 truncate">
                  <Globe className="w-3 h-3 shrink-0" /> {project.website}
                </a>
              )}

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1 border-border/50" onClick={() => openEdit(project)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => remove(project.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLoading && projects.length === 0 && (
        <div className="text-center py-20 text-muted-foreground font-mono">
          <Boxes className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No ecosystem projects yet.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-primary tracking-widest">{editId ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="Project name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Category</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {["defi", "nft", "gaming", "dao", "infrastructure", "bridge", "oracle", "other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {["live", "building", "planned", "paused"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">Description</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="Brief description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">TVL</label>
                <Input value={form.tvl} onChange={e => setForm(f => ({ ...f, tvl: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="$1.2B" />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Users</label>
                <Input type="number" value={form.users} onChange={e => setForm(f => ({ ...f, users: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="10000" />
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase">Website</label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="mt-1 bg-secondary/50 border-border/50" placeholder="https://..." />
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
