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

export interface AdminService {
  id: string;
  name: string;
  description: string;
  service_kind: string;
  category_id: string;
  category_name: string;
  type: string;
  rate: number;
  min: number;
  max: number;
  is_default?: boolean;
  default_for_category?: string | null;
}

export interface RoutingConfigServiceInfo {
  service_id: string;
  service_name: string;
  provider_id: string;
  provider_name: string;
  provider_service_id: string;
  rate: number;
  min: number;
  max: number;
}

export interface RoutingConfig {
  category_id: string;
  category_name: string;
  default: RoutingConfigServiceInfo | null;
  fallbacks: RoutingConfigServiceInfo[];
}

export interface UserOrder {
  id: string;
  service_id: string;
  service_name: string;
  provider_order_id: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  start_count: string;
  remains: string;
  currency: string;
  created_at: string;
}