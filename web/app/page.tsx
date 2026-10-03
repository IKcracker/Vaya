import { Hero } from "@/components/marketing/hero";
import { ProductSections } from "@/components/marketing/product-sections";
import { SiteHeader } from "@/components/marketing/site-header";

export default function Home() {
  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-[7px] bg-[#101828] px-4 py-2.5 text-[13px] font-bold text-white transition-transform focus:translate-y-0">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-white text-[#101828]">
        <Hero />
        <ProductSections />
      </main>
    </>
  );
}
