// BenefitsCard.jsx
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";


interface BenefitsCardProps {
  icon: React.ReactNode;
  title: string;
  benefits: string[];
}


export const BenefitsCard: React.FC<BenefitsCardProps> = ({
  icon,
  title,
  benefits,
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      whileHover={{
        y: -5,
        boxShadow: "0 25px 50px -12px rgba(14, 202, 109, 0.25)",
      }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 transition-all duration-300"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600"
      >
        <img src={icon as string} width={34} height={34} alt={title}  />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="font-semibold text-xl mb-4"
      >
        {title}
      </motion.h3>

      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: "60px" } : { width: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="h-1 bg-emerald-500 mb-5 rounded-full"
      ></motion.div>

      <ul className="space-y-3">
        {benefits.map((benefit, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            className="flex items-start gap-2 text-gray-700"
          >
            <svg
              className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>{benefit}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};
