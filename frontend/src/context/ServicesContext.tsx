import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Service } from "@/types";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

interface ServicesContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  fetchServices: (apiKey?: string | null) => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchServices(apiKey?: string | null) {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<Service[]>(API_ENDPOINTS.GET_SERVICES, { apiKey: apiKey ?? null });
      const data = response.data;
      const filteredServices = data.filter((service) =>
        ["5209", "2342", "5648", "376"].includes(service.service)
      );
      setServices(filteredServices);
    } catch (err) {
      setError("Failed to fetch services");
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <ServicesContext.Provider value={{ services, loading, error, fetchServices }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
}
