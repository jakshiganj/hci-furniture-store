import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';
import ImageMarquee from '../components/ImageMarquee';

/* ─── Stats ─── */
const stats = [
  { value: 500, suffix: '+', label: 'Items Delivered' },
  { value: 10, suffix: '+', label: 'Years of Experience' },
  { value: 12, suffix: '', label: 'Employees' },
  { value: 8, suffix: '', label: 'Partners' },
];

/* ─── Team ─── */
const team = [
  { name: 'Kasun Perera', role: 'Creative Director', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=75' },
  { name: 'Dilini Fernando', role: 'Lead Product Designer', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=75' },
  { name: 'Ruwan Silva', role: 'Materials & Sustainability', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=75' },
  { name: 'Amaya Jayasuriya', role: 'Design Operations Manager', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=75' },
];

/* ─── Our Expertise (accordion items) ─── */
const expertise = [
  { id: '01', title: 'Custom Furniture Design', points: ['Bespoke pieces tailored to your space', 'Material selection from sustainable sources', '3D modeling and precision prototyping', 'Traditional joinery meets modern techniques'] },
  { id: '02', title: 'Interior Styling', points: ['Complete room concept development', 'Color palette and material harmonization', 'Furniture layout optimization', 'Accessory and art curation'] },
  { id: '03', title: 'Space Planning', points: ['Functional flow analysis', 'Multi-purpose room design', 'Natural light optimization', 'Ergonomic workspace solutions'] },
  { id: '04', title: 'Restoration & Refinishing', points: ['Heritage furniture restoration', 'Modern finish updates', 'Structural reinforcement', 'Sustainable refurbishment'] },
];

/* ─── Values ─── */
const values = [
  { num: '/01', title: 'Creativity at the Core', desc: 'Every piece begins with imagination. We push boundaries while honouring traditional craft.' },
  { num: '/02', title: 'Attention to Detail', desc: 'From the grain of the wood to the final finish, no detail is too small to perfect.' },
  { num: '/03', title: 'Client-Centered Approach', desc: 'Your vision guides everything. We listen, adapt, and deliver beyond expectations.' },
  { num: '/04', title: 'Timeless Elegance', desc: 'Trends fade, but quality endures. We design to outlast generations.' },
];

/* ─── Awards ─── */
const awards = [
  { year: '2025', name: 'South Asian Design Awards', medal: 'Gold' },
  { year: '2025', name: 'Tropical Furniture Prize', medal: 'Gold' },
  { year: '2024', name: 'International Craft & Form Fair', medal: 'Silver' },
  { year: '2023', name: 'Minimal Design Showcase, Colombo', medal: 'Bronze' },
  { year: '2022', name: 'Global Woodwork Excellence Awards', medal: 'Gold' },
  { year: '2021', name: 'Red Dot Design', medal: 'Silver' },
];

/* ─── Animated number counter ─── */
function useCounter(target: number, inView: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(start);
    }, 16);
    return () => clearInterval(id);
  }, [inView, target, duration]);
  return count;
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const count = useCounter(value, inView);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="border-t border-charcoal/10 pt-6"
    >
      <span className="font-serif text-5xl md:text-6xl text-charcoal">{count}{suffix}</span>
      <p className="text-sm text-charcoal/50 mt-2 tracking-wide">{label}</p>
    </motion.div>
  );
}

