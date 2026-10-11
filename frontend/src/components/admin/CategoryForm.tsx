"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CheckboxField, TextField } from "@/components/ui/Field";
import { categorySchema, type CategoryFormValues } from "@/schemas";
import { categoriesService } from "@/services/categories";
import { errorMessage } from "@/services/http";
import type { Category } from "@/types";

export function CategoryForm({ category, onSaved, onCancel }: { category?: Category; onSaved: () => void; onCancel: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? "", active: category?.active ?? true },
  });

  async function onSubmit(values: CategoryFormValues) {
    try {
      const input = { name: values.name.trim(), active: values.active };
      if (category) await categoriesService.update(category.id, input);
      else await categoriesService.create(input);
      toast.success(category ? "Categoria atualizada" : "Categoria criada");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <TextField label="Nome da categoria" {...register("name")} error={errors.name?.message} />
      <CheckboxField label="Categoria ativa" description="Categorias inativas não aparecem no cardápio." {...register("active")} />
      <div className="flex justify-end gap-2 border-t border-carvao-600 pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {category ? "Salvar alterações" : "Criar categoria"}
        </Button>
      </div>
    </form>
  );
}
