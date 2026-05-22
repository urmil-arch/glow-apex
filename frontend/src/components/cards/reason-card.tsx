// components/reason-card.tsx
import React from "react";

interface ReasonCardProps {
  title: string;
  image: string;
  desc: string;
}

export const ReasonCard = ({ title, image, desc }: ReasonCardProps) => {
  return (
    <div className="bg-[#0eca6d] p-10 rounded-3xl lg:w-72 w-full h-72 flex items-center justify-center flex-col">
      <img src={image} alt={title} width={144} height={144} />
      <h3 className="text-2xl font-bold mt-4 text-center">{title}</h3>
      <p className="text-center text-background mt-1">{desc}</p>
    </div>
  );
};
