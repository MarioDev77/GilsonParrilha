"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Field";
import { userSchema, type UserFormValues } from "@/schemas";
import { errorMessage } from "@/services/http";
import { usersService } from "@/services/users";
import type { AdminRole, AdminUser } from "@/types";

export function UserForm({ user, roles, onSaved, onCancel }: { user?: AdminUser; roles: AdminRole[]; onSaved: () => void; onCancel: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", role: user?.role ?? "", active: user?.active ?? true, password: "" },
  });

  async function onSubmit(v: UserFormValues) {
    try {
      if (user) {
        await usersService.update(user.id, { name: v.name.trim(), email: v.email.trim(), role: v.role, active: v.active });
      } else {
        if (!v.password || v.password.length < 8) {
          setError("password", { message: "A senha inicial deve ter ao menos 8 caracteres" });
          return;
        }
        await usersService.create({ name: v.name.trim(), email: v.email.trim(), role: v.role, active: v.active, password: v.password });
      }
      toast.success(user ? "Usuário atualizado" : "Usuário criado");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off" className="space-y-4">
      <TextField label="Nome" {...register("name")} error={errors.name?.message} />
      <TextField label="E-mail" type="email" {...register("email")} error={errors.email?.message} />
      <SelectField label="Função" {...register("role")} error={errors.role?.message}>
        <option value="">Escolha…</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </SelectField>
      {!user && <TextField label="Senha inicial" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres. A senha é enviada ao servidor e nunca guardada no navegador." {...register("password")} error={errors.password?.message} />}
      <CheckboxField label="Acesso ativo" {...register("active")} />
      <div className="flex justify-end gap-2 border-t border-carvao-600 pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {user ? "Salvar alterações" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
