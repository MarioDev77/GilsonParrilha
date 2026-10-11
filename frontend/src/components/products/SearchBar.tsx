"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Buscar no cardápio por nome
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-fumaca" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar pelo nome do lanche"
        autoComplete="off"
        className="h-12 w-full rounded-sm border border-carvao-600 bg-carvao-800 pl-10 pr-10 text-[15px] placeholder:text-fumaca/70 hover:border-fumaca/50 focus:border-brasa focus:outline-none focus:ring-1 focus:ring-brasa [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Limpar busca" className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-fumaca hover:text-osso">
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
