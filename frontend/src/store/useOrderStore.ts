import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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

export interface ServiceOrderData {
  serviceId: string
  serviceName: string
  description: string
  rate: number
  min: number
  max: number
}

export interface CategoryOrderData {
  categoryName: string
  quantity: number
}

interface OrderStore {
  orderData: OrderData[] | null
  selectedPackage: SelectedPackageData | null
  serviceOrder: ServiceOrderData | null
  categoryOrder: CategoryOrderData | null
  setOrderData: (data: OrderData[]) => void
  setSelectedPackage: (pkg: SelectedPackageData) => void
  clearSelectedPackage: () => void
  clearOrder: () => void
  setServiceOrder: (data: ServiceOrderData) => void
  clearServiceOrder: () => void
  setCategoryOrder: (data: CategoryOrderData) => void
  clearCategoryOrder: () => void
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orderData: null,
      selectedPackage: null,
      serviceOrder: null,
      categoryOrder: null,
      setOrderData: (data) => set({ orderData: data }),
      setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
      clearSelectedPackage: () => set({ selectedPackage: null }),
      clearOrder: () => set({ orderData: null, selectedPackage: null }),
      setServiceOrder: (data) => set({ serviceOrder: data }),
      clearServiceOrder: () => set({ serviceOrder: null }),
      setCategoryOrder: (data) => set({ categoryOrder: data }),
      clearCategoryOrder: () => set({ categoryOrder: null }),
    }),
    {
      name: 'order-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        serviceOrder: state.serviceOrder,
        categoryOrder: state.categoryOrder,
      }),
    }
  )
)
