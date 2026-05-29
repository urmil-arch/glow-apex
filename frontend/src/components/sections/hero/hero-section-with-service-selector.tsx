import React, { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { ThumbsUp, Eye, MessageSquare, UserPlus } from "lucide-react";
import ServiceSelectionComponent from "./service-selection-component";

// Service tabs configuration
const serviceOptions = [
  { id: "views", title: "YouTube Views", icon: <Eye className="h-5 w-5" /> },
  {
    id: "subscribers",
    title: "YouTube Subscribers",
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    id: "likes",
    title: "YouTube Likes",
    icon: <ThumbsUp className="h-5 w-5" />,
  },
  {
    id: "comments",
    title: "YouTube Comments",
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

const HeroSectionWithTabs: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>("views");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  return (
    <>
      {/* Service Selection Tabs - Above the entire hero section */}
      <div className="container mx-auto px-4 pt-24 pb-6">
        <motion.div
          className="flex items-center justify-center gap-2 w-full flex-wrap md:flex-nowrap"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {serviceOptions.map((service) => (
            <motion.button
              key={service.id}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
                selectedService === service.id
                  ? "bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-md"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => handleServiceChange(service.id)}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <span>{service.icon}</span>
              <span className="md:block">{service.title}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Main Hero Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Content Side */}
          <motion.div
            className="flex flex-col gap-2"
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="bg-gradient-to-r from-teal-400/10 to-emerald-500/10 text-emerald-600 font-medium px-4 py-2 rounded-full w-fit mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              #1 Social Media Growth Service
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold capitalize mb-3"
              variants={fadeIn}
              transition={{ delay: 0.2 }}
            >
              {selectedService === "likes" && "Get Real YouTube Likes"}
              {selectedService === "views" && "Boost Your YouTube Views"}
              {selectedService === "comments" && "Increase Video Comments"}
              {selectedService === "subscribers" && "Grow Your Subscribers"}
              <motion.span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Fast & Authentic
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-lg text-gray-600 mb-4"
              variants={fadeIn}
              transition={{ delay: 0.3 }}
            >
              {selectedService === "likes" &&
                "Boost your video engagement with high-quality YouTube likes from real users. Improve your rankings and visibility to get more organic traffic."}
              {selectedService === "views" &&
                "Increase your video views with high-retention views from real people. Enhance your social proof and get the YouTube algorithm working for you."}
              {selectedService === "comments" &&
                "Add authentic engagement to your videos with custom comments from real users. Build a thriving community around your content."}
              {selectedService === "subscribers" &&
                "Grow your YouTube channel with real, active subscribers. Reach the 1,000 subscriber milestone faster and qualify for monetization."}
            </motion.p>

            <motion.hr
              className="border border-t-black/10 w-full my-6"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: 0.4 }}
            />

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 items-center justify-center gap-5"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.5,
                  },
                },
              }}
            >
              {selectedService === "likes" && (
                <>
                  <BenefitItem text="Higher Video Engagement" />
                  <BenefitItem text="Better Algorithm Rankings" />
                  <BenefitItem text="Increased Social Proof" />
                  <BenefitItem text="100% Safe Delivery" />
                </>
              )}
              {selectedService === "views" && (
                <>
                  <BenefitItem text="Improved Watch Time" />
                  <BenefitItem text="Enhanced Video Rankings" />
                  <BenefitItem text="Higher Visibility" />
                  <BenefitItem text="Real, Human Views" />
                </>
              )}
              {selectedService === "comments" && (
                <>
                  <BenefitItem text="Authentic Engagement" />
                  <BenefitItem text="Custom Comment Options" />
                  <BenefitItem text="Increased Video Activity" />
                  <BenefitItem text="Natural Delivery" />
                </>
              )}
              {selectedService === "subscribers" && (
                <>
                  <BenefitItem text="Faster Channel Growth" />
                  <BenefitItem text="Quicker Monetization" />
                  <BenefitItem text="Enhanced Channel Authority" />
                  <BenefitItem text="Permanent Subscribers" />
                </>
              )}
            </motion.div>

            <motion.div
              className="mt-8 flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs overflow-hidden"
                  >
                    <img src={`/assets/images/users/user${i+1}.jpg`} alt="user" height={32} width={32}  />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-black">2,500+</span> customers
                trusted us this month
              </p>
            </motion.div>
          </motion.div>

          {/* Service Selection Component with selected service passed as prop */}
          <ServiceSelectionComponent serviceType={selectedService} />
        </div>
      </section>
    </>
  );
};

// Helper component for the benefit items
const BenefitItem = ({ text }: { text: string }) => {
  return (
    <motion.p
      className="font-semibold flex items-center justify-start gap-2 text-gray-700"
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
      }}
      whileHover={{ x: 5, transition: { duration: 0.2 } }}
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" }}
        className="text-emerald-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </motion.span>
      {text}
    </motion.p>
  );
};

export default HeroSectionWithTabs;
