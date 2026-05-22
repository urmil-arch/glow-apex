import React from 'react'
import SectionHeader from '../../common/section-header'
import { motion } from "framer-motion";
import { BenefitsCard } from '../../common/benefits-card';
import { Benefit } from '@/config/data';

const BenefitsSection: React.FC<{ benefitsData: Benefit[] }> = ({
  benefitsData,
}) => {
  return (
    <section className="container pb-32 relative overflow-hidden">
      {/* Background decorative elements */}
      <motion.div
        className="absolute -right-10 top-20 w-40 h-40 bg-emerald-500 rounded-full opacity-10 blur-3xl"
        animate={{
          y: [0, 20, 0],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      ></motion.div>

      <motion.div
        className="absolute -left-20 bottom-40 w-60 h-60 bg-emerald-600 rounded-full opacity-10 blur-3xl"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 0.5,
        }}
      ></motion.div>

      <SectionHeader
        title="The Benefits of Buying YouTube Views from us"
        subheading='Many ask, "Is it safe to buy YouTube views?" Yes, if you use a trusted service like buyrealviews.com.'
        tabHeading="benefits"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mt-10 grid lg:grid-cols-3 grid-cols-1 gap-6"
      >
        {benefitsData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <BenefitsCard
              icon={item.icon}
              title={item.title}
              benefits={item.benefits}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default BenefitsSection