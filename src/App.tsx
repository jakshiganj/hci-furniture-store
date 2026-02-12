import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Features from './components/Features'
import ProductGrid from './components/ProductGrid'
import Collections from './components/Collections'
import Testimonials from './components/Testimonials'
import Newsletter from './components/Newsletter'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Marquee />
      <Features />
      <ProductGrid />
      <Collections />
      <Testimonials />
      <Newsletter />
      <Footer />
    </div>
  )
}

export default App
