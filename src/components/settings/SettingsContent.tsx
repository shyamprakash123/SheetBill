// src/components/settings/SettingsContent.tsx
import { Navigate, useSearchParams } from "react-router-dom";
import UserProfileSection from "./sections/UserProfileSection";
import CompanyDetailsSection from "./sections/CompanyDetailsSection";
import ThermalPrintSettingsSection from "./sections/ThermalPrintSection";
import SignaturesSection from "./sections/SignaturesSection";
import NotesAndTermsSection from "./sections/NotesTermsSection";
import BanksSection from "./sections/BanksSection";
import PreferencesSection from "./sections/PreferencesSection";

export default function SettingsContent() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  switch (tab) {
    case "user-profile":
      return <UserProfileSection />;
    case "company-details":
      return <CompanyDetailsSection />;
    case "preferences":
      return <PreferencesSection />;
    case "thermal-print":
      return <ThermalPrintSettingsSection />;
    case "signatures":
      return <SignaturesSection />;
    case "notes-terms":
      return <NotesAndTermsSection />;
    case "banks":
      return <BanksSection />;
    default:
      return (
        <Navigate
          to="/app/settings?subtab=profile&tab=company-details"
          replace
        />
      );
  }
}
