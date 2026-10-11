"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "center" | "drawer";
  size?: "sm" | "md" | "lg";
  /** Impede fechar por Esc/clique fora (ex.: durante um envio). */
  locked?: boolean;
}

let openCount = 0;

/** Usa o <dialog> nativo: foco preso, Esc e leitores de tela funcionam sem código extra. */
export function Modal({ open, onClose, title, children, footer, variant = "center", size = "md", locked }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      openCount += 1;
      document.body.style.overflow = "hidden";
      return () => {
        openCount = Math.max(0, openCount - 1);
        if (openCount === 0) document.body.style.overflow = "";
        if (el.open) el.close();
      };
    }
    if (!open && el.open) el.close();
  }, [open]);

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current && !locked) onClose();
      }}
      className={cn(
        "bg-carvao-800 p-0 text-osso shadow-2xl",
        variant === "drawer"
          ? "my-0 ml-auto mr-0 h-dvh max-h-dvh w-full max-w-md animate-slideIn border-l border-carvao-600"
          : cn("m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] animate-pop rounded-md border border-carvao-600", widths[size])
      )}
    >
      {open && (
        <div className="flex h-full max-h-[inherit] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-carvao-600 px-5 py-4">
            <h2 className="text-2xl font-bold leading-none">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={locked}
              aria-label="Fechar"
              className="grid size-9 place-items-center rounded-sm text-fumaca hover:bg-carvao-700 hover:text-osso disabled:opacity-40"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="pb-safe border-t border-carvao-600 px-5 pt-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
