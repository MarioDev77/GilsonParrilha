import { BrandIntro } from "@/components/layout/BrandIntro";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MobileCartBar } from "@/components/cart/MobileCartBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider } from "@/context/SettingsContext";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <BrandIntro />
      <CartProvider>
        <Header />
        <main id="conteudo" className="min-h-[60dvh]">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <MobileCartBar />
      </CartProvider>
    </SettingsProvider>
  );
}
