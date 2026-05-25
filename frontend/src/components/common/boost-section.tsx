import { CheckCircle, ArrowRight, Zap } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SectionHeader from "./section-header";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    id: 1,
    href: "/5648/buy-youtube-views",
    title: "Get Noticed & Rank Higher!",
    points: [
      "More views improve your video's ranking in search results.",
      "More engagement boosts recommendation chances.",
      "Boost visibility and attract more organic viewers.",
    ],
    buttonText: "Buy Views",
    imgSrc: "/assets/illustration/hero.svg",
    color: "#0eca6d",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 2,
    href: "/5648/buy-youtube-subscribers",
    title: "Build Trust & Look Popular!",
    points: [
      "A higher view count makes your content more appealing.",
      "Viewers trust and engage more with popular videos.",
      "Increase credibility and attract organic followers.",
    ],
    buttonText: "Buy Subscribers",
    imgSrc: "/assets/illustration/trust.svg",
    color: "#0eca6d",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    id: 3,
    href: "/2342/buy-youtube-video-likes",
    title: "Accelerate Your Channel's Growth!",
    points: [
      "Kickstart your journey with instant views.",
      "Reach milestones like monetization faster.",
      "Grow your audience and stay ahead of the competition.",
    ],
    buttonText: "Buy Likes",
    imgSrc: "/assets/illustration/growth.svg",
    color: "#0eca6d",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 4,
    href: "/376/buy-youtube-comments",
    title: "Unlock Your YouTube Success!",
    points: [
      "More views lead to better reach and engagement.",
      "Stand out and attract more collaborations.",
      "Turn your content into a powerful success story.",
    ],
    buttonText: "Buy Comments",
    imgSrc: "/assets/illustration/success.svg",
    color: "#0eca6d",
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

const BoostSection = () => {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState(sections[0]);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate through sections every 5 seconds
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % sections.length;
      setActiveIndex(nextIndex);
      setSelectedSection(sections[nextIndex]);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex, isAutoPlay]);

  // Stop auto-rotation when user interacts
  const handleSectionClick = (index: number) => {
    setIsAutoPlay(false);
    setActiveIndex(index);
    setSelectedSection(sections[index]);
  };

  return (
    <section className="container py-20 overflow-hidden">
      <div className="relative">
        {/* Background Elements - Animated */}
        <motion.div
          animate={{
            rotate: 360,
            transition: { duration: 30, repeat: Infinity, ease: "linear" },
          }}
          className="absolute -z-10 top-40 left-20 w-64 h-64 bg-emerald-300 rounded-full opacity-10 blur-3xl"
        ></motion.div>

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            transition: {
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="absolute -z-10 bottom-40 right-20 w-80 h-80 bg-emerald-400 rounded-full opacity-10 blur-3xl"
        ></motion.div>

        <SectionHeader
          title="Boost Your YouTube with Real Views!"
          subheading="When it comes to buying YouTube views, not all services are equal. At Glow-Apex, we deliver authentic engagement that helps your channel grow."
          iconElements={
            <>
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className="absolute left-24 -top-10 sm:block hidden"
              >
                <img
                  src={"/assets/illustration/left-spark.svg"}
                  alt="spark1"
                  width={28}
                  height={28}
                />
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 10, 0],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  },
                }}
                className="absolute right-0 sm:block hidden"
              >
                <img
                  src={"/assets/illustration/right-spark.svg"}
                  alt="spark2"
                  width={22}
                  height={22}
                />
              </motion.div>

              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  },
                }}
                className="absolute right-8 top-10 sm:block hidden"
              >
                <img
                  src={"/assets/illustration/dot.svg"}
                  alt="dot"
                  width={10}
                  height={10}
                />
              </motion.div>
            </>
          }
          tabHeading="boost"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-16"
        >
          <div className="px-4 md:px-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className=" md:p-10 p-0"
            >
              <div className="flex flex-wrap items-center justify-center sm:gap-6 gap-1 mb-10">
                {sections.map((section, index) => (
                  <SectionButton
                    key={index}
                    label={section.buttonText}
                    icon={section.icon}
                    onClick={() => handleSectionClick(index)}
                    isSelected={activeIndex === index}
                    index={index}
                  />
                ))}
              </div>

              <div
                key={selectedSection.id}
                // initial={{ opacity: 0 }}
                // animate={{ opacity: 1 }}
                // transition={{ duration: 0.5 }}
                className="mt-5 w-full text-black rounded-3xl relative overflow-hidden min-h-[430px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-10 rounded-3xl"></div>

                <div className="relative z-10 p-6 md:p-10">
                  <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="md:w-1/2"
                    >
                      <h4 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                        {selectedSection.title}
                      </h4>

                      <ul className="mt-6 space-y-4">
                        {selectedSection.points.map((point, idx) => (
                          <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: 0.3 + idx * 0.1,
                              duration: 0.5,
                            }}
                            className="flex items-start gap-3"
                            key={point}
                          >
                            <div className="bg-emerald-100 p-1 rounded-full mt-0.5">
                              <CheckCircle className="text-emerald-600 w-5 h-5" />
                            </div>
                            <span className="text-lg text-gray-700">
                              {point}
                            </span>
                          </motion.li>
                        ))}
                      </ul>

                      <motion.button
                        onClick={() => {
                          navigate(selectedSection.href);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer mt-8 bg-gradient-to-r from-emerald-500 to-emerald-700 px-6 py-3 rounded-full text-white font-medium shadow-lg flex items-center gap-2 hover:shadow-xl transition-all duration-300"
                      >
                        {selectedSection.buttonText}
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.1 }}
                      className="md:w-1/2 flex justify-center"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 -m-6 bg-gradient-to-r from-emerald-200 to-emerald-100 rounded-full opacity-30 blur-2xl"></div>
                        <img
                          alt={selectedSection.title}
                          src={selectedSection.imgSrc}
                          width={400}
                          height={400}
                          className="z-10 relative max-w-full h-auto transform hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-600 opacity-10 rounded-full -ml-10 -mb-10"></div>
              </div>

              {/* Progress indicators */}
              {/* <div className="sm:flex hidden justify-center mt-8 space-x-2">
                {sections.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1 rounded-full ${
                      index === activeIndex
                        ? "w-8 bg-emerald-500"
                        : "w-4 bg-gray-300"
                    }`}
                    animate={{ width: index === activeIndex ? 32 : 16 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleSectionClick(index)}
                  ></motion.div>
                ))}
              </div> */}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BoostSection;

const SectionButton = ({
  label,
  icon,
  onClick,
  isSelected,
  index,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          ${
            isSelected
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
              : "bg-gray-100 hover:bg-gray-200"
          } 
          p-1 rounded-full cursor-pointer transition-all duration-300
        `}
      >
        <button
          onClick={onClick}
          className={`
            rounded-full px-5 py-3 flex items-center gap-2 font-medium 
            ${
              isSelected
                ? "bg-white text-emerald-600"
                : "bg-white text-gray-700"
            }
          `}
        >
          {icon}
          {label}
        </button>
      </motion.div>
      <motion.div
        animate={{
          scale: isSelected ? 1 : 0,
          opacity: isSelected ? 1 : 0,
        }}
        className="h-1.5 w-8 bg-emerald-500 rounded-full mt-2"
      ></motion.div>
    </motion.div>
  );
};
