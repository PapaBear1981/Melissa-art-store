import type { Metadata } from "next";
import { CartPageContents } from "@/components/shop/CartPageContents";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHeader title="Your cart" />
      <div className={container}>
        <CartPageContents />
      </div>
    </>
  );
}
