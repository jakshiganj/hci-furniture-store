import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const featuredArticle = {
  id: 1,
  title: 'The Art of Essentialism in Modern Living',
  category: 'Design Philosophy',
  date: 'October 12, 2023',
  image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80',
  excerpt: 'Exploring how removing the superfluous can bring ultimate clarity and warmth to our interior spaces, creating homes that truly nurture the soul.'
};

const articles = [
  {
    id: 2,
    title: 'Textural Harmony: A Guide to Layering Materials',
    category: 'Styling',
    date: 'September 28, 2023',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  },
  {
    id: 3,
    title: 'Sustainability in Furniture Design: What Actually Matters',
    category: 'Innovation',
    date: 'August 14, 2023',
    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800&q=80',
  },
  {
    id: 4,
    title: 'The Copenhagen Standard: Insights from Our Design Hub',
    category: 'Behind the Scenes',
    date: 'July 05, 2023',
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
  },
  {
    id: 5,
    title: 'Lighting as Architecture: Shaping Space with Shadows',
    category: 'Architecture',
    date: 'June 19, 2023',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
  }
];

export default function JournalPage() {
  return (
    <div className="min-h-screen flex flex-col pt-20 bg-warm-white">
      <Navbar />

      <main className="flex-grow w-full">
        {/* Header Section */}
        <section className="py-20 lg:py-32 px-6 lg:px-10 max-w-7xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-3xl"
            >
                <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-6">Editorial</p>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-charcoal leading-tight mb-8">
                    Stories of <span className="italic">Design</span> & Living
                </h1>
                <p className="text-xl text-charcoal/70 font-light max-w-xl text-balance">
                    Perspectives on intentional living, modern aesthetics, and the philosophies that shape our environments.
                </p>
            </motion.div>
        </section>

        {/* Featured Article */}
        <section className="px-6 lg:px-10 max-w-7xl mx-auto mb-32">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="group cursor-pointer block relative overflow-hidden bg-stone-light/30 border border-stone-light"
            >
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-0">
                    <div className="lg:col-span-3 aspect-square md:aspect-auto md:h-full relative overflow-hidden">
                        <img 
                            src={featuredArticle.image} 
                            alt={featuredArticle.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                    </div>
                    <div className="lg:col-span-2 p-10 md:p-14 lg:p-20 flex flex-col justify-center bg-white/50 backdrop-blur-sm z-10 transition-colors duration-500 group-hover:bg-white/80">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-[10px] tracking-[0.2em] uppercase text-sage-dark font-medium">{featuredArticle.category}</span>
                            <span className="w-1 h-1 rounded-full bg-stone-dark/40"></span>
                            <span className="text-[11px] uppercase tracking-wider text-charcoal/50">{featuredArticle.date}</span>
                        </div>
                        <h2 className="font-serif text-3xl lg:text-4xl text-charcoal mb-6 group-hover:text-sage transition-colors duration-300">
                            {featuredArticle.title}
                        </h2>
                        <p className="text-charcoal/70 leading-relaxed mb-10 text-balance">
                            {featuredArticle.excerpt}
                        </p>
                        <div className="mt-auto inline-flex items-center gap-3 text-[12px] tracking-[0.15em] uppercase text-charcoal group-hover:text-sage-dark transition-colors">
                            Read the Feature
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>

        {/* Article Grid */}
        <section className="px-6 lg:px-10 max-w-7xl mx-auto pb-32">
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-x-12 gap-y-20">
                {articles.map((article, index) => (
                    <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.6, delay: (index % 2) * 0.2 }}
                        className="group cursor-pointer flex flex-col"
                    >
                        <div className="relative overflow-hidden aspect-[4/3] bg-stone-light/50 mb-6">
                            <img 
                                src={article.image} 
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                        <div className="flex flex-col flex-grow">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] tracking-[0.2em] uppercase text-stone-dark">{article.category}</span>
                                <span className="w-1 h-1 rounded-full bg-stone-light"></span>
                                <span className="text-[10px] uppercase tracking-wider text-charcoal/40">{article.date}</span>
                            </div>
                            <h3 className="font-serif text-2xl text-charcoal group-hover:text-sage transition-colors duration-300 mb-6">
                                {article.title}
                            </h3>
                            <div className="mt-auto pt-6 border-t border-stone-light flex justify-between items-center group-hover:border-stone-dark/30 transition-colors">
                                <span className="text-[11px] tracking-[0.1em] uppercase text-charcoal/60">Read Article</span>
                                <ArrowUpRight size={14} className="text-charcoal/40 group-hover:text-charcoal transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            <div className="mt-32 pt-20 border-t border-stone-light text-center">
                <button className="bg-transparent border border-stone-dark text-charcoal px-10 py-4 text-[12px] uppercase tracking-[0.15em] hover:bg-stone-dark hover:text-white transition-all duration-300">
                    Load More Stories
                </button>
            </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
