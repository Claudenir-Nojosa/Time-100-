import React from "react";
import FeaturesSection from "@/components/landingpage/feature-section";
import FAQSection from "@/components/landingpage/faq";
import HeroSection from "@/components/landingpage/hero";
import CarrouselSection from "@/components/landingpage/carrousel";
import ProductShowSection from "@/components/landingpage/productShow";
import TestimonialsSection from "@/components/landingpage/testimonials";
import PricingSection from "@/components/landingpage/pricing";
import { Footer } from "@/components/landingpage/footer";

const HomePageLayout = () => {
  return (
    <>
      <HeroSection />^
      <CarrouselSection />
      <ProductShowSection />
      <TestimonialsSection />
      <PricingSection />
      <FeaturesSection />
      <FAQSection />
      <Footer />
    </>
  );
};

export default HomePageLayout;
