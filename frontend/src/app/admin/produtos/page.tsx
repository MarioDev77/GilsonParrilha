"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Star, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { categoriesService } from "@/services/categories";
import { errorMessage } from "@/services/http";
import { productsService } from "@/services/products";
import type { Product } from "@/types";
import { formatBRL } from "@/utils/format";

const PAGE_SIZE = 15;

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 350);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const products = useAsync((s) => productsService.adminList({ q: debouncedQ.trim(), page, pageSize: PAGE_SIZE }, s), [debouncedQ, page]);
  const categories = useAsync((s) => categoriesService.adminList(s), []);

  const data = products.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const categoryName = (p: Product) => p.categoryName ?? categories.data?.find((c) => c.id === p.categoryId)?.name ?? "—";

  async function toggleAvailability(p: Product) {
    setTogglingId(p.id);
    try {
      await productsService.setAvailability(p.id, !p.available);
      toast.success(p.available ? `${p.name} ficou indisponível` : `${p.name} voltou ao cardápio`);
      products.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await productsService.remove(deleting.id);
      toast.success(`${deleting.name} foi removido`);
      setDeleting(null);
      products.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-5xl font-black">Produtos</h1>
        <Button onClick={() => setEditing("new")} disabled={!categories.data?.length} icon={<Plus className="size-4" aria-hidden />}>
          Novo produto
        </Button>
      </div>
      {categories.data && categories.data.length === 0 && (
        <p role="status" className="rounded-sm border border-cobre/40 bg-cobre/10 px-4 py-3 text-sm text-cobre-300">
          Cadastre ao menos uma categoria antes de criar produtos.
        </p>
      )}

      <TextField label="Buscar produto pelo nome" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-sm" />

      {products.loading && !data ? (
        <LoadingState label="Carregando produtos…" />
      ) : products.error && !data ? (
        <ErrorState error={products.error} onRetry={products.reload} />
      ) : data && data.items.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed className="size-9" aria-hidden />} title={debouncedQ ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"} description={debouncedQ ? "Confira a grafia do nome." : "Cadastre o primeiro produto do cardápio."} />
      ) : data ? (
        <>
          <div className="overflow-x-auto rounded-sm border border-carvao-600">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Produtos cadastrados</caption>
              <thead className="bg-carvao-800 text-fumaca">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Produto</th>
                  <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
                  <th scope="col" className="px-4 py-3 font-medium">Preço</th>
                  <th scope="col" className="px-4 py-3 font-medium">Disponível</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carvao-600">
                {data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-carvao-800/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage src={p.imageUrl} alt="" className="size-12 shrink-0 rounded-sm" />
                        <div>
                          <p className="flex items-center gap-1.5 font-semibold">
                            {p.name}
                            {p.featured && <Star className="size-3.5 fill-cobre text-cobre" aria-label="Em destaque" />}
                          </p>
                          <p className="line-clamp-1 max-w-xs text-xs text-fumaca">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{categoryName(p)}</td>
                    <td className="px-4 py-3 text-cobre-300">{formatBRL(p.price)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.available}
                        aria-label={`${p.name}: disponível`}
                        disabled={togglingId === p.id}
                        onClick={() => toggleAvailability(p)}
                        className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${p.available ? "bg-brasa" : "bg-carvao-600"}`}
                      >
                        <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white transition-transform ${p.available ? "translate-x-5" : ""}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(p)} icon={<Pencil className="size-4" aria-hidden />} aria-label={`Editar ${p.name}`}>
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(p)} aria-label={`Excluir ${p.name}`}>
                          <Trash2 className="size-4 text-red-300" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm text-fumaca">
            <span>
              {data.total} {data.total === 1 ? "produto" : "produtos"} · página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((n) => n - 1)} icon={<ChevronLeft className="size-4" aria-hidden />}>
                Anterior
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}>
                Próxima <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Novo produto" : "Editar produto"} size="lg">
        {editing && (
          <ProductForm
            product={editing === "new" ? undefined : editing}
            categories={categories.data ?? []}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              products.reload();
            }}
          />
        )}
      </Modal>

      <ConfirmationDialog
        open={!!deleting}
        danger
        title="Excluir produto"
        description={
          <>
            <strong className="text-osso">{deleting?.name}</strong> será removido do cardápio. Se ele já aparece em pedidos, o sistema pode apenas arquivá-lo para preservar o histórico.
          </>
        }
        confirmLabel="Excluir produto"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
