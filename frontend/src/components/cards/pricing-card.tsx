"use client"
import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { PricingCardProps } from "@/types/pricing";

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  options,
  onSelectOption,
  onBuyNow,
  selectedOption = options[0]?.value,
  accentColor = "#0eca6d",
}) => {
  const [selected, setSelected] = useState(selectedOption);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelected(newValue);
    if (onSelectOption) {
      onSelectOption(plan.id, newValue);
    }
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(plan.id, selected, plan.price[selected] || 0);
    }
  };

  const cardStyle = plan.gradient
    ? {
        background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
        outline: `2px solid ${accentColor}`,
      }
    : {
        outline: `2px solid ${accentColor}`,
      };

  const titleColor = plan.gradient ? "text-white" : `text-[${accentColor}]`;

  return (
    <div className="p-7 rounded-3xl" style={cardStyle}>
      <h3
        className={`text-4xl font-bold ${titleColor}`}
        style={{ color: plan.gradient ? "white" : accentColor }}
      >
        {plan.title}
      </h3>

      <ul className="mt-4 space-y-2 text-foreground">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center justify-start gap-2">
            {feature.included ? (
              <Check size={18} />
            ) : (
              <X color="red" size={18} />
            )}
            {feature.text}
          </li>
        ))}
      </ul>

      <div className="my-3 flex items-center justify-between">
        <p className="text-lg font-medium">Like count : </p>
        <select
          className={`shadow-sm border ${
            plan.gradient ? "border-white" : ""
          } rounded px-4`}
          value={selected}
          onChange={handleChange}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        className="w-full px-4 py-3 rounded-lg text-xl flex items-center justify-between bg-black text-background"
        onClick={handleBuyNow}
      >
        <p className="flex flex-col items-start justify-center">
          <span className="text-sm font-normal text-primary-foreground">
            Total
          </span>
          <span className="leading-5 font-semibold">
            ${plan.price[selected] || 0}
          </span>
        </p>
        <p className="font-bold">Buy Now</p>
      </button>
    </div>
  );
};

export default PricingCard;
