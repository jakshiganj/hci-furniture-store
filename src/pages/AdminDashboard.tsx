import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Plus, X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- PRODUCTS TAB ---
function ProductsTab() {
    const [products, setProducts] = useState<any[]>([]);
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

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!error && data) setProducts(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchProducts();
    }, []);

    async function toggleActive(id: string, currentStatus: boolean) {
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
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchOrders() {
        setLoading(true);
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!error && data) setOrders(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchOrders();
    }, []);

    async function updateOrderStatus(id: string, newStatus: string) {
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
                                        <div className="relative inline-block">
                                            <select 
                                                value={o.status || 'pending'} 
                                                onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                                className={`appearance-none outline-none cursor-pointer pr-8 pl-3 py-1.5 text-[11px] font-medium uppercase tracking-wider rounded-full border border-transparent transition-all hover:border-charcoal/20 focus:border-sage focus:ring-1 focus:ring-sage focus:ring-opacity-50
                                                    ${o.status === 'pending' ? 'bg-amber-100/70 text-amber-800' : 
                                                      o.status === 'processing' ? 'bg-blue-100/70 text-blue-800' :
                                                      o.status === 'shipped' ? 'bg-indigo-100/70 text-indigo-800' :
                                                      o.status === 'delivered' ? 'bg-green-100/70 text-green-800' :
                                                      o.status === 'cancelled' ? 'bg-red-100/70 text-red-800' :
                                                      'bg-stone-100 text-charcoal'
                                                    }`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <svg className={`h-3 w-3 ${o.status === 'pending' ? 'text-amber-800' : o.status === 'processing' ? 'text-blue-800' : o.status === 'shipped' ? 'text-indigo-800' : o.status === 'delivered' ? 'text-green-800' : o.status === 'cancelled' ? 'text-red-800' : 'text-charcoal'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
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
    const [designs, setDesigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchDesigns() {
        setLoading(true);
        const { data, error } = await supabase.from('saved_designs').select('*').order('created_at', { ascending: false });
        if (!error && data) setDesigns(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchDesigns();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-charcoal">Designer Gallery</h2>
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
