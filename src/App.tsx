import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { LandingPage } from "./components/landing-page";
import { NotesApp } from "./components/notes-app";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentAccount = useCurrentAccount();
  
  if (!currentAccount) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <NotesApp />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
