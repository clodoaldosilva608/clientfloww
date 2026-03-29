/**
 * src/lib/tracking.ts
 * Phase 9 - Growth & Analytics Tracking
 *
 * Lightweight analytics module connecting custom events to Google Analytics
 * and tracking funnels.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type EventName = 'signup' | 'checkout' | 'conversion' | 'create_client' | 'create_campaign' | 'activate_automation' | 'add_payment_method';

export const trackEvent = (eventName: EventName, params?: Record<string, any>) => {
  // Console logging for verification in dev
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Tracking] Event: ${eventName}`, params || '');
  }

  // Google Analytics / Universal Tracking
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }

  // Could also add Facebook Pixel or Mixpanel here:
  // if (typeof window.fbq === 'function') window.fbq('track', eventName, params);
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Tracking] Identify User: ${userId}`, traits || '');
  }
  
  if (typeof window.gtag === 'function') {
    window.gtag('set', 'user_properties', traits);
    window.gtag('config', 'G-XXXXXXXXXX', {
      user_id: userId,
    });
  }
};
