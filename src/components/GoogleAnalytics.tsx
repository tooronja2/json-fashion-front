
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
    dataLayer: any[];
  }
}

const GoogleAnalytics: React.FC = () => {
  const { config, isLoading } = useStore();
  const location = useLocation();

  useEffect(() => {
    // Only proceed if we have config and a valid GA ID
    if (isLoading || !config || !config.google_analytics_id || config.google_analytics_id === 'G-XXXXXXXXXX') {
      return;
    }

    try {
      // Check if already initialized
      if (window.gtag && window.dataLayer) {
        return;
      }

      // Initialize Google Analytics
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${config.google_analytics_id}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.google_analytics_id}');
      `;
      document.head.appendChild(script2);

      // Make gtag available globally
      window.gtag = function(command: string, targetId: string, config?: any) {
        if (window.dataLayer) {
          window.dataLayer.push(arguments);
        }
      };

    } catch (error) {
      console.error('Google Analytics initialization error:', error);
    }
  }, [config, isLoading]);

  // Track page views
  useEffect(() => {
    if (isLoading || !config || !config.google_analytics_id || config.google_analytics_id === 'G-XXXXXXXXXX') {
      return;
    }

    try {
      if (window.gtag) {
        window.gtag('config', config.google_analytics_id, {
          page_path: location.pathname + location.search
        });
      }
    } catch (error) {
      console.error('Google Analytics page tracking error:', error);
    }
  }, [location, config, isLoading]);

  return null;
};

// Utility functions for tracking events
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  try {
    if (window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  } catch (error) {
    console.error('Event tracking error:', error);
  }
};

export const trackPurchase = (transactionId: string, value: number, items: any[] = []) => {
  try {
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: 'USD',
        items: items
      });
    }
  } catch (error) {
    console.error('Purchase tracking error:', error);
  }
};

export const trackAddToCart = (itemId: string, itemName: string, value: number) => {
  try {
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: value,
        items: [{
          item_id: itemId,
          item_name: itemName,
          quantity: 1,
          price: value
        }]
      });
    }
  } catch (error) {
    console.error('Add to cart tracking error:', error);
  }
};

export default GoogleAnalytics;
