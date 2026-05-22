import BoostSection from "@/components/common/boost-section";
import FAQSection from "@/components/common/faq-section";
import { benefitsData, faqData, features } from "@/config/data";
import React from "react";
import WhyChooseSection from "@/components/sections/home/why-choose-us-section";
import TrustBrandsSection from "@/components/sections/common/trustBrands-section";
import { WhyPromoteSection } from "@/components/common/why-should-you-promote-section";
import BenefitsSection from "@/components/sections/home/benefits-section";
import HowWeDeliverSection from "@/components/sections/home/how-we-deliver-section";
import HomeHeroSection from "@/components/sections/hero/home-hero-section";
import HeroSectionWithServiceSelector from "@/components/sections/hero/hero-section-with-service-selector";

export default function Home() {
  return (
    <>
      <div className="min-h-screen sm:overflow-x-auto overflow-x-hidden pt-44">
        <HomeHeroSection />
        <HeroSectionWithServiceSelector/>
        <TrustBrandsSection />
        <WhyChooseSection />
        <BoostSection />
        <HowWeDeliverSection features={features} />
        <WhyPromoteSection />
        <BenefitsSection benefitsData={benefitsData} />
        <FAQSection faqs={faqData} />
      </div>
    </>
  );
}
