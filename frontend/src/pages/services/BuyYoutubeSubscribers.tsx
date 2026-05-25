import FAQSection from "@/components/common/faq-section";
import HowToBuy from "@/components/common/purchase-flow";
import SectionHeader from "@/components/common/section-header";
import TestimonialSection from "@/components/sections/common/testimonial-section";
import {
  BadgeCheck,
  ChartLine,
  Clock,
  DollarSign,
  Headset,
  Rocket,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import React from "react";
import ServiceSelectionComponent from "@/components/sections/hero/service-selection-component";
import { FeatureSection } from "@/components/sections/home/feature-section";

// Sample FAQs based on content
const subscribersFaqData = [
  {
    id: "safety",
    question: "Is it safe to buy YouTube subscribers?",
    answer:
      "Yes! We provide real and active subscribers, ensuring full compliance with YouTube's guidelines.",
  },
  {
    id: "delivery-time",
    question: "How long does it take to receive my subscribers?",
    answer:
      "Delivery times vary depending on the package, but we ensure a gradual and natural growth process.",
  },
  {
    id: "detection",
    question: "Can YouTube detect bought subscribers?",
    answer:
      "Not if they are real. Since our subscribers are 100% genuine, your channel remains safe.",
  },
  {
    id: "drop",
    question: "Will my subscribers drop over time?",
    answer:
      "We offer high-retention subscribers, but if any drop, we provide a replacement guarantee.",
  },
  {
    id: "password",
    question: "Do I need to share my YouTube password?",
    answer:
      "No! We never ask for your login details. We only need your channel link.",
  },
  {
    id: "location",
    question: "Can I choose where my subscribers come from?",
    answer:
      "Yes! We offer location-based targeting, including YouTube subscribers from India, the USA, and more.",
  },
  {
    id: "refund",
    question: "Do you offer refunds?",
    answer: "Yes! If we fail to deliver, you're eligible for a full refund.",
  },
];

// Sample feature data
const subscribersFeatureData = {
  badge: "HOW",
  title: "How More YouTube Subscribers Can Transform Your Channel",
  decorations: {
    leftSpark: "/assets/illustration/left-spark.svg",
    rightSpark: "/assets/illustration/right-spark.svg",
    dot: "/assets/illustration/dot.svg",
  },
  cards: [
    {
      image: "/assets/illustration/targeted-audience.svg",
      title: "Better Visibility",
      description:
        "Higher ranking in YouTube's search and recommendation system.",
    },
    {
      image: "/assets/illustration/seo-growth.svg",
      title: "More Organic Growth",
      description: "People subscribe to channels with strong followings.",
    },
    {
      image: "/assets/illustration/success.svg",
      title: "Higher Engagement Rates",
      description: "More comments, watch time, and audience interaction.",
    },
    {
      image: "/assets/illustration/grow-your-money.svg",
      title: "Attracts Brand Deals",
      description: "More appeal for collaborations with brands and sponsors.",
    },
  ],
};

const YouTubeSubscribers = () => {
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
              Grow Your Subscribers
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
                Fast & Authentic
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Grow your YouTube channel with real, active subscribers. Reach the 1,000 subscriber milestone faster and qualify for monetization.
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
                Faster Channel Growth
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Quicker Monetization
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Enhanced Channel Authority
              </div>
              <div className="font-semibold flex items-center justify-start gap-2 text-gray-700">
                <span className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                Permanent Subscribers
              </div>
            </div>
          </div>
          
          {/* Service Selection Component */}
          <ServiceSelectionComponent serviceType="subscribers" />
        </div>
      </section>

      {/* Feature Section */}
      <FeatureSection data={subscribersFeatureData} />

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

      {/* How to Buy Section */}
      <section className="bg-gray-50 pt-16">
        <HowToBuy btnText="Buy subscribers now" />
      </section>

      {/* Benefits Section */}
      <section className="container pb-32">
        <SectionHeader
          tabHeading="benefits"
          title="The Benefits of Growing Your Subscriber Count Instantly"
        />
        <div className="mt-16 grid md:grid-cols-4 grid-cols-1 gap-6">
          <div className="text-center">
            <div className="bg-[#0eca6d]/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-[#0eca6d]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Saves Time</h3>
            <p className="text-gray-600">
              Organic growth is slow. Buying subscribers speeds up the process.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-[#0eca6d]/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChartLine className="h-10 w-10 text-[#0eca6d]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Increases Engagement</h3>
            <p className="text-gray-600">
              More subscribers mean more activity on your videos, helping them
              perform better.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-[#0eca6d]/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BadgeCheck className="h-10 w-10 text-[#0eca6d]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Improves Social Proof</h3>
            <p className="text-gray-600">
              A larger subscriber base makes your channel look more credible.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-[#0eca6d]/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="h-10 w-10 text-[#0eca6d]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Attracts Monetization</h3>
            <p className="text-gray-600">
              Brands and advertisers look for channels with strong followings.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <TestimonialSection />

      {/* FAQ Section */}
      <FAQSection
        faqs={subscribersFaqData}
        title="FAQs - About our Youtube Subscriber Services"
      />
    </div>
  );
};

export default YouTubeSubscribers;
