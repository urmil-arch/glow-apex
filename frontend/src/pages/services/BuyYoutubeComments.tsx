import { ReasonCard } from "@/components/cards/reason-card";
import FAQSection from "@/components/common/faq-section";
import PurchaseFlow from "@/components/common/purchase-flow";
import SectionHeader from "@/components/common/section-header";
import TestimonialSection from "@/components/sections/common/testimonial-section";
import ServiceSelectionComponent from "@/components/sections/hero/service-selection-component";
import { WhyChooseFeatureCard } from "@/components/sections/home/why-choose-us-section";
import {
  youtubeCommentsFaqData,
} from "@/config/data";
import {
  CircleGauge,
  Earth,
  Headset,
  Landmark,
  Rocket,
  Shield,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import React from "react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: "normal" | "alt";
}


const features: Feature[] = [
  {
    icon: <Shield size={32} className="text-white" />,
    title: "Authentic",
    description:
      "Genuine views from real users, keeping your channel safe and compliant.",
    variant: "normal",
  },
  {
    icon: <Landmark size={32} className="text-white" />,
    title: "Affordable",
    description: "Competitive pricing to help you grow without overspending.",
    variant: "alt",
  },
  {
    icon: <CircleGauge size={32} className="text-white" />,
    title: "Fast",
    description: "Quick delivery so you see results instantly.",
    variant: "normal",
  },
  {
    icon: <Earth size={32} className="text-white" />,
    title: "Non-Drop",
    description:
      "Once the service is delivered, it will stay forever, without any drops",
    variant: "alt",
  },
];

const BuyYoutubeComments = () => {
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
              Increase Video Comments
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
                Fast & Authentic
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Add authentic engagement to your videos with custom comments from real users. Build a thriving community around your content.
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
                Authentic Engagement
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Custom Comment Options
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Increased Video Activity
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Natural Delivery
              </div>
            </div>
          </div>
          
          {/* Service Selection Component */}
          <ServiceSelectionComponent serviceType="comments" />
        </div>
      </section>
      <div className="bg-emerald-500 p-10 my-18">
        <section className="container">
          <SectionHeader
            className="!text-white"
            title="Why YouTube Comments Matter"
            tabHeading="why"
          />
          <div className="mt-16 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-1">
            {features.map((feature, index) => (
              <WhyChooseFeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
                variant={feature.variant}
              />
            ))}
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
      <section className="pb-32">
        <PurchaseFlow btnText="Buy comments now" />
      </section>
      <section className="container pb-32">
        <SectionHeader
          iconElements={
            <>
              <img
                className="absolute -left-16 -top-10 sm:block hidden"
                src={"/assets/illustration/left-spark.svg"}
                alt="spark1"
                width={28}
                height={28}
              />
              <img
                className="absolute -right-20 sm:block hidden"
                src={"/assets/illustration/right-spark.svg"}
                alt="spark2"
                width={22}
                height={22}
              />
              <img
                className="absolute -left-12 sm:block hidden top-5 "
                src={"/assets/illustration/dot.svg"}
                alt="dot"
                width={10}
                height={10}
              />
            </>
          }
          title="Why Choose Our YouTube Comments"
          tabHeading="why"
        />
        <div className="mt-12 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">
          <ReasonCard
            title="100% Real Users"
            desc="No bots, only authentic engagement from real people"
            image="/assets/illustration/targeted-audience.svg"
          />
          <ReasonCard
            title="Natural Delivery"
            desc="Comments appear gradually for an organic look"
            image="/assets/illustration/seo-growth.svg"
          />
          <ReasonCard
            title="Safe & Secure"
            desc="Compliant with YouTube's guidelines to protect your channel"
            image="/assets/illustration/success.svg"
          />
          <ReasonCard
            title="Custom Comments"
            desc="Relevant comments that match your content"
            image="/assets/illustration/grow-your-money.svg"
          />
        </div>
      </section>
      <TestimonialSection />
      <FAQSection faqs={youtubeCommentsFaqData} />
    </div>
  );
};

export default BuyYoutubeComments;