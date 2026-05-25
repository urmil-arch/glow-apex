import FAQSection from "@/components/common/faq-section";
import SectionHeader from "@/components/common/section-header";
import { FeatureSection } from "@/components/sections/home/feature-section";
import ServiceSelectionComponent from "@/components/sections/hero/service-selection-component";
import TestimonialSection from "@/components/sections/common/testimonial-section";
import {
  youtubeFeatureData,
  youtubeLikesFaqData,
} from "@/config/data";
import HowToBuy from "@/components/common/purchase-flow";
import { Headset, Rocket, ShieldCheck, UserCheck } from "lucide-react";

export interface CardData {
  image: string;
  title: string;
  description: string;
}

const YoutubeVideoLikes = () => {
  return (
    <div>
      {/* Service Selection Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Content Side */}
          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-r from-teal-400/10 to-emerald-500/10 text-emerald-600 font-medium px-4 py-2 rounded-full w-fit mb-2">
              #1 Social Media Growth Service
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold capitalize mb-3">
              Get Real YouTube Likes
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
                Fast & Authentic
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Boost your video engagement with high-quality YouTube likes from real users. Improve your rankings and visibility to get more organic traffic.
            </p>
            <hr className="border border-t-black/10 w-full my-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center justify-center gap-5">
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Higher Video Engagement
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Better Algorithm Rankings
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Increased Social Proof
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                100% Safe Delivery
              </div>
            </div>
          </div>
          
          {/* Service Selection Component */}
          <ServiceSelectionComponent serviceType="likes" />
        </div>
      </section>
      <div className="sm:mb-32 mb-20 bg-gradient-to-b to-transparent from-[#0eca6d] w-full rounded-3xl sm:pt-44">
        <section className="container p-16">
          <SectionHeader
            tabHeading="why"
            title="Why Buy YouTube Likes from glowapex.com?"
          />
          <div className="mt-22 grid grid-rows-3 gap-4 relative">
            <div className="bg-white rounded-3xl p-5 flex items-center justify-start gap-4 md:w-fit w-full md:mx-0 mx-auto">
              <div className="bg-[#0eca6d] h-full w-[60px] flex items-center justify-center rounded-xl">
                <p className="text-2xl text-background font-bold">1</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Select Package</h3>
                <p className="text-lg">Choose likes quantity that fits your goals</p>
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
                <h3 className="text-2xl font-semibold">Real Engagement</h3>
                <p className="text-lg">Authentic likes from active YouTube users</p>
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
                <h3 className="text-2xl font-semibold">Grow Fast</h3>
                <p className="text-lg">Higher engagement leads to more visibility</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className="container pb-32">
        <SectionHeader tabHeading="Safety" title="Why Choose Glow-Apex" />
        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-6 mt-16">
          <div className="flex flex-col items-center justify-center">
            <div className="bg-[#0eca6d]/10 p-4 rounded-full mb-4">
              <ShieldCheck size={34} />
            </div>
            <h3 className="text-2xl font-bold mt-2">100% Safe</h3>
            <p className="text-lg mt-2 text-center">
              Compliant with YouTube&apos;s policies
            </p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="bg-[#0eca6d]/10 p-4 rounded-full mb-4">
              <Rocket size={34} />
            </div>
            <h3 className="text-2xl font-bold mt-2">Fast Delivery</h3>
            <p className="text-lg mt-2 text-center">See results within hours</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="bg-[#0eca6d]/10 p-4 rounded-full mb-4">
              <UserCheck size={34} />
            </div>
            <h3 className="text-2xl font-bold mt-2">Real Engagement</h3>
            <p className="text-lg mt-2 text-center">
              Authentic views from real users
            </p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="bg-[#0eca6d]/10 p-4 rounded-full mb-4">
              <Headset size={34} />
            </div>
            <h3 className="text-2xl font-bold mt-2">24/7 Support</h3>
            <p className="text-lg mt-2 text-center">
              We&apos;re here whenever you need us
            </p>
          </div>
        </div>
      </section>
      <FeatureSection data={youtubeFeatureData} />
      <TestimonialSection />
      <HowToBuy btnText="Buy likes now" />
      <FAQSection faqs={youtubeLikesFaqData} />
    </div>
  );
};

export default YoutubeVideoLikes;
