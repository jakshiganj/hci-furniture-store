import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight, ShieldCheck, ArrowLeft, Plus, Minus, CreditCard, Check, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../utils/cart';
import { getUser } from '../utils/auth';
import { supabase } from '../utils/supabase';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, cartSubtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  // Form State
  const [shippingDetails, setShippingDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    zipCode: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingDetails({
      ...shippingDetails,
      [e.target.name]: e.target.value
    });
  };

  const shippingCost = items.length > 0 ? 150 : 0;
  const totalCost = cartSubtotal + shippingCost;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    
    try {
      // 1. Get logged in user (or allow guest checkout if you prefer)
      const user = getUser();
      
      // We'll proceed with user.id if logged in. 
      // In a real app allowing guests, we'd handle anonymous orders differently.
      if (!user?.id) {
        showToastMessage("Please log in to place an order.", 'error');
        setIsSubmitting(false);
        return;
      }

      // 2. Insert the Order Document
      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        total_amount: totalCost,
        contact_email: shippingDetails.email,
        shipping_address: {
            firstName: shippingDetails.firstName,
            lastName: shippingDetails.lastName,
            address: shippingDetails.address,
            city: shippingDetails.city,
            zipCode: shippingDetails.zipCode
        },
        status: 'pending'
      }).select().single();

      if (orderError) throw orderError;

      // 3. Insert the Order Items (associated with the newly created Order ID)
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.priceValue
      }));

      // In a real production DB, product_id requires a valid linked UUID.
      // Since our mock data uses a matched UUID, this insert will now succeed without FK errors!
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 4. Clean up and redirect
      clearCart();
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/');
      }, 4000);

    } catch (error: any) {
      console.error("Order failed:", error);
      showToastMessage(`Checkout failed: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-white p-12 shadow-sm border border-stone-light max-w-md w-full"
        >
            <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6 text-sage">
                <ShieldCheck size={32} />
            </div>
            <h2 className="font-serif text-3xl text-charcoal mb-4">Order Confirmed</h2>
            <p className="text-charcoal/60 text-[13px] leading-relaxed mb-8">
                Thank you for your purchase. We've received your order and are preparing it for shipment.
            </p>
            <div className="w-6 h-6 border-2 border-sage/30 border-t-sage rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-20 bg-warm-white">
      <Navbar />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="mb-10">
            <Link to="/" className="inline-flex items-center gap-2 text-[12px] tracking-[0.15em] uppercase text-charcoal/50 hover:text-charcoal transition-colors group mb-6">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Continue Shopping
            </Link>
            <h1 className="font-serif text-4xl lg:text-5xl text-charcoal">Checkout</h1>
        </div>

        {items.length === 0 ? (
            <div className="text-center py-20 bg-white border border-stone-light border-dashed">
                <p className="text-charcoal/50 mb-6 font-serif text-xl">Your cart is empty.</p>
                <Link to="/" className="inline-flex bg-charcoal text-white px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-charcoal-light transition-colors">
                    Explore Collection
                </Link>
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
                
                {/* Left side: Checkout Form */}
                <div className="w-full lg:w-3/5">
                    <form id="checkout-form" onSubmit={handleCheckout} className="bg-white p-8 border border-stone-light space-y-8">
                        <div>
                            <h2 className="text-[13px] tracking-[0.15em] uppercase text-charcoal mb-6 border-b border-stone-light pb-4">Shipping Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-[11px] uppercase text-charcoal/60 mb-2">First Name</label>
                                    <input required name="firstName" value={shippingDetails.firstName} onChange={handleChange} className="w-full bg-warm-white px-4 py-3 text-[13px] border border-stone focus:outline-none focus:border-charcoal/40" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] uppercase text-charcoal/60 mb-2">Last Name</label>
                                    <input required name="lastName" value={shippingDetails.lastName} onChange={handleChange} className="w-full bg-warm-white px-4 py-3 text-[13px] border border-stone focus:outline-none focus:border-charcoal/40" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[11px] uppercase text-charcoal/60 mb-2">Email Address</label>
                                    <input required type="email" name="email" value={shippingDetails.email} onChange={handleChange} className="w-full bg-warm-white px-4 py-3 text-[13px] border border-stone focus:outline-none focus:border-charcoal/40" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[11px] uppercase text-charcoal/60 mb-2">Street Address</label>
                                    <input required name="address" value={shippingDetails.address} onChange={handleChange} className="w-full bg-warm-white px-4 py-3 text-[13px] border border-stone focus:outline-none focus:border-charcoal/40" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] uppercase text-charcoal/60 mb-2">City</label>
                                    <input required name="city" value={shippingDetails.city} onChange={handleChange} className="w-full bg-warm-white px-4 py-3 text-[13px] border border-stone focus:outline-none focus:border-charcoal/40" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] uppercase text-charcoal/60 mb-2">ZIP Code</label>
                                    <input required name="zipCode" value={shippingDetails.zipCode} onChange={handleChange} className="w-full bg-warm-white px-4 py-3 text-[13px] border border-stone focus:outline-none focus:border-charcoal/40" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-[13px] tracking-[0.15em] uppercase text-charcoal mb-6 border-b border-stone-light pb-4 flex items-center gap-2">
                                <CreditCard size={16}/> Payment Method
                            </h2>
                            <div className="p-4 bg-stone-light/30 border border-stone-light text-charcoal/60 text-sm text-center">
                                This is a prototype. Payment collection is bypassed. Click checkout to simulate the process.
                            </div>
                        </div>
                    </form>
                </div>

                {/* Right side: Cart Summary */}
                <div className="w-full lg:w-2/5 lg:sticky lg:top-32">
                    <div className="bg-white p-8 border border-stone-light">
                        <h2 className="text-[13px] tracking-[0.15em] uppercase text-charcoal mb-6 border-b border-stone-light pb-4">Order Summary</h2>
                        
                        <div className="flex flex-col gap-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                            <AnimatePresence>
                                {items.map((item) => (
                                    <motion.div 
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex gap-4"
                                    >
                                        <div className="w-20 h-20 bg-warm-white shrink-0 relative border border-stone-light">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between py-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-serif text-charcoal line-clamp-1 pr-4">{item.name}</h3>
                                                <button onClick={() => removeItem(item.id)} className="text-charcoal/40 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex justify-between items-center mt-auto">
                                                <div className="flex items-center border border-stone">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 text-charcoal/60 hover:text-charcoal">
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-[11px] w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 text-charcoal/60 hover:text-charcoal">
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <span className="text-sm font-medium text-charcoal">${(item.priceValue * item.quantity).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-4 border-t border-stone-light pt-6 mb-8">
                            <div className="flex justify-between text-[13px] text-charcoal/70">
                                <span>Subtotal</span>
                                <span>${cartSubtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[13px] text-charcoal/70">
                                <span>Shipping estimate</span>
                                <span>${shippingCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg text-charcoal font-serif pt-4 border-t border-stone-light">
                                <span>Total</span>
                                <span>${totalCost.toLocaleString()}</span>
                            </div>
                        </div>

                        <button 
                            form="checkout-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="group w-full flex items-center justify-center gap-3 bg-charcoal text-white px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-charcoal-light transition-colors disabled:opacity-70"
                        >
                             {isSubmitting ? (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Complete Order
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* Success/Error Toast */}
      <AnimatePresence>
          {toast && (
              <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed bottom-8 right-8 bg-charcoal text-white px-6 py-4 shadow-xl flex items-center gap-3 z-50 pointer-events-none"
              >
                  <div className={`p-1.5 rounded-full text-white ${toast.type === 'success' ? 'bg-sage' : 'bg-red-500'}`}>
                      {toast.type === 'success' ? <Check size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={3} />}
                  </div>
                  <span className="text-sm tracking-wide">{toast.message}</span>
              </motion.div>
          )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}
