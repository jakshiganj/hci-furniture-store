import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Plus, X, Check, AlertCircle, ChevronDown, Clock, Loader2, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, Order, SavedDesign } from '../types';

// Status visual configuration
const orderStatusOptions: { value: Order['status']; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
    { value: 'pending',    label: 'Pending',    color: 'text-amber-800',  bg: 'bg-amber-100/70', icon: <Clock size={12} /> },
    { value: 'processing', label: 'Processing', color: 'text-blue-800',   bg: 'bg-blue-100/70',  icon: <Loader2 size={12} className="animate-spin" /> },
    { value: 'shipped',    label: 'Shipped',    color: 'text-indigo-800', bg: 'bg-indigo-100/70', icon: <Truck size={12} /> },
    { value: 'delivered',  label: 'Delivered',  color: 'text-green-800',  bg: 'bg-green-100/70', icon: <CheckCircle2 size={12} /> },
    { value: 'cancelled',  label: 'Cancelled',  color: 'text-red-800',    bg: 'bg-red-100/70',   icon: <XCircle size={12} /> },
];

// --- CUSTOM STATUS DROPDOWN ---
function StatusDropdown({ value, onChange }: { value: Order['status']; onChange: (v: Order['status']) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const active = orderStatusOptions.find(o => o.value === value) || orderStatusOptions[0];

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 pr-7 pl-3 py-1.5 text-[11px] font-medium uppercase tracking-wider rounded-full border transition-all cursor-pointer
                    ${isOpen ? 'border-sage shadow-sm' : 'border-transparent hover:border-charcoal/20'}
                    ${active.bg} ${active.color}`}
            >
                {active.icon}
                {active.label}
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                    <ChevronDown size={11} />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-stone-light shadow-xl z-50 overflow-hidden rounded-lg"
                    >
                        {orderStatusOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-[12px] flex items-center gap-2.5 transition-all duration-200
                                    ${value === option.value
                                        ? `${option.bg} ${option.color} font-medium`
                                        : 'text-charcoal/60 hover:bg-stone-light/30 hover:text-charcoal'
                                    }`}
                            >
                                <span className={value === option.value ? '' : 'opacity-50'}>{option.icon}</span>
                                {option.label}
                                {value === option.value && (
                                    <Check size={12} className="ml-auto" strokeWidth={2.5} />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- PRODUCTS TAB ---
function ProductsTab() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Form state
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCategory, setNewCategory] = useState('Furniture');
    
    // Toast state
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchProducts = useCallback(async () => {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!error && data) setProducts(data as Product[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        Promise.resolve().then(() => fetchProducts());
    }, [fetchProducts]);

    async function toggleActive(id: string, currentStatus: boolean) {
        setLoading(true);
        await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
        fetchProducts();
    }

    async function handleAddProduct(e: React.FormEvent) {
        e.preventDefault();
        if (!newName || !newPrice) return;
        
        const { error } = await supabase.from('products').insert({
            name: newName,
            description: "A procedurally generated product for the catalog.",
            price: parseFloat(newPrice),
            category: newCategory,
            is_active: true
        });
        
        if (error) {
            showToastMessage("Failed to add product: " + error.message, 'error');
            return;
        }
        
        showToastMessage("Product added successfully to catalog!");
        
        setNewName('');
        setNewPrice('');
        setNewCategory('Furniture');
        setIsAddModalOpen(false);
        setLoading(true);
        fetchProducts();
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-charcoal">Product Management</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-charcoal text-white px-4 py-2 text-[12px] uppercase tracking-wider hover:bg-charcoal/90 transition-colors">
                    <Plus size={16} /> Add Product
                </button>
            </div>
            
            {loading ? (
                <div className="text-center py-10 text-charcoal/50">Loading catalog...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-stone-light text-[11px] uppercase tracking-wider text-charcoal/60">
                                <th className="py-4 px-4 font-normal">Name</th>
                                <th className="py-4 px-4 font-normal">Category</th>
                                <th className="py-4 px-4 font-normal">Price</th>
                                <th className="py-4 px-4 font-normal">Status</th>
                                <th className="py-4 px-4 font-normal text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id} className="border-b border-stone-light/50 hover:bg-stone-light/20 transition-colors">
                                    <td className="py-4 px-4 font-serif">{p.name}</td>
                                    <td className="py-4 px-4 text-sm text-charcoal/70">{p.category}</td>
                                    <td className="py-4 px-4">${p.price.toLocaleString()}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 flex gap-3 justify-end items-center">
                                        <button onClick={() => toggleActive(p.id, p.is_active)} className="text-[12px] text-charcoal/60 hover:text-charcoal underline">
                                            Toggle Status
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-charcoal/50">No products found. Add one above!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

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

            {/* MODERN ADD PRODUCT MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-6 right-6 text-charcoal/50 hover:text-charcoal transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <h3 className="text-2xl font-serif text-charcoal mb-6">Create New Product</h3>
                        
                        <form onSubmit={handleAddProduct} className="space-y-5">
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider text-charcoal/60 mb-2">Product Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Minimalist Oak Table"
                                    className="w-full border border-stone-light bg-warm-white px-4 py-3 text-sm focus:outline-none focus:border-sage transition-colors"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-charcoal/60 mb-2">Price ($)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        step="0.01"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        placeholder="499.00"
                                        className="w-full border border-stone-light bg-warm-white px-4 py-3 text-sm focus:outline-none focus:border-sage transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-charcoal/60 mb-2">Category</label>
                                    <select 
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full border border-stone-light bg-warm-white px-4 py-3 text-sm focus:outline-none focus:border-sage transition-colors appearance-none"
                                    >
                                        <option value="Furniture">Furniture</option>
                                        <option value="Lighting">Lighting</option>
                                        <option value="Decor">Decor</option>
                                        <option value="Seating">Seating</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-6 py-3 text-[12px] uppercase tracking-wider text-charcoal/70 hover:text-charcoal"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-charcoal text-white px-8 py-3 text-[12px] uppercase tracking-wider hover:bg-charcoal/90 transition-colors"
                                >
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- ORDERS TAB ---
function OrdersTab() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!error && data) setOrders(data as Order[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        Promise.resolve().then(() => fetchOrders());
    }, [fetchOrders]);

    async function updateOrderStatus(id: string, newStatus: Order['status']) {
        // Optimistically update local state for snappy UX
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        
        // Push update to Supabase
        await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-charcoal">Customer Orders</h2>
            </div>
            
            {loading ? (
                <div className="text-center py-10 text-charcoal/50">Loading orders...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-stone-light text-[11px] uppercase tracking-wider text-charcoal/60">
                                <th className="py-4 px-4 font-normal">Order ID</th>
                                <th className="py-4 px-4 font-normal">Customer Info</th>
                                <th className="py-4 px-4 font-normal">Total</th>
                                <th className="py-4 px-4 font-normal">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id} className="border-b border-stone-light/50 hover:bg-stone-light/20 transition-colors">
                                    <td className="py-4 px-4 text-[12px] font-mono text-charcoal/60">...{o.id.slice(-8)}</td>
                                    <td className="py-4 px-4">
                                        <div className="text-[13px]">{o.contact_email}</div>
                                        <div className="text-[11px] text-charcoal/50 mt-1 uppercase tracking-wider">{new Date(o.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="py-4 px-4 font-medium">${o.total_amount.toLocaleString()}</td>
                                    <td className="py-4 px-4">
                                        <StatusDropdown
                                            value={o.status || 'pending'}
                                            onChange={(newStatus) => updateOrderStatus(o.id, newStatus)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-charcoal/50">No recent orders.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// --- DESIGNS TAB ---
function DesignsTab() {
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDesigns = useCallback(async () => {
        const { data, error } = await supabase.from('saved_designs').select('*').order('created_at', { ascending: false });
        if (!error && data) setDesigns(data as SavedDesign[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        Promise.resolve().then(() => fetchDesigns());
    }, [fetchDesigns]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-charcoal">Designer Gallery</h2>
                <Link 
                    to="/configure"
                    className="flex items-center gap-2 px-6 py-2 bg-charcoal text-white rounded-xl text-sm font-medium hover:bg-charcoal/90 transition-all hover:shadow-lg active:scale-95"
                >
                    <Plus size={16} />
                    New Design
                </Link>
            </div>
            
            {loading ? (
                <div className="text-center py-10 text-charcoal/50">Loading designs...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {designs.map(d => (
                        <div key={d.id} className="border border-stone-light p-6 hover:shadow-md transition-shadow relative group">
                            <h3 className="font-serif text-xl text-charcoal mb-2">{d.name || 'Untitled Room'}</h3>
                            <div className="text-[11px] uppercase tracking-wider text-charcoal/50 mb-4">{new Date(d.created_at).toLocaleString()}</div>
                            
                            <div className="space-y-2 text-[13px] text-charcoal/70 mb-6">
                                <p><strong>Room Config:</strong> {d.room_type}</p>
                                <p><strong>Items Placed:</strong> {d.furniture_layout?.length || 0}</p>
                            </div>
                            
                            <div className="pt-4 border-t border-stone-light flex justify-between items-center">
                                <span className="text-[11px] font-mono text-charcoal/40 bg-stone-light px-2 py-1">ID: ...{d.id.slice(-6)}</span>
                                <Link
                                    to={`/designer?designId=${d.id}`}
                                    className="text-[12px] tracking-[0.1em] uppercase text-sage hover:text-sage-dark font-medium transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    Load in Designer →
                                </Link>
                            </div>
                        </div>
                    ))}
                    {designs.length === 0 && (
                        <div className="col-span-full py-10 text-center text-charcoal/50 border border-dashed border-stone-light">
                            No 3D room designs have been saved to the database yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- MAIN DASHBOARD LAYER ---
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'designs'>('products');

  return (
    <div className="min-h-screen flex flex-col pt-20 bg-warm-white">
      <Navbar />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <h1 className="font-serif text-4xl lg:text-5xl text-charcoal mb-10">Admin Dashboard</h1>
        
        <div className="flex gap-4 border-b border-stone-light mb-8">
            <button 
                onClick={() => setActiveTab('products')}
                className={`py-3 px-4 text-[13px] tracking-[0.1em] uppercase transition-colors border-b-2 ${activeTab === 'products' ? 'border-charcoal text-charcoal font-medium' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}
            >
                Products Directory
            </button>
            <button 
                onClick={() => setActiveTab('orders')}
                className={`py-3 px-4 text-[13px] tracking-[0.1em] uppercase transition-colors border-b-2 ${activeTab === 'orders' ? 'border-charcoal text-charcoal font-medium' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}
            >
                Sales & Orders
            </button>
            <button 
                onClick={() => setActiveTab('designs')}
                className={`py-3 px-4 text-[13px] tracking-[0.1em] uppercase transition-colors border-b-2 ${activeTab === 'designs' ? 'border-charcoal text-charcoal font-medium' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}
            >
                Saved Designs
            </button>
        </div>

        <div className="bg-white border border-stone-light p-8 min-h-[50vh]">
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'designs' && <DesignsTab />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
