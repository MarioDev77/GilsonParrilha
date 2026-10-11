import { BusinessInfo } from "@/components/layout/BusinessInfo";
import { Hero } from "@/components/layout/Hero";
import { HomeMenu } from "@/components/products/HomeMenu";
import SiteLayout from "./(site)/layout";

export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <HomeMenu />
      <BusinessInfo />
    </SiteLayout>
  );
}
