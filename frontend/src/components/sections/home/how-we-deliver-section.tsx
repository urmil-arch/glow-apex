"use client";
import React from "react";
import SectionHeader from "@/components/common/section-header";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Feature } from "@/config/data";

const HowWeDeliverSection: React.FC<{ features: Feature[] }> = ({
  features,
}) => {
  return (
    <section className="container pb-32 relative overflow-hidden">
      {/* Background decorative elements */}
      <motion.div
        className="absolute -left-20 top-40 w-40 h-40 bg-emerald-500 rounded-full opacity-10 blur-3xl"
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      ></motion.div>

      <motion.div
        className="absolute -right-20 bottom-40 w-60 h-60 bg-emerald-600 rounded-full opacity-10 blur-3xl"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
      ></motion.div>

      <SectionHeader
        title="How We Deliver Views - Is It Safe?"
        subheading='Many ask, "Is it safe to buy YouTube views?" Yes, if you use a trusted service like glowapex.com.'
        tabHeading="how"
      />

      <div className="mt-10 relative">
        {features.map((feature, index) => (
          <HowDeliverCard
            key={feature.number}
            number={feature.number}
            title={feature.title}
            description={feature.description}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default HowWeDeliverSection;

interface HowDeliverCardProps {
  number: number;
  title: string;
  description: string;
  index?: number;
  className?: string;
}

const HowDeliverCard: React.FC<HowDeliverCardProps> = ({
  number,
  title,
  description,
  index = 0,
  className = "",
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      style={{ top: `calc(114px + ${index * 20}px` }}
      className={`w-full bg-gradient-to-r from-[#0eca6d] to-[#0b9c4e] rounded-4xl sm:p-16 p-8 sticky mt-4 border-2 border-white shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Animated background elements */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-white opacity-5"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          backgroundSize: "200% 200%",
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10%, transparent 50%)",
        }}
      ></motion.div>

      <div className="flex sm:flex-row flex-col items-start gap-4 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
          className="bg-white h-16 w-16 rounded-2xl flex-shrink-0 inline-flex items-center justify-center mb-4 text-3xl font-bold shadow-lg"
        >
          {number}
        </motion.div>

        <div className="flex-grow">
          <motion.h4
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
            className="text-3xl font-semibold text-white"
          >
            {title}
          </motion.h4>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
            className="text-lg mt-2 max-w-lg text-white/90"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: "100px" } : { width: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.5 }}
            className="h-1 bg-white/30 mt-4 rounded-full"
          ></motion.div>
        </div>
      </div>
    </motion.div>
  );
};
