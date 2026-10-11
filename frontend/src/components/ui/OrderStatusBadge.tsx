import type { OrderStatus } from "@/types";
import { cn } from "@/utils/cn";
import { ORDER_STATUS_LABEL, ORDER_STATUS_SHORT, ORDER_STATUS_STYLE } from "@/utils/orderStatus";

export function OrderStatusBadge({ status, short, className }: { status: OrderStatus; short?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-1 text-xs font-semibold ring-1 ring-inset", ORDER_STATUS_STYLE[status], className)}>
      {(short ? ORDER_STATUS_SHORT : ORDER_STATUS_LABEL)[status] ?? status}
    </span>
  );
}
