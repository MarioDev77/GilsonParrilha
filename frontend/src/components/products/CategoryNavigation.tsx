"use client";

import type { Category } from "@/types";
import { cn } from "@/utils/cn";

interface Props {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}

export function CategoryNavigation({ categories, value, onChange }: Props) {
  const items = [{ id: "", name: "Todos" }, ...categories];
  return (
    <nav aria-label="Categorias do cardápio" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-2 py-1">
        {items.map((c) => {
          const active = value === c.id;
          return (
            <li key={c.id || "todos"}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(c.id)}
                className={cn(
                  "h-10 whitespace-nowrap rounded-sm px-4 text-[15px] font-semibold transition-colors",
                  active ? "bg-brasa text-white" : "bg-carvao-700 text-osso ring-1 ring-inset ring-carvao-600 hover:bg-carvao-600"
                )}
              >
                {c.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
