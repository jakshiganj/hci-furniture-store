import { motion } from 'framer-motion';

const marqueeRow1 = [
  'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=480&q=75',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=480&q=75',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=480&q=75',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=480&q=75',
  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=480&q=75',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=480&q=75',
];

const marqueeRow2 = [
  'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=480&q=75',
  'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=480&q=75',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=480&q=75',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=480&q=75',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=480&q=75',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=480&q=75',
];

export default function ImageMarquee() {
  return (
    <section className="py-1 bg-cream overflow-hidden">
      <div className="overflow-hidden mb-1">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex gap-1"
        >
          {[...marqueeRow1, ...marqueeRow1].map((src, i) => (
            <img key={i} src={src} alt="CeylonVista workshop" className="h-36 md:h-48 w-auto object-cover grayscale hover:grayscale-0 transition-all duration-500 flex-shrink-0" />
          ))}
        </motion.div>
      </div>
      <div className="overflow-hidden">
        <motion.div
          animate={{ x: ['-50%', '0%'] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="flex gap-1"
        >
          {[...marqueeRow2, ...marqueeRow2].map((src, i) => (
            <img key={i} src={src} alt="CeylonVista furniture" className="h-36 md:h-48 w-auto object-cover grayscale hover:grayscale-0 transition-all duration-500 flex-shrink-0" />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
