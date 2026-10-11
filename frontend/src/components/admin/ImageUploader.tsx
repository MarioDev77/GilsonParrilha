"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/products/ProductImage";
import { errorMessage } from "@/services/http";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadService } from "@/services/upload";

export function ImageUploader({ label, value, onChange }: { label: string; value: string | null; onChange: (url: string | null) => void }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadService.image(file));
      toast.success("Imagem enviada");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <ProductImage src={value} alt={label} className="size-24 shrink-0 rounded-sm" />
        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} id={id} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={(e) => handleFile(e.target.files?.[0])} className="sr-only" />
          <Button variant="secondary" size="sm" loading={uploading} onClick={() => inputRef.current?.click()} icon={<ImagePlus className="size-4" aria-hidden />}>
            {value ? "Trocar imagem" : "Enviar imagem"}
          </Button>
          {value && !uploading && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)} icon={<Trash2 className="size-4" aria-hidden />}>
              Remover
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-fumaca">JPG, PNG ou WebP, até 5 MB.</p>
    </div>
  );
}
