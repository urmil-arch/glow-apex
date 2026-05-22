import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SectionHeader from "./section-header";
import { useParams, useNavigate } from "react-router-dom";

export type FlowCardProps = {
  number: number;
  title: string;
  description: string;
};

const FlowCard: React.FC<
  FlowCardProps & { index: number; isActive: boolean; onHover: () => void }
> = ({ number, title, description, index, isActive, onHover }) => {
  return (
    <motion.div
      className="flex items-center justify-start flex-col relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        type: "spring",
        stiffness: 100,
      }}
      onMouseEnter={onHover}
      whileHover={{ y: -5 }}
    >
      {/* Title */}
      <motion.h4
        className={`text-center text-lg font-bold transition-colors duration-300 ${
          isActive ? "text-[#0eca6d]" : "text-gray-800"
        }`}
        animate={{ scale: isActive ? 1.05 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {title}
      </motion.h4>

      {/* Circle with number */}
      <motion.div
        className={`h-16 w-16 rounded-full flex items-center justify-center my-4 relative z-10 transition-all duration-300 ${
          isActive ? "bg-[#0eca6d]" : "bg-gray-200"
        }`}
        animate={{
          boxShadow: isActive
            ? "0 0 25px rgba(14, 202, 109, 0.5)"
            : "0 0 0px rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          className={`text-xl font-bold ${
            isActive ? "text-white" : "text-gray-700"
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: index * 0.2 + 0.3,
            type: "spring",
            stiffness: 200,
          }}
        >
          {number}
        </motion.span>
      </motion.div>

      {/* Description */}
      <motion.p
        className={`text-center max-w-xs transition-colors duration-300 ${
          isActive ? "text-gray-800" : "text-gray-600"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.2 + 0.4 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

const ProgressBar: React.FC<{ activeStep: number; totalSteps: number }> = ({
  activeStep,
  totalSteps,
}) => {
  return (
    <div className="absolute top-18 left-0 right-0 md:block hidden">
      <div className="h-1 bg-gray-200 rounded-full max-w-4xl mx-auto relative">
        <motion.div
          className="h-full bg-[#0eca6d] rounded-full absolute top-0 left-0"
          initial={{ width: "0%" }}
          animate={{ width: `${(activeStep / (totalSteps - 1)) * 100}%` }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        />
      </div>
    </div>
  );
};

const PurchaseFlow: React.FC<{ data: FlowCardProps[]; btnText?: string }> = ({
  data,
  btnText,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [autoAnimate, setAutoAnimate] = useState(true);
  const { service_id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-animate through steps
    if (autoAnimate) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % data.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [data.length, autoAnimate]);

  const handleHover = (index: number) => {
    setActiveStep(index);
    setAutoAnimate(false);
  };

  // When user stops interacting, resume animation after 5 seconds
  useEffect(() => {
    if (!autoAnimate) {
      const timeout = setTimeout(() => {
        setAutoAnimate(true);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [autoAnimate]);

  return (
    <div className="relative mt-16 container">
      {/* Progress bar */}
      <ProgressBar activeStep={activeStep} totalSteps={data.length} />

      {/* Decorative Elements */}
      <div className="absolute top-18 left-0 right-0 w-full h-1 md:flex hidden items-center justify-between px-44 pointer-events-none">
        {data.map((_, index) => {
          return (
            <motion.div
              key={index}
              className={`w-4 h-4 rounded-full z-0 ${
                activeStep >= index ? "bg-[#0eca6d]" : "bg-gray-300"
              }`}
              animate={{
                scale: activeStep === index ? 1.5 : 1,
                boxShadow:
                  activeStep === index
                    ? "0 0 15px rgba(14, 202, 109, 0.5)"
                    : "none",
              }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-3 grid-cols-1 md:gap-0 gap-14 max-w-5xl mx-auto">
        {data.map((item, index) => (
          <FlowCard
            key={index}
            number={item.number}
            title={item.title}
            description={item.description}
            index={index}
            isActive={activeStep === index}
            onHover={() => handleHover(index)}
          />
        ))}
      </div>

      {/* Interactive Dots Navigation (Mobile) */}
      <motion.div
        className="flex justify-center mt-10 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {data.map((_, index) => (
          <motion.button
            key={index}
            className={`w-3 h-3 mx-2 rounded-full ${
              activeStep === index ? "bg-[#0eca6d]" : "bg-gray-300"
            }`}
            onClick={() => handleHover(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: activeStep === index ? 1.3 : 1,
            }}
          />
        ))}
      </motion.div>

      {/* Call-to-Action Button */}
      <motion.div
        className="flex justify-center mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          onClick={() => {
            navigate(`/service/${service_id}`);
          }}
          className="bg-[#0eca6d] text-white font-bold px-8 py-3 rounded-full shadow-lg flex items-center gap-2"
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 25px -5px rgba(14, 202, 109, 0.4)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <span>{btnText ? btnText : "Get Started"}</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            ></path>
          </svg>
        </motion.button>
      </motion.div>
    </div>
  );
};

// Main Section Component
const PurchaseFlowSection: React.FC<{
  data: FlowCardProps[];
  btnText?: string;
}> = ({ data, btnText }) => {
  return (
    <section className="pb-32">
      <div className="container flex flex-col items-center justify-center gap-2 mb-16">
        <SectionHeader tabHeading="process" title="How to Buy Packages?" />
      </div>
      <PurchaseFlow data={data} btnText={btnText} />
    </section>
  );
};

// Example data (you would pass your actual data)
const youtubeVideoLikeFlow: FlowCardProps[] = [
  {
    number: 1,
    title: "Choose a Package",
    description:
      "Select the YouTube Service package that best fits your needs and budget.",
  },
  {
    number: 2,
    title: "Enter Video URL",
    description: "Provide the URL of the YouTube video you want to boost.",
  },
  {
    number: 3,
    title: "Complete Payment",
    description:
      "Securely pay for your order and watch your video start getting grow.",
  },
];

export default function HowToBuy({ btnText }: { btnText?: string }) {
  return <PurchaseFlowSection data={youtubeVideoLikeFlow} btnText={btnText} />;
}
