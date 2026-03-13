import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Stage, PresentationControls } from '@react-three/drei';
import { ArrowLeft, Plus, Minus, ShoppingCart, Box, Image as ImageIcon, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../utils/cart';
import { supabase } from '../utils/supabase';
import type { Product } from '../types';

// Placeholder 3D Chair Component
// Placeholder 3D Chair Component
function ChairPlaceholder({ materialColor, legFinish }: { materialColor: string, legFinish: string }) {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.2, 0.2, 1.2]} />
        <meshStandardMaterial color={materialColor} roughness={0.7} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1.1, -0.5]} castShadow>
        <boxGeometry args={[1.2, 1.0, 0.2]} />
        <meshStandardMaterial color={materialColor} roughness={0.7} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.5, 0.25, -0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.03, 0.5]} />
        <meshStandardMaterial color={legFinish} roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0.5, 0.25, -0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.03, 0.5]} />
        <meshStandardMaterial color={legFinish} roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[-0.5, 0.25, 0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.03, 0.5]} />
        <meshStandardMaterial color={legFinish} roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0.5, 0.25, 0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.03, 0.5]} />
        <meshStandardMaterial color={legFinish} roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Accordion({ title, content }: { title: string, content: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-stone py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none group"
      >
        <span className="font-serif text-lg text-charcoal group-hover:text-sage-dark transition-colors">{title}</span>
        {isOpen ? <Minus size={20} className="text-stone-dark" /> : <Plus size={20} className="text-stone-dark" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-charcoal/80 text-sm leading-relaxed text-balance">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [materialColor, setMaterialColor] = useState('#8DA399');
  const [legFinish, setLegFinish] = useState('#1A1A1A');
  const { addItem } = useCart();
  
  const [dbProduct, setDbProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
        if (!id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
            if (error) {
                throw error;
            }
            setDbProduct(data as Product);
        } catch (error: unknown) {
            console.error('Error fetching product:', error);
            setDbProduct(null); // Ensure product is null on error
        } finally {
            setLoading(false);
        }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Navbar />
        <p className="text-charcoal/50 uppercase tracking-widest text-sm">Loading Product...</p>
        <Footer />
      </div>
    );
  }

  if (!dbProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 flex-col gap-6">
        <Navbar />
        <h2 className="text-3xl font-serif text-charcoal">Product Not Found</h2>
        <Link to="/" className="text-sm underline text-charcoal/70 hover:text-charcoal">Return to Homepage</Link>
        <Footer />
      </div>
    );
  }

  // Map DB variables to standard frontend variables
  const product = {
    id: dbProduct.id,
    name: dbProduct.name,
    priceValue: dbProduct.price,
    priceString: `$${dbProduct.price.toLocaleString()}`,
    category: dbProduct.category,
    description: dbProduct.description || "A beautifully crafted piece for modern living spaces.",
    images: [dbProduct.image_url || 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80'],
    details: {
        dimensions: 'W 82cm x D 76cm x H 78cm (Standard size)',
        materials: 'Premium materials sourced sustainably.',
        care: 'Professional dry cleaning recommended. Vacuum regularly with a soft brush attachment.',
    }
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      priceValue: product.priceValue,
      priceString: product.priceString,
      imageUrl: product.images[0],
      quantity: quantity
    });

    setAddedAnimation(true);
    setTimeout(() => {
        setAddedAnimation(false);
        setQuantity(1);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar />
      
      <main className="flex-grow w-full bg-warm-white">
        {/* Back Navigation */}
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to store
          </Link>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-10 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            
            {/* Left Column: Media Gallery */}
            <div className="relative flex flex-col gap-4">
              {/* Media Container */}
              <div ref={(el) => { if(el) el.style.height = '600px' }} className="relative w-full rounded-sm overflow-hidden bg-stone-light/30">
                
                {viewMode === '2d' ? (
                  <motion.img
                    key={`img-${activeImage}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    src={product.images[activeImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                  >
                    <Canvas shadows camera={{ position: [0, 2, 4], fov: 45 }}>
                      <color attach="background" args={['#F5F3EE']} />
                      <PresentationControls 
                        speed={1.5}
                        global
                        zoom={0.7}
                        polar={[-0.1, Math.PI / 4]}
                      >
                        <Stage environment="city" intensity={0.5}>
                          <ChairPlaceholder materialColor={materialColor} legFinish={legFinish} />
                        </Stage>
                      </PresentationControls>
                    </Canvas>
                  </motion.div>
                )}

                {/* View Toggle Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-stone-light">
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${viewMode === '2d' ? 'bg-charcoal text-white' : 'text-charcoal hover:bg-stone-light/50'}`}
                    aria-label="2D View"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${viewMode === '3d' ? 'bg-charcoal text-white' : 'text-charcoal hover:bg-stone-light/50'}`}
                    aria-label="3D View"
                  >
                    <Box size={18} />
                  </button>
                </div>
              </div>

              {/* 2D Image Thumbnails */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                        setViewMode('2d');
                        setActiveImage(idx);
                    }}
                    className={`relative w-24 h-24 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-all ${viewMode === '2d' && activeImage === idx ? 'border-sage' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Product Details */}
            <div className="flex flex-col pt-4 lg:sticky lg:top-32">
              <p className="text-[12px] tracking-[0.2em] uppercase text-stone-dark mb-3">
                {product.category}
              </p>
              <h1 className="font-serif text-4xl lg:text-5xl text-charcoal mb-4">
                {product.name}
              </h1>
              <p className="text-2xl text-charcoal/90 mb-8 font-light">
                {product.priceString}
              </p>

              <div className="prose prose-stone text-charcoal/80 text-balance mb-8">
                <p>{product.description}</p>
              </div>

              {/* Material Customisation */}
              <div className="mb-8">
                <p className="text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-bold mb-4">Material Colour</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {['#8DA399', '#D4CDC4', '#1A1A1A', '#8B7355', '#BC8F8F'].map(color => (
                    <button
                      key={color}
                      onClick={() => setMaterialColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${materialColor === color ? 'border-charcoal scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 bg-stone-light/20 p-3 rounded-xl border border-stone-light/40">
                  <input 
                    type="color" 
                    value={materialColor}
                    onChange={(e) => setMaterialColor(e.target.value)}
                    className="w-8 h-8 rounded-full border-2 border-white cursor-pointer overflow-hidden p-0"
                  />
                  <span className="text-xs text-charcoal/60 font-medium uppercase tracking-widest">Custom Finish</span>
                </div>
              </div>

              {/* Leg Finish Customisation */}
              <div className="mb-10">
                <p className="text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-bold mb-4">Leg Finish</p>
                <div className="flex gap-4">
                  {[
                    { name: 'Charcoal', color: '#1A1A1A' },
                    { name: 'Oak', color: '#DEB887' },
                    { name: 'Walnut', color: '#5D4037' },
                    { name: 'Silver', color: '#C0C0C0' }
                  ].map(finish => (
                    <button
                      key={finish.name}
                      onClick={() => setLegFinish(finish.color)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className={`w-12 h-12 rounded-xl border-2 transition-all ${legFinish === finish.color ? 'border-charcoal scale-105 shadow-md' : 'border-stone-light/40 opacity-60'}`}
                           style={{ backgroundColor: finish.color }} />
                      <span className={`text-[9px] uppercase tracking-widest font-bold transition-colors ${legFinish === finish.color ? 'text-charcoal' : 'text-charcoal/30'}`}>
                        {finish.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <div className="flex items-center justify-between border border-stone-dark rounded-none w-full sm:w-32 h-14 px-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-charcoal/60 hover:text-charcoal transition-colors p-2"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-lg text-charcoal">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-charcoal/60 hover:text-charcoal transition-colors p-2"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={addedAnimation}
                  className={`flex-1 h-14 flex items-center justify-center gap-3 tracking-[0.1em] uppercase text-[13px] transition-colors ${addedAnimation ? 'bg-sage text-white' : 'bg-charcoal hover:bg-charcoal-light text-white'}`}
                >
                  {addedAnimation ? (
                    <>
                      <Check size={18} />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>

              {/* Accordions */}
              <div className="border-t border-stone">
                <Accordion title="Dimensions" content={product.details.dimensions} />
                <Accordion title="Materials" content={product.details.materials} />
                <Accordion title="Care Instructions" content={product.details.care} />
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
