import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import SectionHeader from "@/components/common/section-header";
import { Shield, Zap, RefreshCw, Lock } from "lucide-react";

interface BrandLogo {
  src: string;
  alt: string;
  width: number;
}

const TrustBrandsSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  // Sample brand logos - replace with your actual logos
  const brandLogos: BrandLogo[] = [
    { src: "/assets/icons/logo-1.png", alt: "Brand 1", width: 160 },
    { src: "/assets/icons/logo-2.png", alt: "Brand 2", width: 160 },
    { src: "/assets/icons/logo-3.png", alt: "Brand 3", width: 160 },
    { src: "/assets/icons/logo-4.png", alt: "Brand 4", width: 160 },
    { src: "/assets/icons/logo-5.png", alt: "Brand 5", width: 160 },
    { src: "/assets/icons/logo-6.png", alt: "Brand 6", width: 160 },
    { src: "/assets/icons/logo-7.png", alt: "Brand 7", width: 160 },
    { src: "/assets/icons/logo-8.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-9.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-10.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-11.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-12.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-13.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-14.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-15.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-16.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-17.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-18.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-19.png", alt: "Brand 8", width: 160 },
    { src: "/assets/icons/logo-20.png", alt: "Brand 8", width: 160 },
  ];

  return (
    <div ref={ref} className="py-16 overflow-hidden">
      <SectionHeader
        title="Trusted by Brands Worldwide"
        subheading="Join thousands of content creators and companies who trust our services to grow their YouTube presence"
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
      />

      <div className="mt-16 relative">
        {/* Gradient overlays for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white to-transparent"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white to-transparent"></div>

        {/* First marquee - left to right */}
        <div className="marquee-container py-6 relative">
          <motion.div
            className="marquee-track flex items-center space-x-12"
            animate={{
              x: [0, -50 * brandLogos.length],
              transition: {
                x: {
                  repeat: Infinity,
                  duration: 30,
                  ease: "linear",
                },
              },
            }}
          >
            {/* First set of logos */}
            {brandLogos.map((logo, index) => (
              <motion.div
                key={`logo-1-${index}`}
                className="flex-shrink-0 mx-6 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {/* <div className="h-20 flex items-center bg-white p-4 rounded-xl shadow-md border border-gray-100"> */}
                <div className="h-20 flex items-center ">
                  <img
                    src={logo.src}
                    width={logo.width}
                    height={100}
                    alt={logo.alt}
                    className="grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </motion.div>
            ))}

            {/* Duplicate logos for seamless loop */}
            {brandLogos.map((logo, index) => (
              <motion.div
                key={`logo-2-${index}`}
                className="flex-shrink-0 mx-6 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-20 flex items-center">
                {/* <div className="h-20 flex items-center bg-white p-4 rounded-xl shadow-md border border-gray-100"> */}
                  <img
                    src={logo.src}
                    width={logo.width}
                    height={100}
                    alt={logo.alt}
                    className="grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Second marquee - right to left (different speed) */}
        <div className="marquee-container py-6 relative mt-6">
          <motion.div
            className="marquee-track flex items-center space-x-12"
            animate={{
              x: [-50 * brandLogos.length, 0],
              transition: {
                x: {
                  repeat: Infinity,
                  duration: 25,
                  ease: "linear",
                },
              },
            }}
          >
            {/* First set of logos */}
            {[...brandLogos].reverse().map((logo, index) => (
              <motion.div
                key={`logo-rev-1-${index}`}
                className="flex-shrink-0 mx-6 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-20 flex items-center ">
                  <img
                    src={logo.src}
                    width={logo.width}
                    height={100}
                    alt={logo.alt}
                    className="grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </motion.div>
            ))}

            {/* Duplicate logos for seamless loop */}
            {[...brandLogos].reverse().map((logo, index) => (
              <motion.div
                key={`logo-rev-2-${index}`}
                className="flex-shrink-0 mx-6 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-20 flex items-center">
                  <img
                    src={logo.src}
                    width={logo.width}
                    height={100}
                    alt={logo.alt}
                    className="grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="container mx-auto mt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          variants={{
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.5,
                staggerChildren: 0.1,
              },
            },
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center"
        >
          {[
            {
              icon: <Shield size={32} className="text-emerald-500" />,
              title: "Secure Payments",
              desc: "SSL encrypted checkout",
            },
            {
              icon: <Zap size={32} className="text-emerald-500" />,
              title: "Fast Delivery",
              desc: "Start seeing results in minutes",
            },
            {
              icon: <RefreshCw size={32} className="text-emerald-500" />,
              title: "Money-Back Guarantee",
              desc: "100% satisfaction or refund",
            },
            {
              icon: <Lock size={32} className="text-emerald-500" />,
              title: "Privacy Protected",
              desc: "Your data stays confidential",
            },
          ].map((badge, index) => (
            <motion.div
              key={index}
              variants={{
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5 },
                },
              }}
              initial={{ opacity: 0, y: 10 }}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
            >
              <div className="flex justify-center mb-3">{badge.icon}</div>
              <h3 className="font-semibold text-lg">{badge.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{badge.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TrustBrandsSection;
