/**
 * src/hooks/useWhiteLabel.tsx
 * Phase 8 - White-Label Provider
 *
 * Dynamically applies branding colors, logos, and custom domain configurations
 * fetched directly from the organizations table.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface WhiteLabelConfig {
  logoUrl: string | null;
  primaryColor: string | null;
  customDomain: string | null;
}

interface WhiteLabelContextProps {
  config: WhiteLabelConfig;
  isLoading: boolean;
  updateBranding: (updates: Partial<WhiteLabelConfig>) => Promise<boolean>;
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  logoUrl: null,
  primaryColor: null,
  customDomain: null,
};

const WhiteLabelContext = createContext<WhiteLabelContextProps>({
  config: DEFAULT_CONFIG,
  isLoading: true,
  updateBranding: async () => false,
});

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove #
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useAuth();
  const [config, setConfig] = useState<WhiteLabelConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Apply CSS Variables globally when config changes
  useEffect(() => {
    if (config.primaryColor) {
      const hsl = hexToHsl(config.primaryColor);
      document.documentElement.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    } else {
      // Revert to lovables default primary 
      document.documentElement.style.removeProperty("--primary");
    }

    if (config.logoUrl) {
      const icon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (icon) icon.href = config.logoUrl;
    }
  }, [config]);

  // Fetch config from organization table whenever it changes
  useEffect(() => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("logo_url, primary_color, custom_domain")
          .eq("id", organization.id)
          .single();

        if (!error && data) {
          setConfig({
            logoUrl: data.logo_url,
            primaryColor: data.primary_color,
            customDomain: data.custom_domain,
          });
        }
      } catch (err) {
        console.error("[WhiteLabel] Failed to load branding:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [organization]);

  const updateBranding = async (updates: Partial<WhiteLabelConfig>) => {
    if (!organization?.id) return false;
    try {
      const dbUpdates: any = {};
      if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
      if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor;
      if (updates.customDomain !== undefined) dbUpdates.custom_domain = updates.customDomain;

      const { error } = await supabase
        .from("organizations")
        .update(dbUpdates)
        .eq("id", organization.id);

      if (error) throw error;

      setConfig(prev => ({ ...prev, ...updates }));
      return true;
    } catch (err) {
      console.error("[WhiteLabel] Update failed:", err);
      return false;
    }
  };

  return (
    <WhiteLabelContext.Provider value={{ config, isLoading, updateBranding }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export const useWhiteLabel = () => useContext(WhiteLabelContext);