/* ─── Accordion item ─── */
function ExpertiseItem({ id, title, points, isOpen, onToggle }: {
  id: string; title: string; points: string[]; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="border-t border-charcoal/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 group text-left"
      >
        <div className="flex items-center gap-6">
          <span className="text-[13px] text-charcoal/30 font-medium tracking-wider">/ {id}</span>
          <span className="font-serif text-xl md:text-2xl text-charcoal group-hover:text-sage-dark transition-colors">{title}</span>
        </div>
        <div className="w-8 h-8 rounded-full border border-charcoal/15 flex items-center justify-center group-hover:border-charcoal/40 transition-colors flex-shrink-0">
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-4 pb-8 pl-16 md:pl-20">
              {points.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage mt-2 flex-shrink-0" />
                  <span className="text-sm text-charcoal/60">{p}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function AboutPage() {
  const [openAccordion, setOpenAccordion] = useState<string | null>('01');

  const storyRef = useRef(null);
  const storyInView = useInView(storyRef, { once: true, margin: '-80px' });
  const quoteRef = useRef(null);
  const quoteInView = useInView(quoteRef, { once: true, margin: '-80px' });
  const teamRef = useRef(null);
  const teamInView = useInView(teamRef, { once: true, margin: '-80px' });
  const expertiseRef = useRef(null);
  const expertiseInView = useInView(expertiseRef, { once: true, margin: '-80px' });
  const valuesRef = useRef(null);
  const valuesInView = useInView(valuesRef, { once: true, margin: '-80px' });
  const awardsRef = useRef(null);
  const awardsInView = useInView(awardsRef, { once: true, margin: '-80px' });

  return (
    <>
      <Navbar />

      {/* ════════ HERO — Full-bleed image with centered title ════════ */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80"
            alt="CeylonVista workshop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/40" />
        </div>
        <div className="relative z-10 text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[12px] tracking-[0.3em] uppercase text-white/60 mb-5"
          >
            ✦ About us
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[1.05]"
          >
            Beyond Furniture,
            <br />
            We Craft <span className="italic">Experiences</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="text-white/50 text-sm md:text-base mt-6 max-w-lg mx-auto"
          >
            Colombo, Sri Lanka &nbsp;·&nbsp; 6°55′N 79°51′E
          </motion.p>
        </div>
      </section>

      {/* ════════ IMAGE MARQUEE ════════ */}
      <ImageMarquee />

      {/* ════════ PHILOSOPHY TAGLINE ════════ */}
      <section className="py-28 lg:py-40 bg-cream">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 space-y-6">
          {[
            { text: 'We believe in design.', align: 'text-left' },
            { text: 'In silence.', align: 'text-center' },
            { text: 'In touchable surfaces.', align: 'text-right' },
          ].map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.2 }}
              className={`font-serif text-4xl md:text-6xl lg:text-7xl text-charcoal ${line.align}`}
            >
              {line.text}
            </motion.p>
          ))}
        </div>
      </section>

      {/* ════════ STORY — Two-column ════════ */}
      <section ref={storyRef} className="py-24 lg:py-32 bg-cream">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={storyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-6">Designing Spaces, Crafting Stories</p>
              <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-6">Our Story</h2>
              <p className="text-charcoal/65 text-base leading-[1.85] mb-6">
                At CeylonVista, we create furniture that balances form, function and feeling.
                Founded by a team of designers and craftsmen with over a decade of experience,
                our studio combines Sri Lankan heritage with modern production techniques. Every
                piece begins with raw materials — solid teak, natural textiles, honest brass —
                selected for durability and quiet beauty.
              </p>
              <p className="text-charcoal/65 text-base leading-[1.85]">
                Using advanced 3D modeling and precision prototyping, we refine every joint and
                curve before the first cut is made. Our process blends handcraft with technology —
                from CNC shaping to traditional joinery, guided by experienced hands. The result
                is furniture that lives lightly in space, but lasts for decades.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={storyInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              {/* Decorative border offset — inspired by Estancia's frame effect */}
              <div className="absolute -inset-3 border border-stone/60 pointer-events-none" />
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"
                alt="CeylonVista craftsmanship"
                className="w-full aspect-[4/5] object-cover relative z-10"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className="py-24 lg:py-32 bg-cream-light">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════ OUR EXPERTISE — Accordion (Estancia-inspired) ════════ */}
      <section ref={expertiseRef} className="py-24 lg:py-32 bg-cream">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={expertiseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12"
          >
            <div>
              <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-3">✦ Our Expertise</p>
              <h2 className="font-serif text-3xl md:text-4xl text-charcoal">
                Mastering the Art of Space,
                <br className="hidden md:block" />
                From Vision to Reality
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-charcoal text-white px-6 py-3.5 text-[12px] tracking-[0.15em] uppercase hover:bg-charcoal-light transition-colors self-start md:self-auto"
            >
              ✦ Contact us
            </Link>
          </motion.div>

          <div>
            {expertise.map((item) => (
              <ExpertiseItem
                key={item.id}
                {...item}
                isOpen={openAccordion === item.id}
                onToggle={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
              />
            ))}
            <div className="border-t border-charcoal/10" />
          </div>
        </div>
      </section>

      {/* ════════ FOUNDER QUOTE ════════ */}
      <section ref={quoteRef} className="py-28 lg:py-40 bg-charcoal text-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={quoteInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-8 rounded-full overflow-hidden ring-2 ring-white/10 ring-offset-4 ring-offset-charcoal">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=75"
                alt="Founder portrait"
                className="w-full h-full object-cover"
              />
            </div>
            <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl text-white/85 italic leading-relaxed mb-8 max-w-3xl mx-auto">
              "We didn't just want to make furniture. We wanted to build tools for living —
              pieces that support stillness, clarity and warmth. Every decision we make, from
              design to material to finish — is about helping people feel more at home in
              their space."
            </blockquote>
            <p className="text-sm font-medium text-white/90">Kasun Perera</p>
            <p className="text-[12px] text-white/40 mt-1 tracking-wide">Founder & CEO at CeylonVista</p>
          </motion.div>
        </div>
      </section>

      {/* ════════ TEAM ════════ */}
      <section ref={teamRef} className="py-24 lg:py-32 bg-stone-light">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-3">✦ Our Team</p>
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal">The Creators of Your Dream Spaces</h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 25 }}
                animate={teamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="aspect-[3/4] overflow-hidden bg-stone relative">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  />
                  {/* Hover overlay with name */}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                    <div>
                      <h3 className="text-white text-sm font-medium">{member.name}</h3>
                      <p className="text-white/60 text-[12px] mt-0.5">{member.role}</p>
                    </div>
                  </div>
                </div>
                {/* Name visible below on mobile, hidden on hover for desktop */}
                <div className="mt-3 lg:mt-0 lg:h-0 lg:overflow-hidden">
                  <h3 className="text-sm font-medium text-charcoal">{member.name}</h3>
                  <p className="text-[12px] text-charcoal/45 mt-0.5">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ VALUES — Estancia-inspired numbered pillars ════════ */}
      <section ref={valuesRef} className="py-24 lg:py-32 bg-cream">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-3">✦ Our Values</p>
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal">Driven by Values, Inspired by You</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.num}
                initial={{ opacity: 0, y: 25 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="border border-charcoal/10 p-6 lg:p-8 hover:border-sage/40 hover:bg-sage/[0.03] transition-all duration-500 group"
              >
                <span className="text-[12px] text-sage-dark font-medium tracking-wider">{v.num}</span>
                <h3 className="font-serif text-lg md:text-xl text-charcoal mt-3 mb-3">{v.title}</h3>
                <p className="text-[13px] text-charcoal/50 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ AWARDS ════════ */}
      <section ref={awardsRef} className="py-24 lg:py-32 bg-stone-light/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={awardsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="font-serif text-3xl md:text-4xl text-charcoal"
            >
              Awards
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={awardsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-sm text-charcoal/50 max-w-xs lg:text-right italic"
            >
              We don't design for trophies.<br />We design to earn respect.
            </motion.p>
          </div>

          <div className="space-y-0">
            {awards.map((a, i) => (
              <motion.div
                key={`${a.year}-${a.name}`}
                initial={{ opacity: 0, y: 15 }}
                animate={awardsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="grid grid-cols-[60px_1fr_auto] items-center border-t border-charcoal/10 py-5 group hover:bg-charcoal/[0.02] transition-colors px-2"
              >
                <span className="text-[13px] text-charcoal/35">{a.year}</span>
                <span className="text-sm text-charcoal/80">{a.name}</span>
                <span className="text-[12px] tracking-[0.1em] text-charcoal/40">{a.medal}</span>
              </motion.div>
            ))}
            <div className="border-t border-charcoal/10" />
          </div>
        </div>
      </section>

      {/* ════════ CTA BANNER ════════ */}
      <section className="py-20 lg:py-28 bg-sage-dark text-white text-center">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl md:text-4xl mb-4">Ready to Transform Your Space?</h2>
            <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
              Let's create something timeless together. Browse our collection or get in touch for a custom piece.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="group inline-flex items-center justify-center gap-3 bg-white text-charcoal px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-cream transition-colors"
              >
                Explore Collection
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-3 border border-white/30 text-white px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-white/10 transition-colors"
              >
                Request Custom Order
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </>
  );
}
