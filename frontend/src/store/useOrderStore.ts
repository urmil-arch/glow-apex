import { create } from 'zustand'

export interface OrderData {
  service_id: string
  product_id: string
  user_email: string
  user_link: string
  purchase_type: string
  product_price: string
}

export interface SelectedPackageData {
  serviceType: string
  serviceId: string
  packageType: string
  quantity: number
  price: string
  discount: number
}

interface OrderStore {
  orderData: OrderData[] | null
  selectedPackage: SelectedPackageData | null
  setOrderData: (data: OrderData[]) => void
  setSelectedPackage: (pkg: SelectedPackageData) => void
  clearSelectedPackage: () => void
  clearOrder: () => void
}

export const useOrderStore = create<OrderStore>((set) => ({
  orderData: null,
  selectedPackage: null,
  setOrderData: (data) => set({ orderData: data }),
  setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
  clearSelectedPackage: () => set({ selectedPackage: null }),
  clearOrder: () => set({ orderData: null, selectedPackage: null }),
}))
