import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ArrowLeft, ShoppingBag, MapPin, Clock, Truck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabase';
import { getUser } from '../utils/auth';
import type { Order } from '../types';

// Extended order type that includes order items from the join
interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    products: {
        name: string;
        image_url: string;
        category: string;
    } | null;
}

interface OrderWithItems extends Order {
    order_items: OrderItem[];
}

// Status config for the visual badge
const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending:    { label: 'Pending',    color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  icon: <Clock size={14} /> },
    processing: { label: 'Processing', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: <Loader2 size={14} className="animate-spin" /> },
    shipped:    { label: 'Shipped',    color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: <Truck size={14} /> },
    delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: <CheckCircle2 size={14} /> },
    cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      icon: <XCircle size={14} /> },
};

// --- ORDER CARD ---
function OrderCard({ order, index }: { order: OrderWithItems; index: number }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const status = statusConfig[order.status] || statusConfig.pending;

    const orderDate = new Date(order.created_at);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white border border-stone-light overflow-hidden group hover:shadow-lg transition-shadow duration-500"
        >
            {/* Order Header — always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 cursor-pointer focus:outline-none"
                aria-expanded={isExpanded}
                id={`order-header-${order.id}`}
            >
                {/* Order Icon */}
                <div className="shrink-0 w-12 h-12 bg-cream rounded-full flex items-center justify-center text-charcoal/40 group-hover:text-sage transition-colors duration-300">
                    <Package size={20} strokeWidth={1.5} />
                </div>

                {/* Order Meta */}
                <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                        <h3 className="font-serif text-lg text-charcoal">
                            Order #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border rounded-full ${status.bg} ${status.color}`}>
                            {status.icon}
                            {status.label}
                        </span>
                    </div>
                    <p className="text-[12px] tracking-wider text-charcoal/50 uppercase">
                        {formattedDate} · {formattedTime}
                    </p>
                </div>

                {/* Order Total & Chevron */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wider text-charcoal/40 mb-0.5">Total</p>
                        <p className="font-serif text-xl text-charcoal">${order.total_amount.toLocaleString()}</p>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-charcoal/30 group-hover:text-charcoal/60 transition-colors"
                    >
                        <ChevronDown size={20} />
                    </motion.div>
                </div>
            </button>

            {/* Expandable Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-stone-light/60">
                            {/* Items Grid */}
                            <div className="mb-6">
                                <h4 className="text-[11px] uppercase tracking-[0.15em] text-charcoal/50 mb-4">Items Ordered</h4>
                                <div className="space-y-3">
                                    {order.order_items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 bg-cream/50 rounded-sm">
                                            {/* Product Image */}
                                            <div className="w-14 h-14 bg-warm-white border border-stone-light rounded-sm overflow-hidden shrink-0">
                                                {item.products?.image_url ? (
                                                    <img
                                                        src={item.products.image_url}
                                                        alt={item.products?.name || 'Product'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-charcoal/20">
                                                        <ShoppingBag size={18} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-grow min-w-0">
                                                <p className="font-serif text-charcoal text-sm truncate">
                                                    {item.products?.name || 'Product'}
                                                </p>
                                                <p className="text-[11px] text-charcoal/50 uppercase tracking-wider">
                                                    {item.products?.category || 'Item'} · Qty: {item.quantity}
                                                </p>
                                            </div>

                                            {/* Price */}
                                            <p className="text-sm font-medium text-charcoal shrink-0">
                                                ${(item.unit_price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                    {order.order_items.length === 0 && (
                                        <p className="text-sm text-charcoal/40 py-3 text-center">No item details available.</p>
                                    )}
                                </div>
                            </div>

                            {/* Shipping & Contact Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Shipping Address */}
                                <div>
                                    <h4 className="text-[11px] uppercase tracking-[0.15em] text-charcoal/50 mb-3 flex items-center gap-2">
                                        <MapPin size={12} /> Shipping Address
                                    </h4>
                                    <div className="text-[13px] text-charcoal/70 space-y-0.5 leading-relaxed">
                                        <p className="font-medium text-charcoal">
                                            {order.shipping_address.firstName} {order.shipping_address.lastName}
                                        </p>
                                        <p>{order.shipping_address.address}</p>
                                        <p>{order.shipping_address.city}, {order.shipping_address.zipCode}</p>
                                    </div>
                                </div>

                                {/* Order Breakdown */}
                                <div>
                                    <h4 className="text-[11px] uppercase tracking-[0.15em] text-charcoal/50 mb-3">Order Summary</h4>
                                    <div className="space-y-2 text-[13px]">
                                        <div className="flex justify-between text-charcoal/60">
                                            <span>Items ({order.order_items.reduce((sum, i) => sum + i.quantity, 0)})</span>
                                            <span>${(order.total_amount - 150).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-charcoal/60">
                                            <span>Shipping</span>
                                            <span>$150</span>
                                        </div>
                                        <div className="flex justify-between font-medium text-charcoal pt-2 border-t border-stone-light/60">
                                            <span>Total</span>
                                            <span className="font-serif">${order.total_amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}


// --- MAIN PAGE ---
export default function PastOrders() {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const user = getUser();

    const fetchOrders = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    product_id,
                    quantity,
                    unit_price,
                    products ( name, image_url, category )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data as OrderWithItems[]);
        }
        setLoading(false);
    }, [user?.id]);

    useEffect(() => {
        Promise.resolve().then(() => fetchOrders());
    }, [fetchOrders]);

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen flex flex-col pt-20 bg-warm-white">
            <Navbar />

            <main className="flex-grow w-full max-w-5xl mx-auto px-6 lg:px-10 py-12">
                {/* Breadcrumb */}
                <div className="mb-10">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-[12px] tracking-[0.15em] uppercase text-charcoal/50 hover:text-charcoal transition-colors group mb-6"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Shop
                    </Link>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="font-serif text-4xl lg:text-5xl text-charcoal"
                    >
                        My Orders
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                        className="text-[13px] text-charcoal/50 mt-2 tracking-wide"
                    >
                        Track and review your purchase history
                    </motion.p>
                </div>

                {/* Stat Chips */}
                {!loading && orders.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="flex flex-wrap gap-2 mb-8"
                    >
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 text-[11px] uppercase tracking-wider border transition-all duration-300 ${
                                filterStatus === 'all'
                                    ? 'bg-charcoal text-white border-charcoal'
                                    : 'bg-white text-charcoal/60 border-stone-light hover:border-charcoal/30 hover:text-charcoal'
                            }`}
                        >
                            All Orders ({orders.length})
                        </button>
                        {Object.entries(statusCounts).map(([status, count]) => {
                            const config = statusConfig[status];
                            if (!config) return null;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 text-[11px] uppercase tracking-wider border transition-all duration-300 ${
                                        filterStatus === status
                                            ? 'bg-charcoal text-white border-charcoal'
                                            : 'bg-white text-charcoal/60 border-stone-light hover:border-charcoal/30 hover:text-charcoal'
                                    }`}
                                >
                                    {config.label} ({count})
                                </button>
                            );
                        })}
                    </motion.div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-8 h-8 border-2 border-stone/30 border-t-sage rounded-full animate-spin mb-4" />
                        <p className="text-[13px] text-charcoal/50 tracking-wider uppercase">Loading your orders</p>
                    </div>
                ) : orders.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="text-center py-24 bg-white border border-dashed border-stone-light"
                    >
                        <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-6 text-charcoal/25">
                            <Package size={36} strokeWidth={1} />
                        </div>
                        <h2 className="font-serif text-2xl text-charcoal mb-3">No Orders Yet</h2>
                        <p className="text-[13px] text-charcoal/50 leading-relaxed max-w-sm mx-auto mb-8">
                            You haven't placed any orders yet. Explore our curated collection and find something you love.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-charcoal text-white px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-charcoal-light transition-colors group"
                        >
                            <ShoppingBag size={16} />
                            Explore Collection
                        </Link>
                    </motion.div>
                ) : filteredOrders.length === 0 ? (
                    /* No orders for this filter */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-white border border-stone-light"
                    >
                        <p className="text-charcoal/50 font-serif text-lg">
                            No {statusConfig[filterStatus]?.label.toLowerCase()} orders found.
                        </p>
                        <button
                            onClick={() => setFilterStatus('all')}
                            className="mt-4 text-[12px] text-sage hover:text-sage-dark underline uppercase tracking-wider"
                        >
                            Show all orders
                        </button>
                    </motion.div>
                ) : (
                    /* Order List */
                    <div className="space-y-4">
                        {filteredOrders.map((order, index) => (
                            <OrderCard key={order.id} order={order} index={index} />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
