import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { LandingPage } from "./components/landing-page";
import { NotesApp } from "./components/notes-app";

export function App() {
  const [currentView, setCurrentView] = useState<"landing" | "dashboard">(
    "landing"
  );
  const currentAccount = useCurrentAccount();

  const navigateToDashboard = () => {
    // Only allow navigation to dashboard if wallet is connected
    if (currentAccount) {
      setCurrentView("dashboard");
    }
  };

  const navigateToLanding = () => {
    setCurrentView("landing");
  };

  if (currentView === "landing") {
    return <LandingPage onNavigateToDashboard={navigateToDashboard} />;
  }

  // If user tries to access dashboard without wallet, redirect to landing
  if (!currentAccount) {
    return <LandingPage onNavigateToDashboard={navigateToDashboard} />;
  }

  return <NotesApp onNavigateToLanding={navigateToLanding} />;
}
