"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField, TextareaField } from "@/components/ui/Field";
import { productSchema, type ProductFormValues } from "@/schemas";
import { errorMessage } from "@/services/http";
import { productsService } from "@/services/products";
import type { Category, Product, ProductInput } from "@/types";
import { linesToArray } from "@/utils/format";
import { ImageUploader } from "./ImageUploader";

export function ProductForm({ product, categories, onSaved, onCancel }: { product?: Product; categories: Category[]; onSaved: () => void; onCancel: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl ?? null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      ingredientsText: product?.ingredients.join("\n") ?? "",
      removableText: product?.removableIngredients.join("\n") ?? "",
      price: product?.price ?? (undefined as unknown as number),
      categoryId: product?.categoryId ?? "",
      available: product?.available ?? true,
      featured: product?.featured ?? false,
      badge: product?.badge ?? "",
      addons: product?.addons.map((a) => ({ id: a.id, name: a.name, price: a.price, available: a.available })) ?? [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "addons" });

  async function onSubmit(v: ProductFormValues) {
    const input: ProductInput = {
      name: v.name.trim(),
      description: v.description.trim(),
      ingredients: linesToArray(v.ingredientsText),
      removableIngredients: linesToArray(v.removableText ?? ""),
      price: v.price,
      categoryId: v.categoryId,
      available: v.available,
      featured: v.featured,
      badge: v.badge === "" ? null : v.badge,
      imageUrl,
      addons: v.addons.map((a) => ({ id: a.id, name: a.name.trim(), price: a.price, available: a.available })),
    };
    try {
      if (product) await productsService.update(product.id, input);
      else await productsService.create(input);
      toast.success(product ? "Produto atualizado" : "Produto cadastrado");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <TextField label="Nome" {...register("name")} error={errors.name?.message} />
      <TextareaField label="Descrição" maxLength={500} {...register("description")} error={errors.description?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Preço (R$)" type="number" step="0.01" min="0" inputMode="decimal" {...register("price", { valueAsNumber: true })} error={errors.price?.message} />
        <SelectField label="Categoria" {...register("categoryId")} error={errors.categoryId?.message}>
          <option value="">Escolha…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {!c.active ? " (inativa)" : ""}
            </option>
          ))}
        </SelectField>
      </div>
      <TextareaField label="Ingredientes" rows={4} hint="Um por linha." {...register("ingredientsText")} error={errors.ingredientsText?.message} />
      <TextareaField label="Ingredientes que o cliente pode retirar" rows={3} hint="Um por linha. Deixe em branco se não for permitido retirar." {...register("removableText")} />

      <ImageUploader label="Fotografia" value={imageUrl} onChange={setImageUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Etiqueta" {...register("badge")}>
          <option value="">Nenhuma</option>
          <option value="mais_pedido">Mais pedido</option>
          <option value="novidade">Novidade</option>
        </SelectField>
        <div className="space-y-3 pt-7">
          <CheckboxField label="Disponível para pedidos" {...register("available")} />
          <CheckboxField label="Destaque na página inicial" {...register("featured")} />
        </div>
      </div>

      <fieldset className="space-y-3 border-t border-carvao-600 pt-5">
        <legend className="font-display text-2xl font-bold">Adicionais</legend>
        {fields.length === 0 && <p className="text-sm text-fumaca">Nenhum adicional cadastrado para este produto.</p>}
        {fields.map((f, i) => (
          <div key={f.id} className="grid items-start gap-3 rounded-sm border border-carvao-600 p-3 sm:grid-cols-[1fr_120px_auto]">
            <TextField label="Nome do adicional" {...register(`addons.${i}.name`)} error={errors.addons?.[i]?.name?.message} />
            <TextField label="Preço (R$)" type="number" step="0.01" min="0" inputMode="decimal" {...register(`addons.${i}.price`, { valueAsNumber: true })} error={errors.addons?.[i]?.price?.message} />
            <div className="flex items-center justify-between gap-3 sm:pt-7">
              <CheckboxField label="Disponível" {...register(`addons.${i}.available`)} />
              <button type="button" onClick={() => remove(i)} aria-label={`Remover adicional ${i + 1}`} className="grid size-10 place-items-center rounded-sm text-fumaca hover:bg-carvao-700 hover:text-red-300">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => append({ name: "", price: 0, available: true })} icon={<Plus className="size-4" aria-hidden />}>
          Adicionar adicional
        </Button>
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-carvao-600 pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {product ? "Salvar alterações" : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}
