import { useState, useEffect } from "react";
import { CheckSquare } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import DynamicPackageSelector from "./DynamicPackageSelector";

const features: string[] = [
  "Authentic YouTube Shorts Likes",
  "High Engagement",
  "No Drop in Likes",
  "Safe Payment",
  "Customer Support",
  "Delivery on Time",
];

const YoutubeShortsLikesHeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  const fadeIn: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const checkboxAnimation: Variants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } };

  return (
    <section className="container mx-auto px-4 pb-12 lg:pb-20 pt-44">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <motion.div className="flex flex-col gap-2" initial="hidden" animate={isVisible ? "visible" : "hidden"} variants={fadeIn} transition={{ duration: 0.5 }}>
          <motion.div className="bg-gradient-to-r from-teal-400/10 to-emerald-500/10 text-emerald-600 font-medium px-4 py-2 rounded-full w-fit mb-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            Most Popular Service
          </motion.div>
          <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold capitalize mb-3" variants={fadeIn} transition={{ delay: 0.2 }}>
            Buy YouTube Shorts{" "}
            <motion.span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              Likes
            </motion.span>{" "}
            now
          </motion.h1>
          <motion.p className="text-lg text-gray-600 mb-4" variants={fadeIn} transition={{ delay: 0.3 }}>
            Give wings to your YouTube Shorts with high quality Likes that no YouTube algorithm can suspect. Because, they are from real people! Experience the doping effect of the right audience with a reasonable price with BuyRealViews.
          </motion.p>
          <motion.hr className="border border-t-black/10 w-full my-6" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "100%" }} transition={{ delay: 0.4 }} />
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 items-center justify-center gap-5" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}>
            {features.map((feature, index) => (
              <motion.p key={index} className="font-semibold flex items-center justify-start gap-2 text-gray-700" variants={checkboxAnimation} whileHover={{ x: 5, transition: { duration: 0.2 } }}>
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + index * 0.1, type: "spring" }} className="text-emerald-500">
                  <CheckSquare size={20} />
                </motion.span>
                {feature}
              </motion.p>
            ))}
          </motion.div>
          <motion.div className="mt-8 flex items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs overflow-hidden">
                  <img src={`/assets/images/users/user${i + 1}.jpg`} alt="user" height={32} width={32} />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600"><span className="font-bold text-black">551+</span> customers bought this in the last 24 hours</p>
          </motion.div>
        </motion.div>
        <DynamicPackageSelector serviceType="youtube_shorts_likes" categoryName="YouTube Shorts Likes" title="Buy YouTube Shorts Likes" />
      </div>
    </section>
  );
};

export default YoutubeShortsLikesHeroSection;
