"use client";

import CallToAction from "@/components/call-to-action";
import FooterSection from "@/components/footer";
import HeroSection from "@/components/hero-section";
// import Pricing from "@/components/pricing";
import SonnetFeatures from "@/components/sonnet-features";
import SonnetPublishSection from "@/components/sonnet-publish-section";
import SonnetSyncSection from "@/components/sonnet-sync-section";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@clerk/nextjs";

export default function MarketingPage() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    <div className="flex items-center justify-center">
      <Spinner />
    </div>;
  }

  return (
    <div className="">
      <HeroSection />
      <SonnetFeatures />
      <SonnetSyncSection />
      <SonnetPublishSection />
      {/* <Pricing /> */}
      <CallToAction />
      <FooterSection />
    </div>
  );
}
