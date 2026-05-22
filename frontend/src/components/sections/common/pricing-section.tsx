import React, { useState } from "react";
import PricingCard from "@/components/cards/pricing-card";
import { PricingSectionProps } from "@/types/pricing";
import SectionHeader from "../../common/section-header";

const PricingSection: React.FC<PricingSectionProps> = ({
  plans,
  options,
  title = "Choose Your Plan",
  subtitle = "PRICING",
  accentColor = "#0eca6d",
}) => {
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: string;
  }>({});

  const handleSelectOption = (planId: string, option: string) => {
    setSelectedOptions({
      ...selectedOptions,
      [planId]: option,
    });
  };

  const handleBuyNow = (
    planId: string,
    selectedOption: string,
    price: number
  ) => {
    // Implement your buy now logic here
    console.log(
      `Buy now clicked for plan ${planId} with option ${selectedOption} at price $${price}`
    );
    // You can add redirect to checkout or open modal here
  };

  return (
    <section className="pb-32 relative container">
      <SectionHeader
        tabHeading={subtitle}
        title={title}
      />
      <div className="relative grid grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto gap-4 mt-22">
        <img
          className="absolute -right-10 -top-10 sm:block hidden"
          src={"/assets/illustration/item.svg"}
          alt="spark1"
          width={58}
          height={58}
        />

        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            options={options}
            selectedOption={selectedOptions[plan.id] || options[0]?.value}
            onSelectOption={handleSelectOption}
            onBuyNow={handleBuyNow}
            accentColor={accentColor}
          />
        ))}
      </div>
    </section>
  );
};

export default PricingSection;
