import type { ReactNode } from "react";
import { CloudOff, Inbox, Loader2, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import { ApiError, errorMessage } from "@/services/http";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-sm", className)} />;
}

export function LoadingState({ label = "Carregando…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-3 py-16 text-fumaca", className)}>
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-carvao-600 px-6 py-14 text-center">
      <div className="text-fumaca">{icon ?? <Inbox className="size-9" aria-hidden />}</div>
      <h3 className="text-2xl font-bold">{title}</h3>
      {description && <p className="max-w-md text-sm text-fumaca">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title }: { error?: unknown; onRetry?: () => void; title?: string }) {
  const status = error instanceof ApiError ? error.status : undefined;
  const Icon = status === 0 ? CloudOff : status === 403 ? ShieldAlert : TriangleAlert;
  const heading = title ?? (status === 0 ? "Sem conexão com o servidor" : status === 403 ? "Acesso não permitido" : "Não foi possível carregar");
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-md border border-vinho-400/50 bg-vinho/10 px-6 py-12 text-center">
      <Icon className="size-9 text-red-300" aria-hidden />
      <h3 className="text-2xl font-bold">{heading}</h3>
      <p className="max-w-md text-sm text-fumaca">{error ? errorMessage(error) : "Tente novamente em instantes."}</p>
      {onRetry && status !== 403 && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="size-4" aria-hidden />}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
