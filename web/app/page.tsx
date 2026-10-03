import { Hero } from "@/components/marketing/hero";
import { ProductSections } from "@/components/marketing/product-sections";
import { SiteHeader } from "@/components/marketing/site-header";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#101828]">
      <SiteHeader />
      <Hero />
      <ProductSections />
    </main>
  );
}
