import { BusinessInfo } from "@/components/layout/BusinessInfo";
import { Hero } from "@/components/layout/Hero";
import { HomeMenu } from "@/components/products/HomeMenu";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeMenu />
      <BusinessInfo />
    </>
  );
}
