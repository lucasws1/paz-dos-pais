import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
  const { user } = useAuth();
  const [activePatient, setActivePatient] = useState(null);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
    enabled: !!user,
  });

  // Seleciona o primeiro paciente automaticamente
  useEffect(() => {
    if (patients.length > 0 && !activePatient) {
      setActivePatient(patients[0]);
    }
  }, [patients, activePatient]);

  return (
    <PatientContext.Provider value={{ patients, activePatient, setActivePatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient deve ser usado dentro de PatientProvider");
  return ctx;
}
