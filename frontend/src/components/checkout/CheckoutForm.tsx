"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Bike, Store } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { TextField, TextareaField } from "@/components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { ORDER_STORAGE_PREFIX } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { useCartQuote } from "@/hooks/useCartQuote";
import { checkoutSchema, type CheckoutValues } from "@/schemas";
import { ordersService } from "@/services/orders";
import { errorMessage } from "@/services/http";
import type { CreateOrderPayload, Fulfillment } from "@/types";
import { cn } from "@/utils/cn";
import { formatBRL, formatPhone, newId, onlyDigits } from "@/utils/format";
import { Totals } from "./OrderSummary";

/** Chave de idempotência por conteúdo do pedido: reenvios e cliques repetidos não duplicam. */
function idempotencyKeyFor(payload: CreateOrderPayload): string {
  const raw = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  const storageKey = `gilson-parrilha:idem:${hash}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const created = newId();
    sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    return newId();
  }
}
function clearIdempotency(payload: CreateOrderPayload) {
  const raw = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  try {
    sessionStorage.removeItem(`gilson-parrilha:idem:${hash}`);
  } catch {
    /* ignora */
  }
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, hydrated, clear } = useCart();
  const { settings, loading: settingsLoading, error: settingsError, reload } = useSettings();
  const lock = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", phone: "", fulfillment: "pickup", street: "", number: "", district: "", city: "", complement: "", reference: "", notes: "" },
  });

  const fulfillment = watch("fulfillment");
  const { quote, error: quoteError, loading: quoting, retry } = useCartQuote(fulfillment);

  // Ajusta a modalidade padrão ao que a loja aceita.
  useEffect(() => {
    if (!settings) return;
    if (fulfillment === "delivery" && !settings.acceptsDelivery && settings.acceptsPickup) setValue("fulfillment", "pickup");
    if (fulfillment === "pickup" && !settings.acceptsPickup && settings.acceptsDelivery) setValue("fulfillment", "delivery");
  }, [settings, fulfillment, setValue]);

  if (!hydrated || settingsLoading) return <LoadingState label="Preparando o pedido…" />;
  if (settingsError) return <ErrorState error={settingsError} onRetry={reload} />;
  if (lines.length === 0) {
    return (
      <EmptyState
        title="Seu carrinho está vazio"
        description="Adicione itens do cardápio antes de informar seus dados."
        action={
          <Link href="/cardapio" className={buttonClass("primary")}>
            Ver cardápio
          </Link>
        }
      />
    );
  }

  const modes: { id: Fulfillment; label: string; icon: typeof Bike; enabled: boolean }[] = [
    { id: "delivery", label: "Entrega", icon: Bike, enabled: settings?.acceptsDelivery ?? false },
    { id: "pickup", label: "Retirada no local", icon: Store, enabled: settings?.acceptsPickup ?? false },
  ];
  const noMode = modes.every((m) => !m.enabled);
  const blocked = noMode || quoting || !!quoteError || !quote || !quote.canCheckout;

  async function onSubmit(values: CheckoutValues) {
    if (lock.current || !quote?.canCheckout) return;
    lock.current = true;
    setSubmitting(true);

    const payload: CreateOrderPayload = {
      customer: { name: values.name.trim(), phone: onlyDigits(values.phone) },
      fulfillment: values.fulfillment,
      reference: values.fulfillment === "delivery" && values.reference ? values.reference : undefined,
      notes: values.notes || undefined,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, addonIds: l.addonIds, removedIngredients: l.removedIngredients, notes: l.notes })),
      address:
        values.fulfillment === "delivery"
          ? { street: values.street!.trim(), number: values.number!.trim(), district: values.district!.trim(), city: values.city!.trim(), complement: values.complement || undefined }
          : undefined,
    };

    try {
      const order = await ordersService.create(payload, idempotencyKeyFor(payload));
      try {
        sessionStorage.setItem(ORDER_STORAGE_PREFIX + order.id, JSON.stringify(order));
      } catch {
        /* a página do pedido pede para contatar a loja se não encontrar o resumo */
      }
      clearIdempotency(payload);
      clear();
      router.push(`/pedido/${encodeURIComponent(order.id)}`);
    } catch (err) {
      toast.error(errorMessage(err));
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="font-display text-3xl font-bold">Seus dados</legend>
          <TextField label="Nome" autoComplete="name" {...register("name")} error={errors.name?.message} />
          <TextField
            label="Telefone para contato"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(75) 99999-9999"
            {...register("phone", { onChange: (e) => setValue("phone", formatPhone(e.target.value)) })}
            error={errors.phone?.message}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-3xl font-bold">Como você quer receber?</legend>
          {noMode && <p role="alert" className="text-sm text-red-300">A loja não está aceitando pedidos pelo site agora.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {modes.map((m) => (
              <label
                key={m.id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brasa-300",
                  fulfillment === m.id ? "border-brasa bg-brasa/10" : "border-carvao-600 hover:border-fumaca/60",
                  !m.enabled && "cursor-not-allowed opacity-40"
                )}
              >
                <input type="radio" value={m.id} disabled={!m.enabled} className="sr-only" {...register("fulfillment")} />
                <m.icon className="size-5 text-cobre-300" aria-hidden />
                <span className="font-semibold">{m.label}</span>
                {!m.enabled && <span className="ml-auto text-xs text-fumaca">Indisponível</span>}
              </label>
            ))}
          </div>
        </fieldset>

        {fulfillment === "delivery" && (
          <fieldset className="space-y-4">
            <legend className="font-display text-3xl font-bold">Endereço de entrega</legend>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <TextField label="Rua" autoComplete="address-line1" {...register("street")} error={errors.street?.message} />
              <TextField label="Número" {...register("number")} error={errors.number?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Bairro" {...register("district")} error={errors.district?.message} />
              <TextField label="Cidade" autoComplete="address-level2" {...register("city")} error={errors.city?.message} />
            </div>
            <TextField label="Complemento (opcional)" {...register("complement")} error={errors.complement?.message} />
            <TextField label="Referência para localização (opcional)" placeholder="Ex.: ao lado da padaria" {...register("reference")} error={errors.reference?.message} />
          </fieldset>
        )}

        <TextareaField label="Observações gerais do pedido (opcional)" maxLength={300} {...register("notes")} error={errors.notes?.message} />
      </div>

      <aside className="h-fit space-y-4 rounded-sm border border-carvao-600 bg-carvao-800 p-5 lg:sticky lg:top-24" aria-label="Resumo do pedido">
        <h2 className="font-display text-3xl font-bold">Resumo</h2>
        <ul className="space-y-1 text-sm">
          {(quote?.lines ?? []).map((l) => (
            <li key={l.key} className="flex justify-between gap-3">
              <span>
                {l.quantity}x {l.name}
              </span>
              <span className="text-fumaca">{formatBRL(l.subtotal)}</span>
            </li>
          ))}
          {!quote && lines.map((l) => (
            <li key={l.key} className="text-fumaca">
              {l.quantity}x {l.name}
            </li>
          ))}
        </ul>

        {quoteError ? (
          <ErrorState error={quoteError} onRetry={retry} title="Não conseguimos conferir os preços" />
        ) : quote && !quoting ? (
          <>
            <Totals subtotal={quote.subtotal} deliveryFee={quote.deliveryFee} total={quote.total} showFee={fulfillment === "delivery"} />
            {quote.issues.map((issue) => (
              <p key={issue} role="alert" className="rounded-sm bg-vinho/20 px-3 py-2 text-sm text-red-200">
                {issue}
              </p>
            ))}
          </>
        ) : (
          <p className="text-sm text-fumaca" role="status">
            Conferindo preços com o servidor…
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={blocked}>
          Registrar pedido
        </Button>
        <p className="text-xs text-fumaca">
          Na próxima tela você abre o WhatsApp para enviar o pedido à hamburgueria. Não há pagamento pelo site.
        </p>
        <Link href="/carrinho" className="block text-center text-sm text-fumaca hover:text-osso">
          Voltar ao carrinho
        </Link>
      </aside>
    </form>
  );
}
