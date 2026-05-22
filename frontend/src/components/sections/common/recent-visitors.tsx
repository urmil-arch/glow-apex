import React from 'react'
import { motion } from "framer-motion";

const RecentVisitors = () => {
  return (
    <motion.div
      className="mt-8 flex items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <div className="flex -space-x-2">
        {[1, 2, 3, 4, 5].map((_, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden"
          >
            <img
              src={`/assets/images/users/user${i + 1}.jpg`}
              height={40}
              width={40}
              alt="user"
            />
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-black">500+</span> customers in the last
        24 hours
      </p>
    </motion.div>
  );
}

export default RecentVisitors