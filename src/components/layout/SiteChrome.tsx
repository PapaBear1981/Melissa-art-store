import { CartProvider } from "@/lib/cart/CartProvider";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Header } from "./Header";
import { Footer } from "./Footer";

/** Header, footer and cart around every public page (not the /studio dashboard). */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
