
import { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  ogImage,
  canonical,
  noIndex = false
}) => {
  const { config, isLoading } = useStore();

  useEffect(() => {
    // Only proceed if we have config and it's not loading
    if (isLoading || !config) {
      return;
    }

    try {
      // Update title
      const finalTitle = title || config.meta_titulo_principal || 'LUXE Fashion';
      document.title = finalTitle;

      // Helper function to safely update meta tags
      const updateMetaTag = (name: string, content: string, property?: boolean) => {
        if (!content) return;
        
        const attributeName = property ? 'property' : 'name';
        let meta = document.querySelector(`meta[${attributeName}="${name}"]`) as HTMLMetaElement;
        
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attributeName, name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      // Basic SEO meta tags
      updateMetaTag('description', description || config.meta_descripcion_principal || '');
      updateMetaTag('keywords', keywords || config.meta_keywords || '');
      
      // Open Graph tags
      updateMetaTag('og:title', finalTitle, true);
      updateMetaTag('og:description', description || config.meta_descripcion_principal || '', true);
      updateMetaTag('og:type', 'website', true);
      
      // Only set og:image if we have a valid URL
      if (ogImage || (config.seo_configuracion && config.seo_configuracion.og_image)) {
        updateMetaTag('og:image', ogImage || config.seo_configuracion.og_image, true);
      }
      
      updateMetaTag('og:url', canonical || window.location.href, true);
      
      if (config.nombre_tienda) {
        updateMetaTag('og:site_name', config.nombre_tienda, true);
      }

      // Robots meta
      updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

      // Canonical URL
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical || window.location.href;

    } catch (error) {
      console.error('SEO setup error:', error);
    }
  }, [config, isLoading, title, description, keywords, ogImage, canonical, noIndex]);

  return null;
};

export default SEOHead;
