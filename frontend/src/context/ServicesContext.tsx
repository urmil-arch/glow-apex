import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import axios from "axios";
import { AdminService } from "@/types";
import { API_ENDPOINTS } from "@/config";

interface ServicesContextType {
  services: AdminService[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchServices() {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<AdminService[]>(API_ENDPOINTS.PUBLIC_SERVICES);
      setServices(response.data);
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
