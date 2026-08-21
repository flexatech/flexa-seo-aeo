import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./app/providers";
import { CommandPalette } from "./components/CommandPalette";
import { Toaster } from "./components/Toaster";
import { SettingsPage } from "./features/settings/SettingsPage";
import "./styles/index.css";

const root = document.getElementById("flexa-seo-aeo-admin-root");
if (root) {
    createRoot(root).render(
        <StrictMode>
            <AppProviders>
                <SettingsPage />
                <CommandPalette />
                <Toaster />
            </AppProviders>
        </StrictMode>,
    );
}
