"use client";
import useSticky from "@/hooks/use-sticky";
import { ArrowUp } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

const ScrollToTop = () => {
  const { sticky }: { sticky: boolean } = useSticky();

  const [showScroll, setShowScroll] = useState(false);

  const checkScrollTop = useCallback(() => {
    if (!showScroll && window.pageYOffset > 400) {
      setShowScroll(true);
    } else if (showScroll && window.pageYOffset <= 400) {
      setShowScroll(false);
    }
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [checkScrollTop]);

  return (
    <>
      <button
        onClick={scrollTop}
        className={` ${
          sticky
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible translate-y-5"
        } z-10 fixed bottom-8 right-8 w-14 h-14 rounded-full bg-white/90 hover:bg-[#0eca6d] backdrop-blur-xl transition-all ease-in-out duration-400 hover:text-white hover flex items-center justify-center text-black`}
      >
        <ArrowUp />
      </button>
    </>
  );
};

export default ScrollToTop;
