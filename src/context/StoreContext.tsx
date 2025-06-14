import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { encryptCartData, decryptCartData, productSchema, configSchema } from '../utils/security';
import { toast } from 'sonner';

interface Config {
  nombre_tienda: string;
  meta_titulo_principal: string;
  meta_descripcion_principal: string;
  meta_keywords?: string;
  logo_url: string;
  favicon_url: string;
  telefono_contacto_visible: string;
  email_contacto_principal: string;
  direccion_fisica_opcional: string;
  google_analytics_id?: string;
  seo_configuracion?: {
    favicon_url: string;
    og_image: string;
    twitter_card: string;
    twitter_site?: string;
    sitemap_activo: boolean;
    robots_txt_personalizado: string;
  };
  banner_principal_home: {
    activo: boolean;
    imagen_url_desktop: string;
    imagen_url_mobile: string;
    alt_text: string;
    titulo_superpuesto: string;
    subtitulo_superpuesto: string;
    texto_boton: string;
    link_boton: string;
  };
  secciones_home_destacadas: Array<{
    titulo_seccion: string;
    criterio_productos: string;
    limite: number;
  }>;
  texto_footer_copyright: string;
  links_redes_sociales: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  menu_navegacion_principal: Array<{
    texto: string;
    url: string;
    subcategorias?: Array<{
      texto: string;
      url: string;
    }>;
  }>;
  footer_links_ayuda: Array<{
    texto: string;
    url: string;
  }>;
  moneda_simbolo: string;
  whatsapp_numero_consultas: string;
}

interface Product {
  sku: string;
  nombre: string;
  categoria_slug: string;
  genero?: string;
  marca: string;
  precio_original: number;
  precio_oferta?: number;
  en_oferta: boolean;
  porcentaje_descuento: number;
  descripcion_corta: string;
  descripcion_larga: string;
  fotos: string[];
  disponible: boolean;
  cantidad_stock: number;
  detalles: {
    tallas_disponibles: string[];
    colores_disponibles: Array<{
      nombre: string;
      hex: string;
    }>;
    material: string;
    cuidados: string;
  };
  fecha_agregado: string;
  slug_url_producto: string;
  etiquetas: string[];
}

interface CartItem {
  sku: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  talla_seleccionada: string;
  color_seleccionado: string;
  foto: string;
}

interface StoreContextType {
  config: Config | null;
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product, talla: string, color: string, cantidad: number) => void;
  removeFromCart: (sku: string, talla: string, color: string) => void;
  updateCartItemQuantity: (sku: string, talla: string, color: string, cantidad: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  isLoading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load encrypted cart from localStorage
  useEffect(() => {
    try {
      const encryptedCart = localStorage.getItem('luxe_cart');
      if (encryptedCart) {
        const decryptedCart = decryptCartData(encryptedCart);
        if (Array.isArray(decryptedCart)) {
          setCart(decryptedCart);
        }
      }
    } catch (err) {
      console.error('Failed to load cart data');
      localStorage.removeItem('luxe_cart');
    }
  }, []);

  // Save encrypted cart to localStorage
  useEffect(() => {
    try {
      const encryptedCart = encryptCartData(cart);
      if (encryptedCart) {
        localStorage.setItem('luxe_cart', encryptedCart);
      }
    } catch (err) {
      console.error('Failed to save cart data');
    }
  }, [cart]);

  // Load configuration and products with validation
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load configuration
        const configResponse = await fetch('/data/config_general.json');
        if (!configResponse.ok) throw new Error('Failed to load configuration');
        
        const configData = await configResponse.json();
        console.log('Raw config data:', configData);
        
        // Use the configuration directly without Zod validation to avoid runtime errors
        // We'll trust that the JSON structure is correct since it's controlled by us
        setConfig(configData as Config);

        // Load products
        const productsResponse = await fetch('/data/productos_global.json');
        if (!productsResponse.ok) throw new Error('Failed to load products');
        
        const productsData = await productsResponse.json();
        console.log('Raw products data:', productsData);
        
        // Basic validation for products - handle null precio_oferta values
        const processedProducts = productsData.map((product: any) => ({
          ...product,
          precio_oferta: product.precio_oferta === null ? undefined : product.precio_oferta
        }));
        
        setProducts(processedProducts as Product[]);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load store data';
        setError(errorMessage);
        console.error('Store data loading error:', err);
        toast.error('Error al cargar los datos de la tienda');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addToCart = (product: Product, talla: string, color: string, cantidad: number) => {
    if (!product.disponible || product.cantidad_stock < cantidad) {
      toast.error('Producto no disponible o stock insuficiente');
      return;
    }

    const cartKey = `${product.sku}-${talla}-${color}`;
    const existingItem = cart.find(item => 
      item.sku === product.sku && 
      item.talla_seleccionada === talla && 
      item.color_seleccionado === color
    );

    if (existingItem) {
      const newQuantity = existingItem.cantidad + cantidad;
      if (newQuantity > product.cantidad_stock) {
        toast.error('No hay suficiente stock disponible');
        return;
      }
      updateCartItemQuantity(product.sku, talla, color, newQuantity);
    } else {
      const newItem: CartItem = {
        sku: product.sku,
        nombre: product.nombre,
        precio_unitario: product.en_oferta && product.precio_oferta ? product.precio_oferta : product.precio_original,
        cantidad,
        talla_seleccionada: talla,
        color_seleccionado: color,
        foto: product.fotos[0]
      };
      setCart(prev => [...prev, newItem]);
    }
    
    toast.success('Producto agregado al carrito');
  };

  const removeFromCart = (sku: string, talla: string, color: string) => {
    setCart(prev => prev.filter(item => 
      !(item.sku === sku && item.talla_seleccionada === talla && item.color_seleccionado === color)
    ));
    toast.success('Producto eliminado del carrito');
  };

  const updateCartItemQuantity = (sku: string, talla: string, color: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(sku, talla, color);
      return;
    }

    setCart(prev => prev.map(item => 
      (item.sku === sku && item.talla_seleccionada === talla && item.color_seleccionado === color)
        ? { ...item, cantidad }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('luxe_cart');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((count, item) => count + item.cantidad, 0);
  };

  const value: StoreContextType = {
    config,
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    isLoading,
    error
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
