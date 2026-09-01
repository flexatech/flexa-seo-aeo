import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { AppProviders } from "./app/providers";
import { CommandPalette } from "./components/CommandPalette";
import { Toaster } from "./components/Toaster";
import "./styles/index.css";

const root = document.getElementById("flexa-seo-aeo-admin-root");
if (root) {
    createRoot(root).render(
        <StrictMode>
            <AppProviders>
                <App />
                <CommandPalette />
                <Toaster />
            </AppProviders>
        </StrictMode>,
    );
}
