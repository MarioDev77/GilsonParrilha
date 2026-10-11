import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

const control =
  "w-full rounded-sm border border-carvao-600 bg-carvao px-3 text-[15px] text-osso placeholder:text-fumaca/70 transition-colors hover:border-fumaca/50 focus:border-brasa focus:outline-none focus:ring-1 focus:ring-brasa disabled:opacity-60 aria-[invalid=true]:border-red-400";

interface Shared {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
}

function Wrapper({ id, label, error, hint, hideLabel, children, className }: Shared & { id: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={cn("mb-1.5 block text-sm font-medium text-osso", hideLabel && "sr-only")}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-fumaca">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Shared>(function TextField(
  { label, error, hint, hideLabel, className, ...rest },
  ref
) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} hideLabel={hideLabel} className={className}>
      <input ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} className={cn(control, "h-11")} {...rest} />
    </Wrapper>
  );
});

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Shared>(function TextareaField(
  { label, error, hint, hideLabel, className, rows = 3, ...rest },
  ref
) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} hideLabel={hideLabel} className={className}>
      <textarea ref={ref} id={id} rows={rows} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} className={cn(control, "py-2.5")} {...rest} />
    </Wrapper>
  );
});

export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Shared>(function SelectField(
  { label, error, hint, hideLabel, className, children, ...rest },
  ref
) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} hideLabel={hideLabel} className={className}>
      <select ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} className={cn(control, "h-11")} {...rest}>
        {children}
      </select>
    </Wrapper>
  );
});

export const CheckboxField = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; description?: string }>(
  function CheckboxField({ label, description, className, ...rest }, ref) {
    const id = useId();
    return (
      <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 text-sm", className)}>
        <input ref={ref} id={id} type="checkbox" className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brasa" {...rest} />
        <span>
          <span className="font-medium text-osso">{label}</span>
          {description && <span className="block text-xs text-fumaca">{description}</span>}
        </span>
      </label>
    );
  }
);
