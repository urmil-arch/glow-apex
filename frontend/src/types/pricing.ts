export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingOption {
  value: string;
  label: string;
}

export interface PricingPlan {
  id: string;
  title: string;
  features: PricingFeature[];
  price: {
    [key: string]: number;
  };
  isPopular?: boolean;
  gradient?: boolean;
}

export interface PricingCardProps {
  plan: PricingPlan;
  options: PricingOption[];
  onSelectOption?: (planId: string, option: string) => void;
  onBuyNow?: (planId: string, selectedOption: string, price: number) => void;
  selectedOption?: string;
  accentColor?: string;
}

export interface PricingSectionProps {
  plans: PricingPlan[];
  options: PricingOption[];
  title?: string;
  subtitle?: string;
  accentColor?: string;
}
