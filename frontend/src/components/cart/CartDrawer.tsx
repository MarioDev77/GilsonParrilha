"use client";

import { Modal } from "@/components/ui/Modal";
import { useCart } from "@/context/CartContext";
import { CartContents } from "./CartContents";

export function CartDrawer() {
  const { drawerOpen, closeDrawer } = useCart();
  return (
    <Modal open={drawerOpen} onClose={closeDrawer} title="Seu carrinho" variant="drawer">
      <CartContents variant="drawer" onNavigate={closeDrawer} />
    </Modal>
  );
}
