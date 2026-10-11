import type { Metadata, Viewport } from "next";
import { INTRO_SEEN_KEY, SITE_URL } from "@/config/site";
import { ToastNotifications } from "@/components/ui/ToastNotifications";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Gilson Parrilha — Hamburgueria artesanal", template: "%s | Gilson Parrilha" },
  description: "Hambúrgueres artesanais feitos na brasa. Veja o cardápio e faça seu pedido pelo WhatsApp.",
  icons: { icon: "/gilson-parrilha-logo.jpeg", apple: "/gilson-parrilha-logo.jpeg" },
};

export const viewport: Viewport = {
  themeColor: "#17120F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)}))document.documentElement.setAttribute("data-intro-seen","")}catch(e){}`,
          }}
        />
      </head>
      <body>
        <a href="#conteudo" className="sr-only z-50 rounded-sm bg-brasa px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          Pular para o conteúdo
        </a>
        {children}
        <ToastNotifications />
      </body>
    </html>
  );
}
