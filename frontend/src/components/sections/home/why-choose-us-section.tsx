import React, { useEffect } from "react";
import { Shield, Landmark, CircleGauge, Earth } from "lucide-react";
import { motion, TargetAndTransition, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import SectionHeader from "@/components/common/section-header";
import { useNavigate } from "react-router-dom";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  variant: "normal" | "alt";
}

// Feature card component with animations
export const WhyChooseFeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  index,
  variant,
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const gradientClass =
    variant === "alt"
      ? "sm:bg-gradient-to-t bg-gradient-to-b from-0% from-white/50 via-80% via-white/20 to-100% to-transparent"
      : "bg-gradient-to-b from-0% from-white/50 via-80% via-white/20 to-100% to-transparent";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.15,
        ease: "easeOut",
      }}
      className={`${gradientClass} rounded-4xl p-8 relative overflow-hidden group min-h-80`}
    >
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-6"
      >
        {icon}
      </motion.div>

      <h4 className="text-4xl font-medium mt-4">{title}</h4>

      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: "40%" } : { width: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="h-1 bg-white/30 my-4"
      />

      <p className="mt-4 text-lg">{description}</p>

      {/* Decorative elements */}
      <motion.div
        className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/10 rounded-full"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.8 }}
      />

      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
    </motion.div>
  );
};

interface FloatingElementProps {
  className: string;
  animationProps: TargetAndTransition;
  delay?: number;
}

// Animated floating element
const FloatingElement: React.FC<FloatingElementProps> = ({
  className,
  animationProps,
  delay = 0,
}) => (
  <motion.div
    className={className}
    animate={animationProps}
    transition={{
      duration: 10 + Math.random() * 5,
      repeat: Infinity,
      repeatType: "reverse",
      delay: delay,
    }}
  />
);

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: "normal" | "alt";
}

const WhyChooseSection: React.FC = () => {
  const navigate = useNavigate();
  const features: Feature[] = [
    {
      icon: <Shield size={32} className="text-white" />,
      title: "Authentic",
      description:
        "Genuine views from real users, keeping your channel safe and compliant.",
      variant: "normal",
    },
    {
      icon: <Landmark size={32} className="text-white" />,
      title: "Affordable",
      description: "Competitive pricing to help you grow without overspending.",
      variant: "alt",
    },
    {
      icon: <CircleGauge size={32} className="text-white" />,
      title: "Fast",
      description: "Quick delivery so you see results instantly.",
      variant: "normal",
    },
    {
      icon: <Earth size={32} className="text-white" />,
      title: "Non-Drop",
      description:
        "Once the service is delivered, it will stay forever, without any drops",
      variant: "alt",
    },
  ];

  const controls = useAnimation();
  const [sectionRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };


  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-0 right-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <FloatingElement
          className="absolute top-20 right-20 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"
          animationProps={{
            y: [0, -15, 0],
            x: [0, 10, 0],
          }}
        />
        <FloatingElement
          className="absolute bottom-40 left-20 w-40 h-40 bg-white opacity-10 rounded-full blur-xl"
          animationProps={{
            y: [0, 20, 0],
            x: [0, -15, 0],
          }}
          delay={1}
        />
      </motion.div>

      <motion.div
        ref={sectionRef}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        className="w-full bg-gradient-to-b from-[#0eca6d] to-[#0b9c4e] rounded-4xl mb-32 shadow-2xl"
      >
        <div className="container p-8 md:p-16 py-12 md:py-22 flex flex-col items-center justify-center gap-2">
          <SectionHeader
            className="text-white"
            title="Why Choose Buyrealviews?"
            subheading="When it comes to buying YouTube views, not all services are equal. At buyrealviews, we deliver authentic engagement with transparent pricing and exceptional support."
            iconElements={
              <>
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, 10, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="absolute -left-16 -top-10 sm:block hidden"
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
                    y: [0, 8, 0],
                    rotate: [0, -10, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 0.5,
                  }}
                  className="absolute -right-20 sm:block hidden"
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
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                  className="absolute -left-12 sm:block hidden top-5"
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

          <div className="grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-3 mt-14 relative">
            {features.map((feature, index) => (
              <WhyChooseFeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
                variant={feature.variant}
              />
            ))}
          </div>

          {/* Call-to-action button */}
          <motion.button
            onClick={() => navigate("/5648/buy-youtube-views")}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
            whileTap={{ scale: 0.95 }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { delay: 1.2, duration: 0.6 },
              },
            }}
            className="cursor-pointer mt-12 bg-white text-emerald-600 py-4 px-8 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 z-10"
          >
            Get Started Today
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default WhyChooseSection;
