"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { UserForm } from "@/components/admin/UserForm";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/services/http";
import { usersService } from "@/services/users";
import type { AdminUser } from "@/types";

export default function AdminUsersPage() {
  const { user: me } = useAdminAuth();
  const users = useAsync((s) => usersService.list(s), []);
  const roles = useAsync((s) => usersService.roles(s), []);
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  const roleLabel = (id: string) => roles.data?.find((r) => r.id === id)?.label ?? id;

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await usersService.remove(deleting.id);
      toast.success("Usuário removido");
      setDeleting(null);
      users.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-5xl font-black">Usuários</h1>
        <Button onClick={() => setEditing("new")} disabled={!roles.data} icon={<Plus className="size-4" aria-hidden />}>
          Novo usuário
        </Button>
      </div>
      <p className="text-sm text-fumaca">Só administradores criam contas. As permissões de cada função são definidas e aplicadas pelo servidor.</p>

      {users.loading && !users.data ? (
        <LoadingState label="Carregando usuários…" />
      ) : users.error && !users.data ? (
        <ErrorState error={users.error} onRetry={users.reload} />
      ) : users.data && users.data.length === 0 ? (
        <EmptyState icon={<Users className="size-9" aria-hidden />} title="Nenhum usuário" />
      ) : users.data ? (
        <ul className="divide-y divide-carvao-600 rounded-sm border border-carvao-600">
          {users.data.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {u.name} {u.id === me?.id && <span className="text-xs font-normal text-fumaca">(você)</span>}
                </p>
                <p className="text-xs text-fumaca">
                  {u.email} · {roleLabel(u.role)}
                  {!u.active && " · acesso desativado"}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(u)} icon={<Pencil className="size-4" aria-hidden />} aria-label={`Editar ${u.name}`}>
                Editar
              </Button>
              {u.id !== me?.id && (
                <Button size="sm" variant="ghost" onClick={() => setDeleting(u)} aria-label={`Excluir ${u.name}`}>
                  <Trash2 className="size-4 text-red-300" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Novo usuário" : "Editar usuário"} size="sm">
        {editing && (
          <UserForm
            user={editing === "new" ? undefined : editing}
            roles={roles.data ?? []}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              users.reload();
            }}
          />
        )}
      </Modal>

      <ConfirmationDialog
        open={!!deleting}
        danger
        title="Excluir usuário"
        description={
          <>
            <strong className="text-osso">{deleting?.name}</strong> perderá o acesso ao painel.
          </>
        }
        confirmLabel="Excluir usuário"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
