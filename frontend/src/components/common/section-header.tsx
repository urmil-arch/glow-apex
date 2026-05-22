"use client";
import React from "react";
import { motion } from "framer-motion";

type SectionHeaderProps = {
  title: string;
  subheading?: string;
  tabHeading?: string;
  iconElements?: React.ReactNode;
  isContainer?: boolean;
  className?: string;
  isTextLeft?: boolean;
  isTextRight?: boolean;
  isTextCenter?: boolean;
};

const SectionHeader = ({
  title,
  subheading,
  iconElements,
}: SectionHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7 }}
    className="text-center relative max-w-3xl mx-auto"
  >
    {iconElements}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
        {title}
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto">{subheading}</p>
    </motion.div>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: 120 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mx-auto mt-6 rounded-full"
    ></motion.div>
  </motion.div>
);

export default SectionHeader;
