import SectionHeader from "@/components/common/section-header";
import { Quote, Star } from "lucide-react";
import React from "react";

const TestimonialSection = () => {
  return (
    <section className="pb-32 relative overflow-y-clip">
      <SectionHeader title="Glow-Apex is already loved by 30,000+ customers, and you'll love it,too!" />
      <div
        className={
          "flex [mask-image:linear-gradient(to_top,transparent,black,black,transparent)] mt-16 items-center justify-center"
        }
      >
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 relative overflow-y-scroll justify-center w-full max-w-6xl gap-2 sm:px-0 px-4">
          <div className="flex flex-col items-center gap-2 mt-[20px]">
            <TestimonialCard
              text="Glow-Apex transformed my online presence completely! <highlight>The quality of followers I received was outstanding.</highlight> Real engagement that boosted my credibility instantly."
              name="Emma Thompson"
              role="Fashion Influencer"
              rating={5}
              image="/assets/images/users/user1.jpg"
              accentColor="#0eca6d"
            />
            <TestimonialCard
              text="I was skeptical at first, but the <highlight>results speak for themselves. My content reach improved by 300%</highlight> after using their services. Totally worth every penny!"
              name="Michael Rodriguez"
              role="Fitness Coach"
              rating={5}
              image="/assets/images/users/user2.jpg"
              accentColor="#12b76a"
            />
            <TestimonialCard
              text="<highlight>The customer support team was incredibly helpful</highlight> throughout the process. They answered all my questions promptly and delivered exactly what was promised."
              name="Sarah Johnson"
              role="Small Business Owner"
              rating={4}
              image="/assets/images/users/user3.jpg"
              accentColor="#15c39a"
            />
            <TestimonialCard
              text="My YouTube channel grew exponentially after using Glow-Apex. <highlight>The views were high-quality and led to genuine subscriber growth.</highlight>"
              name="David Kim"
              role="Content Creator"
              rating={5}
              image="/assets/images/users/user4.jpg"
              accentColor="#0eca6d"
            />
          </div>
          <div className="sm:flex hidden flex-col items-center gap-2 mt-[80px]">
            <TestimonialCard
              text="As a small business owner, I needed to establish social proof quickly. <highlight>Glow-Apex delivered authentic engagement</highlight>  that helped me build trust with new customers."
              name="Jessica Martinez"
              role="Boutique Owner"
              rating={5}
              image="/assets/images/users/user1.jpg"
              accentColor="#15c39a"
            />
            <TestimonialCard
              text="The organic growth I've experienced after the initial boost from Glow-Apex has been amazing. <highlight>It kickstarted my account perfectly!</highlight>"
              name="Robert Chen"
              role="Travel Blogger"
              rating={4}
              image="/assets/images/users/user2.jpg"
              accentColor="#0eca6d"
            />
            <TestimonialCard
              text="<highlight>I've tried other services before, but none delivered the quality that Glow-Apex provides.</highlight> Real engagement from real people - exactly what I needed."
              name="Amanda Wilson"
              role="Photographer"
              rating={5}
              image="/assets/images/users/user3.jpg"
              accentColor="#12b76a"
            />
            <TestimonialCard
              text="Their targeted approach ensured <highlight>I got followers who were actually interested in my niche.</highlight> This has translated to better conversion rates for my products."
              name="John Davis"
              role="E-commerce Entrepreneur"
              rating={5}
              image="/assets/images/users/user4.jpg"
              accentColor="#15c39a"
            />
          </div>
          <div className="md:flex hidden flex-col items-center gap-2">
            <TestimonialCard
              text="The authenticity of the engagement I received was impressive. <highlight>These weren't just numbers - they were real people</highlight> interacting with my content."
              name="Olivia Taylor"
              role="Lifestyle Blogger"
              rating={5}
              image="/assets/images/users/user1.jpg"
              accentColor="#0eca6d"
            />
            <TestimonialCard
              text="<highlight>My brand partnerships increased significantly</highlight> after growing my following with Glow-Apex. The ROI has been incredible!"
              name="Ryan Patel"
              role="Influencer"
              rating={4}
              image="/assets/images/users/user2.jpg"
              accentColor="#15c39a"
            />
            <TestimonialCard
              text="<highlight>The gradual delivery of followers</highlight> made the growth look natural, which was exactly what I wanted. Very professional service!"
              name="Sophia Lee"
              role="Beauty Vlogger"
              rating={5}
              image="/assets/images/users/user3.jpg"
              accentColor="#12b76a"
            />
            <TestimonialCard
              text="I appreciate how transparent Glow-Apex was about their process. <highlight>No gimmicks, just solid results</highlight> that helped my business grow."
              name="Marcus Johnson"
              role="Marketing Director"
              rating={5}
              image="/assets/images/users/user4.jpg"
              accentColor="#0eca6d"
            />
          </div>
          <div className="lg:flex hidden flex-col items-center gap-2 mt-[80px]">
            <TestimonialCard
              text="Since using Glow-Apex, I've noticed a significant increase in organic engagement. <highlight>The initial boost really helped the algorithm</highlight> favor my content."
              name="Elena Vasquez"
              role="Artist"
              rating={5}
              image="/assets/images/users/user1.jpg"
              accentColor="#12b76a"
            />
            <TestimonialCard
              text="The targeted followers I received were genuinely interested in my content, <highlight>leading to higher engagement rates and better monetization opportunities.</highlight>"
              name="Thomas Wright"
              role="Gaming Streamer"
              rating={4}
              image="/assets/images/users/user2.jpg"
              accentColor="#0eca6d"
            />
            <TestimonialCard
              text="As someone who was starting from zero, <highlight>Glow-Apex gave me the foundation I needed</highlight> to build a credible online presence. Highly recommended!"
              name="Aisha Patel"
              role="Startup Founder"
              rating={5}
              image="/assets/images/users/user3.jpg"
              accentColor="#15c39a"
            />
            <TestimonialCard
              text="The competitive edge I gained from Glow-Apex' services <highlight>helped me secure brand deals I wouldn't have qualified for otherwise.</highlight> Game-changer!"
              name="Kyle Sanders"
              role="Sports Influencer"
              rating={5}
              image="/assets/images/users/user4.jpg"
              accentColor="#12b76a"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;

type TestimonialCardProps = {
  text: string;
  name: string;
  role: string;
  rating: number;
  image?: string;
  accentColor?: string;
  compact?: boolean;
};

const TestimonialCard = ({
  text,
  name,
  role,
  rating = 5,
  image,
  accentColor = "#0eca6d",
  compact = false,
}: TestimonialCardProps) => {
  // Function to render text with highlights
  const renderTextWithHighlight = (text: string) => {
    const parts = text.split(/(<highlight>.*?<\/highlight>)/g);

    return parts.map((part, index) => {
      if (part.startsWith("<highlight>") && part.endsWith("</highlight>")) {
        const highlightText = part.replace(/<\/?highlight>/g, "");
        return (
          <span
            key={index}
            className="bg-white text-emerald-500 font-semibold backdrop-blur-sm border border-white/30"
          >
            {highlightText}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`rounded-2xl relative group transition-all duration-300 hover:shadow-xl ${
        compact ? "p-4" : "p-5"
      }`}
      style={{
        background: `linear-gradient(135deg, ${accentColor} 0%, rgba(20, 184, 166, 0.8) 100%)`,
      }}
    >
      {/* Quote icon */}
      <div className="absolute -top-3 -left-3 bg-white rounded-full p-2 shadow-md">
        <Quote className="w-4 h-4 text-[#0eca6d]" />
      </div>

      {/* Card highlights */}
      <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10">
        {/* Star rating */}
        <div className="flex mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating ? "fill-yellow-400 text-yellow-400" : "text-white/50"
              }`}
            />
          ))}
        </div>

        {/* Testimonial text with highlights */}
        <p
          className={`text-white font-medium ${
            compact ? "text-sm" : "text-base"
          } leading-relaxed`}
        >
          &quot;{renderTextWithHighlight(text)}&quot;
        </p>

        {/* User info */}
        <div className="flex items-center gap-3 mt-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-white/50"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div>
            <p className="font-bold text-white">{name}</p>
            <p className="text-white/80 text-sm">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
