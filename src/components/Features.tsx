import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Leaf, Gem, Truck } from 'lucide-react';

const features = [
    {
        icon: Leaf,
        title: 'Sustainable Materials',
        description:
            'Every piece is crafted from responsibly sourced wood, organic fabrics, and eco-conscious finishes that respect our planet.',
    },
    {
        icon: Gem,
        title: 'Artisan Craftsmanship',
        description:
            'Handcrafted by skilled artisans who pour decades of experience into every joint, curve, and surface.',
    },
    {
        icon: Truck,
        title: 'White Glove Delivery',
        description:
            'We handle every detail — from careful packaging to in-home assembly — so your pieces arrive flawlessly.',
    },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });
    const Icon = feature.icon;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="group text-center px-6 lg:px-10"
        >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-stone-light mb-6 group-hover:bg-sage/20 transition-colors duration-500">
                <Icon size={22} strokeWidth={1.3} className="text-charcoal/70" />
            </div>
            <h3 className="font-serif text-xl md:text-2xl text-charcoal mb-4">
                {feature.title}
            </h3>
            <p className="text-charcoal/50 text-sm leading-relaxed max-w-xs mx-auto">
                {feature.description}
            </p>
        </motion.div>
    );
}

export default function Features() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section id="about" className="py-28 lg:py-40 bg-cream">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                {/* Section Header */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-20"
                >
                    <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-4">
                        Our Philosophy
                    </p>
                    <h2 className="font-serif text-3xl md:text-5xl text-charcoal text-balance">
                        Designed to Last,
                        <br />
                        <span className="italic">Made with Purpose</span>
                    </h2>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
                    {features.map((feature, i) => (
                        <FeatureCard key={feature.title} feature={feature} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
