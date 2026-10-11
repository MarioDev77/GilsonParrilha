"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { TextareaField } from "./Field";

interface Props {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  /** Quando definido, exige uma justificativa (ex.: cancelamento de pedido). */
  reasonLabel?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationDialog({ open, title, description, confirmLabel, danger, reasonLabel, loading, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);
  const needsReason = !!reasonLabel;
  const invalid = needsReason && reason.trim().length < 3;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      locked={loading}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Voltar
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} disabled={invalid} onClick={() => onConfirm(needsReason ? reason.trim() : undefined)}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-fumaca">
        <div>{description}</div>
        {needsReason && (
          <TextareaField label={reasonLabel} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} hint="Mínimo de 3 caracteres." />
        )}
      </div>
    </Modal>
  );
}
