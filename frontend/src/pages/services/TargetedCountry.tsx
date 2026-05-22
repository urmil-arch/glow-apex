import React from "react";
import FAQSection from "@/components/common/faq-section";
import SectionHeader from "@/components/common/section-header";
import { FeatureSection } from "@/components/sections/home/feature-section";
import TestimonialSection from "@/components/sections/common/testimonial-section";
import HowToBuy from "@/components/common/purchase-flow";
import {
  whyBuyCountryTargetedSubscribersData,
  countryTargetedSubscribersFaqData,
} from "@/config/data";
import CountryTargetedSubscribersHeroSection from "@/components/sections/hero/country-targeted-subscribers-hero";

const CountryTargetedYoutubeSubscribers = () => {
  return (
    <div>
      {/* Hero Section */}
      <CountryTargetedSubscribersHeroSection />

      {/* Why Buy Section */}
      <div className="sm:mb-32 mb-20 bg-gradient-to-b to-transparent from-[#0eca6d] w-full rounded-3xl pt-44">
        <section className="container p-16">
          <SectionHeader
            tabHeading="why"
            title="Why Buy Country-Targeted YouTube Subscribers from buyrealviews.com?"
          />
          <div className="mt-22 grid grid-rows-3 gap-4 relative">
            <div className="bg-white rounded-3xl p-5 flex items-center justify-start gap-4 md:w-fit w-full md:mx-0 mx-auto">
              <div className="bg-[#0eca6d] h-full w-[60px] flex items-center justify-center rounded-xl">
                <p className="text-2xl text-background font-bold">1</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Relevant Audience</h3>
                <p className="text-lg">
                  Target subscribers from specific countries.
                </p>
              </div>
            </div>
            <img
              src={"/assets/illustration/down-arrow.svg"}
              width={252}
              height={252}
              alt="arrow"
              className="absolute left-[330px] lg:block hidden"
            />
            <div className="bg-white rounded-3xl p-5 flex items-center justify-start gap-4 md:w-fit w-full mx-auto z-10 lg">
              <div className="bg-[#0eca6d] h-full w-[60px] flex items-center justify-center rounded-xl">
                <p className="text-2xl text-background font-bold">2</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Higher Engagement</h3>
                <p className="text-lg">
                  Subscribers from your target region engage more.
                </p>
              </div>
            </div>
            <img
              src={"/assets/illustration/down-arrow.svg"}
              width={252}
              height={252}
              alt="arrow"
              className="absolute right-[195px] top-[125px] lg:block hidden"
            />
            <div className="bg-white rounded-3xl p-5 flex items-center justify-start gap-4 md:w-fit w-full md:ml-auto md:mx-0 mx-auto">
              <div className="bg-[#0eca6d] h-full w-[60px] flex items-center justify-center rounded-xl">
                <p className="text-2xl text-background font-bold">3</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Local SEO Boost</h3>
                <p className="text-lg">
                  Improve regional visibility and discovery.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Feature Section */}
      <FeatureSection data={whyBuyCountryTargetedSubscribersData} />

      {/* Testimonial Section */}
      <TestimonialSection />

      {/* How to Buy Section */}
      <HowToBuy />

      {/* FAQ Section */}
      <FAQSection faqs={countryTargetedSubscribersFaqData} />
    </div>
  );
};

export default CountryTargetedYoutubeSubscribers;
