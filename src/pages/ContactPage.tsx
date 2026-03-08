import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight, MapPin, Mail, Phone } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const formRef = useRef(null);
  const formInView = useInView(formRef, { once: true, margin: '-100px' });

  const infoRef = useRef(null);
  const infoInView = useInView(infoRef, { once: true, margin: '-100px' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <>
      <Navbar />
      
      {/* ════════ HERO ════════ */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80"
            alt="CeylonVista Studio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/50" />
        </div>
        <div className="relative z-10 text-center px-6 mt-16">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[12px] tracking-[0.3em] uppercase text-white/60 mb-5"
          >
            ✦ Get in touch
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[1.05]"
          >
            Let's <span className="italic">Connect</span>
          </motion.h1>
        </div>
      </section>

      {/* ════════ CONTACT INFO & FORM ════════ */}
      <section className="py-24 lg:py-32 bg-cream">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid lg:grid-cols-5 gap-16 lg:gap-24">
            
            {/* Contact Information */}
            <motion.div 
              ref={infoRef}
              initial={{ opacity: 0, x: -30 }}
              animate={infoInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="lg:col-span-2 space-y-12"
            >
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-6">Our Studio</h2>
                <p className="text-charcoal/65 leading-relaxed text-sm max-w-md">
                  Whether you're looking for a bespoke furniture piece, need assistance with interior styling, or simply want to say hello, we'd love to hear from you.
                </p>
              </div>

              <div className="space-y-8 border-t border-charcoal/10 pt-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-charcoal/15 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-charcoal/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-charcoal mb-1">Visit Us</h3>
                    <p className="text-[13px] text-charcoal/60 leading-relaxed">
                      Lofstromsvagen 8, 57 office<br />
                      Colombo 05, Sri Lanka<br />
                      (By Appointment Only)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-charcoal/15 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-charcoal/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-charcoal mb-1">Email Us</h3>
                    <a href="mailto:hello@ceylonvista.com" className="text-[13px] text-charcoal/60 hover:text-charcoal transition-colors">
                      hello@ceylonvista.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-charcoal/15 flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-charcoal/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-charcoal mb-1">Call Us</h3>
                    <p className="text-[13px] text-charcoal/60">
                      +94 11 234 5678<br />
                      Mon - Fri, 9am - 6pm (IST)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div 
              ref={formRef}
              initial={{ opacity: 0, y: 30 }}
              animate={formInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-3 bg-white p-8 md:p-12 border border-charcoal/5 shadow-sm"
            >
              {!submitted ? (
                <>
                  <h3 className="font-serif text-2xl text-charcoal mb-8">Send a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-[11px] tracking-[0.1em] uppercase text-charcoal/60 font-medium">Full Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full bg-cream-light px-4 py-3 text-[13px] text-charcoal border border-transparent focus:outline-none focus:border-charcoal/20 transition-colors"
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-[11px] tracking-[0.1em] uppercase text-charcoal/60 font-medium">Email Address *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full bg-cream-light px-4 py-3 text-[13px] text-charcoal border border-transparent focus:outline-none focus:border-charcoal/20 transition-colors"
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-[11px] tracking-[0.1em] uppercase text-charcoal/60 font-medium">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full bg-cream-light px-4 py-3 text-[13px] text-charcoal border border-transparent focus:outline-none focus:border-charcoal/20 transition-colors"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-[11px] tracking-[0.1em] uppercase text-charcoal/60 font-medium">Message *</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full bg-cream-light px-4 py-3 text-[13px] text-charcoal border border-transparent focus:outline-none focus:border-charcoal/20 transition-colors resize-none"
                        placeholder="Tell us about your project or inquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full group inline-flex items-center justify-between bg-charcoal text-white px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-charcoal-light transition-colors duration-300 mt-4"
                    >
                      <span>Send Message</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mb-6">
                    <Mail size={24} className="text-sage-dark" />
                  </div>
                  <h3 className="font-serif text-2xl text-charcoal mb-4">Message Received</h3>
                  <p className="text-charcoal/60 text-sm max-w-xs mb-8">
                    Thank you for reaching out. A member of our team will get back to you within 24-48 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-[12px] tracking-[0.15em] uppercase text-charcoal/70 hover:text-charcoal border-b border-charcoal/30 pb-0.5 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
