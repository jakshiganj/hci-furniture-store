import { Instagram, Twitter } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const footerLinks: Record<string, { label: string; to: string }[]> = {
    Shop: [
        { label: 'All Products', to: '/products' },
        { label: 'Living Room', to: '/products' },
        { label: 'Bedroom', to: '/products' },
        { label: 'Workspace', to: '/products' },
        { label: 'Lighting', to: '/products' },
    ],
    Company: [
        { label: 'About Us', to: '/#about' },
        { label: 'Our Story', to: '/#about' },
        { label: 'Journal', to: '/journal' },
        { label: 'Sustainability', to: '/#about' },
    ],
    Support: [
        { label: 'Contact', to: '/#about' },
        { label: 'Shipping', to: '/#about' },
        { label: 'Returns', to: '/#about' },
        { label: 'FAQ', to: '/#about' },
        { label: 'Care Guide', to: '/#about' },
    ],
};

export default function Footer() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleHashNav = (hash: string) => {
        const id = hash.replace('/#', '');
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="bg-charcoal text-white/60 pt-20 pb-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="text-2xl tracking-[0.3em] font-serif text-white mb-4 block">
                            CeylonVista
                        </Link>
                        <p className="text-sm leading-relaxed max-w-xs mb-6">
                            Timeless Srilankan furniture, designed with care and crafted to
                            last for generations.
                        </p>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 hover:text-white transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram size={15} strokeWidth={1.5} />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 hover:text-white transition-all"
                                aria-label="Twitter"
                            >
                                <Twitter size={15} strokeWidth={1.5} />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-[12px] tracking-[0.2em] uppercase text-white/40 mb-5">
                                {title}
                            </h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        {link.to.startsWith('/#') ? (
                                            <button
                                                onClick={() => handleHashNav(link.to)}
                                                className="text-sm hover:text-white transition-colors duration-300"
                                            >
                                                {link.label}
                                            </button>
                                        ) : (
                                            <Link
                                                to={link.to}
                                                className="text-sm hover:text-white transition-colors duration-300"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[12px] text-white/30">
                        © 2026 CeylonVista. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-[12px] text-white/30">
                        <span className="hover:text-white/60 transition-colors cursor-pointer">Privacy</span>
                        <span className="hover:text-white/60 transition-colors cursor-pointer">Terms</span>
                        <span className="hover:text-white/60 transition-colors cursor-pointer">Cookies</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
