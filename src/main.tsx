import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import { TRPCProvider } from "@/providers/trpc";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(reg => {
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "activated") {
          window.location.reload();
        }
      });
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <TRPCProvider>
            <App />
            <Toaster position="top-center" richColors closeButton />
          </TRPCProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
