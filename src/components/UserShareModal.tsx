import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { searchUsers, shareDesignWithUser, type UserProfile } from '../services/designService';

interface UserShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    designId: string;
    designName: string;
    imageData: string;
}

export default function UserShareModal({ isOpen, onClose, designId, designName, imageData }: UserShareModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [sharingStatus, setSharingStatus] = useState<Record<string, 'idle' | 'sharing' | 'shared'>>({});

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.length >= 1) {
                setIsSearching(true);
                const results = await searchUsers(searchQuery);
                setUsers(results);
                setIsSearching(false);
            } else {
                setUsers([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const handleShare = async (user: UserProfile) => {
        setSharingStatus(prev => ({ ...prev, [user.id]: 'sharing' }));
        
        const success = await shareDesignWithUser(designId, user.id, imageData);
        
        if (success) {
            setSharingStatus(prev => ({ ...prev, [user.id]: 'shared' }));
            setTimeout(() => {
                // Keep the 'shared' status for a moment then maybe clear it
            }, 2000);
        } else {
            setSharingStatus(prev => ({ ...prev, [user.id]: 'idle' }));
            alert("Failed to share design. Please try again.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-stone-light"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-stone-light">
                            <div>
                                <h3 className="text-xl font-serif text-charcoal">Share Design</h3>
                                <p className="text-xs text-charcoal/50 mt-1">Sharing: {designName}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-stone-light/40 rounded-full transition-colors"
                            >
                                <X size={20} className="text-charcoal/60" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-stone-light/20 border border-stone-light rounded-xl 
                                             focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all text-sm"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-charcoal/40 gap-3">
                                        <Loader2 size={24} className="animate-spin" />
                                        <p className="text-xs uppercase tracking-widest">Searching users...</p>
                                    </div>
                                ) : users.length > 0 ? (
                                    users.map(user => (
                                        <div 
                                            key={user.id} 
                                            className="flex items-center justify-between p-4 rounded-xl bg-warm-white border border-stone-light/50 hover:border-stone-dark/20 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center text-sage font-medium uppercase text-xs">
                                                    {(user.first_name?.[0] || '') + (user.last_name?.[0] || user.first_name?.[1] || '')}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-charcoal text-sm">{user.first_name} {user.last_name}</p>
                                                    <p className="text-[10px] text-charcoal/40 uppercase tracking-wider">{user.role}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleShare(user)}
                                                disabled={sharingStatus[user.id] === 'sharing' || sharingStatus[user.id] === 'shared'}
                                                className={`px-4 py-2 rounded-lg text-[10px] tracking-widest uppercase font-semibold transition-all flex items-center gap-2
                                                    ${sharingStatus[user.id] === 'shared' 
                                                        ? 'bg-sage/10 text-sage' 
                                                        : sharingStatus[user.id] === 'sharing'
                                                            ? 'bg-stone-light text-charcoal/40'
                                                            : 'bg-charcoal text-white hover:bg-charcoal/90 hover:shadow-md'
                                                    }`}
                                            >
                                                {sharingStatus[user.id] === 'shared' ? (
                                                    <>
                                                        <Check size={12} />
                                                        Shared
                                                    </>
                                                ) : sharingStatus[user.id] === 'sharing' ? (
                                                    <>
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Sharing
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={12} />
                                                        Share
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))
                                ) : searchQuery.length >= 1 ? (
                                    <p className="text-center py-10 text-charcoal/40 text-sm italic">No users found.</p>
                                ) : (
                                    <p className="text-center py-10 text-charcoal/30 text-xs uppercase tracking-widest">Search to find users</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-stone-light/10 text-center">
                            <button 
                                onClick={onClose}
                                className="text-[11px] uppercase tracking-[0.2em] text-charcoal/40 hover:text-charcoal transition-colors font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
