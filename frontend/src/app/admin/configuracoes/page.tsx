"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { CheckboxField, TextField, TextareaField } from "@/components/ui/Field";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { settingsSchema, type SettingsFormValues } from "@/schemas";
import { errorMessage } from "@/services/http";
import { settingsService } from "@/services/settings";
import type { AdminSettings } from "@/types";

const numberOrNull = (v: unknown) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

function SettingsForm({ initial, onSaved }: { initial: AdminSettings; onSaved: (s: AdminSettings) => void }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(initial.heroImageUrl);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: initial.businessName,
      whatsapp: initial.whatsapp,
      phone: initial.phone ?? "",
      address: initial.address ?? "",
      instagramUrl: initial.instagramUrl ?? "",
      facebookUrl: initial.facebookUrl ?? "",
      heroHeadline: initial.heroHeadline ?? "",
      acceptsDelivery: initial.acceptsDelivery,
      acceptsPickup: initial.acceptsPickup,
      deliveryFee: initial.deliveryFee,
      minimumOrder: initial.minimumOrder,
      prepTimeMinutes: initial.prepTimeMinutes,
      serviceMessage: initial.serviceMessage ?? "",
      openingHours: initial.openingHours,
    },
  });
  const hours = useFieldArray({ control, name: "openingHours" });

  async function onSubmit(v: SettingsFormValues) {
    const payload: AdminSettings = {
      businessName: v.businessName.trim(),
      logoUrl,
      heroImageUrl,
      heroHeadline: v.heroHeadline?.trim() || null,
      whatsapp: v.whatsapp.replace(/\D/g, ""),
      phone: v.phone?.trim() || null,
      address: v.address?.trim() || null,
      instagramUrl: v.instagramUrl?.trim() || null,
      facebookUrl: v.facebookUrl?.trim() || null,
      openingHours: v.openingHours,
      acceptsDelivery: v.acceptsDelivery,
      acceptsPickup: v.acceptsPickup,
      deliveryFee: v.deliveryFee,
      minimumOrder: v.minimumOrder,
      prepTimeMinutes: v.prepTimeMinutes,
      serviceMessage: v.serviceMessage?.trim() || null,
    };
    try {
      onSaved(await settingsService.adminSave(payload));
      toast.success("Configurações salvas");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-10">
      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-3xl font-bold">Identidade</legend>
        <TextField label="Nome comercial" {...register("businessName")} error={errors.businessName?.message} />
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUploader label="Logotipo oficial" value={logoUrl} onChange={setLogoUrl} />
          <ImageUploader label="Foto principal da página inicial" value={heroImageUrl} onChange={setHeroImageUrl} />
        </div>
        <TextField label="Frase de destaque da página inicial" hint="Deixe em branco para usar a frase padrão." {...register("heroHeadline")} error={errors.heroHeadline?.message} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-3xl font-bold">Contato</legend>
        <TextField label="WhatsApp para receber pedidos" inputMode="numeric" placeholder="5575999999999" hint="Somente números, com DDI e DDD." {...register("whatsapp")} error={errors.whatsapp?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Telefone" {...register("phone")} />
          <TextField label="Endereço" {...register("address")} />
          <TextField label="Link do Instagram" placeholder="https://instagram.com/..." {...register("instagramUrl")} error={errors.instagramUrl?.message} />
          <TextField label="Link do Facebook" placeholder="https://facebook.com/..." {...register("facebookUrl")} error={errors.facebookUrl?.message} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-3xl font-bold">Atendimento</legend>
        <div className="flex flex-wrap gap-6">
          <CheckboxField label="Aceita entrega" {...register("acceptsDelivery")} />
          <CheckboxField label="Aceita retirada" {...register("acceptsPickup")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Taxa de entrega (R$)" type="number" step="0.01" min="0" {...register("deliveryFee", { setValueAs: numberOrNull })} error={errors.deliveryFee?.message} />
          <TextField label="Pedido mínimo (R$)" type="number" step="0.01" min="0" {...register("minimumOrder", { setValueAs: numberOrNull })} error={errors.minimumOrder?.message} />
          <TextField label="Prazo de preparo (min)" type="number" min="0" {...register("prepTimeMinutes", { setValueAs: numberOrNull })} error={errors.prepTimeMinutes?.message} />
        </div>
        <TextareaField label="Mensagem de atendimento" hint="Aparece na seção de horários do site." maxLength={300} {...register("serviceMessage")} error={errors.serviceMessage?.message} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-display text-3xl font-bold">Horários de funcionamento</legend>
        {hours.fields.map((f, i) => (
          <div key={f.id} className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <TextField label="Dia(s)" placeholder="Terça a domingo" {...register(`openingHours.${i}.day`)} error={errors.openingHours?.[i]?.day?.message} />
            <TextField label="Horário" placeholder="18h às 23h" {...register(`openingHours.${i}.hours`)} error={errors.openingHours?.[i]?.hours?.message} />
            <button type="button" onClick={() => hours.remove(i)} aria-label={`Remover horário ${i + 1}`} className="grid size-11 place-items-center self-end rounded-sm text-fumaca hover:bg-carvao-700 hover:text-red-300">
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => hours.append({ day: "", hours: "" })} icon={<Plus className="size-4" aria-hidden />}>
          Adicionar horário
        </Button>
      </fieldset>

      <div className="sticky bottom-0 -mx-4 border-t border-carvao-600 bg-carvao/95 px-4 py-4 backdrop-blur">
        <Button type="submit" size="lg" loading={isSubmitting}>
          Salvar configurações
        </Button>
      </div>
    </form>
  );
}

export default function AdminSettingsPage() {
  const { data, loading, error, reload, setData } = useAsync((s) => settingsService.adminGet(s), []);

  return (
    <div className="space-y-8">
      <h1 className="text-5xl font-black">Configurações</h1>
      {loading && !data ? (
        <LoadingState label="Carregando configurações…" />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <SettingsForm initial={data} onSaved={setData} />
      ) : null}
    </div>
  );
}
