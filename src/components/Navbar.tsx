import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Search, User, LogOut, Package } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn, logout, getUser, isAdmin } from '../utils/auth';
import { useCart } from '../utils/cart';

const navLinks = [
  { name: 'Shop', href: '/#shop' },
  { name: 'Collections', href: '/#collections' },
  { name: 'About', href: '/#about' },
  { name: 'Journal', href: '/journal' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const loggedIn = isLoggedIn();
  const adminLevel = isAdmin();
  // Retrieve the current user's data (name, email) from localStorage session
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItemsCount } = useCart();
  
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/designer');

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? 'bg-cream/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.05)]'
          : 'bg-transparent'
          }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#top" className="text-2xl tracking-[0.3em] font-serif text-charcoal">
              CeylonVista
            </a>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {!isAdminPage && navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-[13px] tracking-[0.15em] uppercase text-charcoal/70 hover:text-charcoal transition-colors duration-300 relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-charcoal group-hover:w-full transition-all duration-300" />
                </a>
              ))}
              {adminLevel && (
                  <>
                    <Link to="/designer" className="text-[13px] tracking-[0.15em] uppercase text-sage font-bold hover:text-sage/80 transition-colors relative group">
                        Designer
                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-sage group-hover:w-full transition-all duration-300" />
                    </Link>
                    <Link to="/admin" className="text-[13px] tracking-[0.15em] uppercase text-sage font-bold hover:text-sage/80 transition-colors relative group">
                        Admin
                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-sage group-hover:w-full transition-all duration-300" />
                    </Link>
                  </>
              )}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 lg:gap-5">
              <button className="hidden lg:block text-charcoal/70 hover:text-charcoal transition-colors" aria-label="Search">
                <Search size={18} strokeWidth={1.5} />
              </button>
              {loggedIn && (
                <Link to="/orders" className="text-charcoal/70 hover:text-charcoal transition-colors" aria-label="My Orders" title="My Orders">
                  <Package size={18} strokeWidth={1.5} />
                </Link>
              )}
              <Link to="/checkout" className="text-charcoal/70 hover:text-charcoal transition-colors relative" aria-label="Cart">
                <ShoppingBag size={18} strokeWidth={1.5} />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-sage px-1 text-white text-[9px] rounded-full flex items-center justify-center font-medium">
                    {totalItemsCount}
                  </span>
                )}
              </Link>
              {loggedIn ? (
                <>
                  {/* Greeting — shows logged-in user's name from localStorage session */}
                  {user?.name && (
                    <span className="hidden md:inline text-[12px] tracking-[0.1em] text-charcoal/60 font-medium">
                      Hello, {user.name} 👋
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-charcoal/70 hover:text-charcoal transition-colors"
                    aria-label="Logout"
                    title="Sign out"
                  >
                    <LogOut size={18} strokeWidth={1.5} />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-charcoal/70 hover:text-charcoal transition-colors"
                  aria-label="Login"
                  title="Sign in"
                >
                  <User size={18} strokeWidth={1.5} />
                </Link>
              )}
              <button
                className="lg:hidden text-charcoal/70 hover:text-charcoal transition-colors"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Menu"
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-cream flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-20">
              <span className="text-2xl tracking-[0.3em] font-serif">CeylonVista</span>
              <button onClick={() => setIsMobileOpen(false)} aria-label="Close menu">
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              {!isAdminPage && navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-3xl font-serif text-charcoal"
                  onClick={() => setIsMobileOpen(false)}
                >
                  {link.name}
                </motion.a>
              ))}
              {loggedIn && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                >
                  <Link
                    to="/orders"
                    className="text-3xl font-serif text-charcoal"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    My Orders
                  </Link>
                </motion.div>
              )}
              {adminLevel && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.1 }}
                      className="mt-4 pt-4 border-t border-charcoal/10 w-32 text-center flex flex-col gap-6"
                    >
                        <Link 
                            to="/designer" 
                            className="text-2xl font-serif text-sage"
                            onClick={() => setIsMobileOpen(false)}
                        >
                            Designer
                        </Link>
                        <Link 
                            to="/admin" 
                            className="text-2xl font-serif text-sage"
                            onClick={() => setIsMobileOpen(false)}
                        >
                            Admin
                        </Link>
                    </motion.div>
                  </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
