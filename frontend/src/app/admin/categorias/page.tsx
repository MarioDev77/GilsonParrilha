"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { categoriesService } from "@/services/categories";
import { errorMessage } from "@/services/http";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const { data, loading, error, reload } = useAsync((s) => categoriesService.adminList(s), []);
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (data) setItems([...data].sort((a, b) => a.order - b.order));
  }, [data]);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = items;
    setItems(next);
    setReordering(true);
    try {
      await categoriesService.reorder(next.map((c) => c.id));
    } catch (err) {
      setItems(previous);
      toast.error(errorMessage(err));
    } finally {
      setReordering(false);
    }
  }

  async function toggleActive(c: Category) {
    try {
      await categoriesService.update(c.id, { name: c.name, active: !c.active });
      toast.success(c.active ? `${c.name} foi desativada` : `${c.name} foi ativada`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await categoriesService.remove(deleting.id);
      toast.success(`${deleting.name} foi removida`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-5xl font-black">Categorias</h1>
        <Button onClick={() => setEditing("new")} icon={<Plus className="size-4" aria-hidden />}>
          Nova categoria
        </Button>
      </div>
      <p className="text-sm text-fumaca">A ordem abaixo é a ordem do cardápio. Para vincular produtos, escolha a categoria no cadastro do produto.</p>

      {loading && !data ? (
        <LoadingState label="Carregando categorias…" />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon={<Tags className="size-9" aria-hidden />} title="Nenhuma categoria" description="Crie categorias como Hambúrgueres, Combos, Porções e Bebidas." />
      ) : (
        <ul className="divide-y divide-carvao-600 rounded-sm border border-carvao-600">
          {items.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button type="button" disabled={i === 0 || reordering} onClick={() => move(i, -1)} aria-label={`Subir ${c.name}`} className="grid size-7 place-items-center rounded-sm hover:bg-carvao-700 disabled:opacity-30">
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button type="button" disabled={i === items.length - 1 || reordering} onClick={() => move(i, 1)} aria-label={`Descer ${c.name}`} className="grid size-7 place-items-center rounded-sm hover:bg-carvao-700 disabled:opacity-30">
                  <ArrowDown className="size-4" aria-hidden />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-fumaca">
                  {c.productCount ?? 0} {(c.productCount ?? 0) === 1 ? "produto" : "produtos"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={c.active}
                aria-label={`${c.name}: ativa`}
                onClick={() => toggleActive(c)}
                className={`relative h-7 w-12 rounded-full transition-colors ${c.active ? "bg-brasa" : "bg-carvao-600"}`}
              >
                <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white transition-transform ${c.active ? "translate-x-5" : ""}`} />
              </button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(c)} icon={<Pencil className="size-4" aria-hidden />} aria-label={`Editar ${c.name}`}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleting(c)} aria-label={`Excluir ${c.name}`}>
                <Trash2 className="size-4 text-red-300" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nova categoria" : "Editar categoria"} size="sm">
        {editing && (
          <CategoryForm
            category={editing === "new" ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>

      <ConfirmationDialog
        open={!!deleting}
        danger
        title="Excluir categoria"
        description={
          <>
            <strong className="text-osso">{deleting?.name}</strong> será removida. Se ela tiver produtos vinculados, o servidor pode recusar a exclusão.
          </>
        }
        confirmLabel="Excluir categoria"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
