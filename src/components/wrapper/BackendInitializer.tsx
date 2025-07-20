// DashboardInitializer.tsx
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth";
import { useInvoiceStore } from "../../store/invoice";
import toast from "react-hot-toast";

const BackendInitializer = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const { getGoogleTokens, fetchProfile } = useAuthStore.getState();
  const { initializeService, fetchProducts, fetchAllSettings } =
    useInvoiceStore();

  useEffect(() => {
    const initData = async () => {
      try {
        const tokens = await getGoogleTokens();

        if (!tokens || !tokens.access_token) {
          const google_tokens = await fetchProfile();
          if (!google_tokens) {
            setShowGoogleAuth(true);
            return;
          }
        }
        await initializeService();
        await fetchProducts();
        await fetchAllSettings();
      } catch (error: any) {
        console.error("Error initializing dashboard:", error);

        if (error.message?.includes("Google account")) {
          setShowGoogleAuth(true);
        } else {
          toast.error("Some features may not work properly.");
        }
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (showGoogleAuth) return <div>Please connect your Google Account</div>;

  return <>{children}</>;
};

export default BackendInitializer;
