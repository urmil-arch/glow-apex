export interface CardData {
  image: string;
  title: string;
  description: string;
}

export interface SectionData {
  badge: string;
  title: string;
  cards: CardData[];
  decorations?: {
    leftSpark?: string;
    rightSpark?: string;
    dot?: string;
  };
}

export interface Service {
  cancel: boolean;
  category: string;
  dripfeed: boolean;
  max: string;
  min: string;
  name: string;
  rate: string;
  refill: boolean;
  service: string;
  type: string;
} 