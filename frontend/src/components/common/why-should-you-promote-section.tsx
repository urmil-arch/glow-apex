import React, { useEffect } from "react";
import SectionHeader from "@/components/common/section-header";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const WhyPromoteSection: React.FC = () => {
  const navigate = useNavigate();
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const cards = [
    {
      title: "Stand Out from the Crowd",
      image: "/assets/illustration/growth.svg",
      description:
        "With millions of videos uploaded daily, promotion ensures your content gets the attention it deserves.",
    },
    {
      title: "Reach Your Target Audience",
      image: "/assets/illustration/targeted-audience.svg",
      description:
        "Purchasing views helps your videos reach the right people, enhancing engagement and conversions.",
    },
    {
      title: "Save Time and Effort",
      image: "/assets/illustration/save-time.svg",
      description:
        "Instead of waiting months or years to grow your channel, buying views accelerates the process.",
    },
  ];

  return (
    <div className="w-full mb-32">
      <section className="container">
        <SectionHeader
          title="Why Should You Promote Your YouTube Videos?"
          subheading="When it comes to buying YouTube views, not all services are equal. At buyrealviews, we help you stand out and reach more people."
          tabHeading="why"
        />

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid lg:grid-cols-3 grid-cols-1 sm:gap-6 gap-12 mt-12"
        >
          {cards.map((card, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group flex flex-col items-center justify-center gap-2 relative"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
                className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-4xl opacity-10 blur-lg group-hover:opacity-20 transition duration-300"
              ></motion.div>

              <motion.h4
                className="font-semibold text-xl z-10 mb-1 relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              >
                {card.title}
              </motion.h4>

              <motion.div
                whileHover={{
                  scale: 1.05,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                className="h-[245px] w-[340px] rounded-3xl flex items-center justify-center bg-gradient-to-r from-[#0eca6d] to-[#0b9c4e] relative overflow-hidden shadow-lg z-10"
              >
                <motion.div
                  className="absolute inset-0 bg-white opacity-10"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                ></motion.div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    width={250}
                    height={250}
                    className="transform transition-transform duration-300 group-hover:scale-110"
                  />
                </motion.div>
              </motion.div>

              <motion.p
                className="text-center mt-4 max-w-xs text-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              >
                {card.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
        <motion.button
          onClick={() => {
            navigate("/5648/buy-youtube-views");
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer mt-12 bg-gradient-to-r from-emerald-500 to-emerald-700 px-6 py-3 rounded-full text-white font-medium shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all duration-300 mx-auto"
        >
          Buy Views Now!
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </section>
    </div>
  );
};
