import { Instagram, Twitter } from 'lucide-react';

const footerLinks = {
    Shop: ['All Products', 'Living Room', 'Bedroom', 'Workspace', 'Lighting'],
    Company: ['About Us', 'Our Story', 'Careers', 'Sustainability'],
    Support: ['Contact', 'Shipping', 'Returns', 'FAQ', 'Care Guide'],
};

export default function Footer() {
    return (
        <footer className="bg-charcoal text-white/60 pt-20 pb-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <h3 className="text-2xl tracking-[0.3em] font-serif text-white mb-4">
                            CeylonVista
                        </h3>
                        <p className="text-sm leading-relaxed max-w-xs mb-6">
                            Timeless Srilankan furniture, designed with care and crafted to
                            last for generations.
                        </p>
                        <div className="flex items-center gap-4">
                            <a
                                href="#"
                                className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 hover:text-white transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram size={15} strokeWidth={1.5} />
                            </a>
                            <a
                                href="#"
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
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-sm hover:text-white transition-colors duration-300"
                                        >
                                            {link}
                                        </a>
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
                        <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
                        <a href="#" className="hover:text-white/60 transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
