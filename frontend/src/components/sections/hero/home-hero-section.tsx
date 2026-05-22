import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Heart, MessageCircle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RecentVisitors from "../common/recent-visitors";

const HomeHeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerButtons = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const buttonVariant = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 15px -3px rgba(22, 163, 74, 0.3)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  };

  const services = [
    {
      name: "Buy Youtube Likes",
      link: "/2342/buy-youtube-video-likes",
      icon: <Heart />,
    },
    {
      name: "Buy Youtube Views",
      link: "/5648/buy-youtube-views",
      icon: <Eye />,
    },
    {
      name: "Buy Youtube Comments",
      link: "/5649/buy-youtube-comments",
      icon: <MessageCircle />,
    },
    {
      name: "Buy Youtube Subscribers",
      link: "/376/buy-youtube-subscribers",
      icon: <User />,
    },
  ];

  return (
    <section className="container mx-auto px-4 pb-12 lg:pb-20">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Content Side */}
        <motion.div
          className="order-2 lg:order-1 flex flex-col"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="bg-green-500/10 text-green-600 font-medium px-4 py-2 rounded-full w-fit mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Trusted by 10,000+ YouTubers
          </motion.div>

          <motion.h2
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
            variants={fadeIn}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Buy Real <br />
            <motion.span
              className="text-green-500 inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              YouTube Views
            </motion.span>{" "}
            Instantly!
          </motion.h2>

          <motion.p
            className="text-muted-foreground text-lg mb-8 max-w-xl"
            variants={fadeIn}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Boost Your YouTube Channel with Real, High-Quality Views! Stand out
            in a crowded space, increase visibility, and grow your audience
            organically.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3"
            variants={staggerButtons}
            initial="hidden"
            animate="visible"
          >
            {services.map((service, index) => (
              <motion.button
                key={index}
                className="flex cursor-pointer items-center gap-2 rounded-full py-3 px-5 bg-green-500 text-white font-medium shadow-lg hover:shadow-green-500/50 transition-all"
                variants={buttonVariant}
                whileHover="hover"
                onClick={() => navigate(service.link)}
              >
                <span className="text-sm">{service.icon}</span>
                <span>{service.name}</span>
              </motion.button>
            ))}
          </motion.div>
          <RecentVisitors />
        </motion.div>

        {/* Image Side */}
        <motion.div
          className="order-1 lg:order-2 sm:flex hidden justify-center lg:justify-end"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="relative"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2,
              ease: "easeInOut",
            }}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-xl"></div>
            <img
              src="/assets/images/hero/main.png"
              alt="Buy Real Youtube Views Instantly!"
              width={550}
              height={550}
              className="relative z-10 drop-shadow-2xl"
            />

            {/* Floating elements animation */}
            <motion.div
              className="absolute top-10 sm:-right-6 right-0 bg-white p-3 rounded-xl shadow-lg z-20"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 overflow-hidden rounded-full flex items-center justify-center text-white text-xs">
                  <img
                    src={`/assets/images/users/user1.jpg`}
                    height={32}
                    width={32}
                    alt="user"
                  />
                </div>
                <div className="text-xs font-medium">+1500 views</div>
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-10 -left-6 bg-white p-3 rounded-xl shadow-lg z-20"
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 overflow-hidden rounded-full flex items-center justify-center text-white text-xs">
                  <img
                    src={`/assets/images/users/user3.jpg`}
                    height={32}
                    width={32}
                    alt="user"
                  />
                </div>
                <div className="text-xs font-medium">+248 subscribers</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HomeHeroSection;
