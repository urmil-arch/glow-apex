import React from "react";
import { CardData, SectionData } from "@/types";

interface FeatureSectionProps {
  data: SectionData;
}

interface FeatureCardProps {
  data: CardData;
  className?: string;
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({ data }) => {
  return (
    <section className="container pb-32 relative">
      <div className="flex flex-col items-center justify-center gap-2">
        {/* <div className="py-2 px-3 rounded-full bg-foreground text-background text-xs font-medium uppercase mt-4">
          {data.badge}
        </div> */}
        <h2 className="sm:text-6xl text-4xl mt-3 font-semibold text-black relative text-center">
          {data.decorations?.leftSpark && (
            <img
              className="absolute -left-16 -top-10 sm:block hidden"
              src={data.decorations.leftSpark}
              alt="spark1"
              width={28}
              height={28}
            />
          )}
          {data.decorations?.rightSpark && (
            <img
              className="absolute -right-20 xl:block hidden"
              src={data.decorations.rightSpark}
              alt="spark2"
              width={22}
              height={22}
            />
          )}
          {data.decorations?.dot && (
            <img
              className="absolute -left-12 sm:block hidden top-5"
              src={data.decorations.dot}
              alt="dot"
              width={10}
              height={10}
            />
          )}
          {data.title}
        </h2>
      </div>
      <div className="mt-16 grid lg:grid-cols-4 sm:grid-cols-2 items-center justify-center justify-items-center gap-2">
        {data.cards.map((card, index) => (
          <FeatureCard key={index} data={card} />
        ))}
      </div>
    </section>
  );
};


export const FeatureCard: React.FC<FeatureCardProps> = ({
  data,
  className = "",
}) => {
  return (
    <div
      className={`bg-[#0eca6d] p-10 rounded-3xl lg:w-72 w-full h-80 flex items-center justify-center flex-col ${className}`}
    >
      <img src={data.image} alt={data.title} width={144} height={144} />
      <h3 className="text-2xl font-bold mt-4 text-center">{data.title}</h3>
      <p className="text-center text-background mt-1">{data.description}</p>
    </div>
  );
};