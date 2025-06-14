
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
  const { config } = useStore();

  useEffect(() => {
    if (!config) return;

    // Update title
    const finalTitle = title || config.meta_titulo_principal;
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
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
    updateMetaTag('description', description || config.meta_descripcion_principal);
    updateMetaTag('keywords', keywords || config.meta_keywords || '');
    updateMetaTag('author', config.nombre_tienda);

    // Open Graph tags
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', description || config.meta_descripcion_principal, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:image', ogImage || config.seo_configuracion?.og_image || '', true);
    updateMetaTag('og:url', canonical || window.location.href, true);
    updateMetaTag('og:site_name', config.nombre_tienda, true);

    // Twitter Card tags
    updateMetaTag('twitter:card', config.seo_configuracion?.twitter_card || 'summary_large_image');
    updateMetaTag('twitter:site', config.seo_configuracion?.twitter_site || '');
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', description || config.meta_descripcion_principal);
    updateMetaTag('twitter:image', ogImage || config.seo_configuracion?.og_image || '');

    // Robots meta
    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical || window.location.href;

    // Schema.org Organization markup
    const schemaScript = document.querySelector('#schema-org');
    if (schemaScript) {
      schemaScript.remove();
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": config.nombre_tienda,
      "url": window.location.origin,
      "logo": config.logo_url,
      "description": config.meta_descripcion_principal,
      "telephone": config.telefono_contacto_visible,
      "email": config.email_contacto_principal,
      "address": config.direccion_fisica_opcional,
      "sameAs": [
        config.links_redes_sociales?.instagram,
        config.links_redes_sociales?.facebook,
        config.links_redes_sociales?.tiktok
      ].filter(Boolean)
    };

    const newSchemaScript = document.createElement('script');
    newSchemaScript.id = 'schema-org';
    newSchemaScript.type = 'application/ld+json';
    newSchemaScript.textContent = JSON.stringify(schema);
    document.head.appendChild(newSchemaScript);

  }, [config, title, description, keywords, ogImage, canonical, noIndex]);

  return null;
};

export default SEOHead;
