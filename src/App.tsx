import './App.css'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Features from './components/Features'
import ProductGrid from './components/ProductGrid'
import Collections from './components/Collections'
import CreateDesign from './components/CreateDesign'
import Testimonials from './components/Testimonials'
import Newsletter from './components/Newsletter'
import Footer from './components/Footer'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
// ProtectedRoute is available at './components/ProtectedRoute' for future dashboard/designer routes

function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Marquee />
      <Features />
      <CreateDesign />
      <ProductGrid />
      <Collections />
      <Testimonials />
      <Newsletter />
      <Footer />
    </>
  )
}

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public: accessible without login */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  )
}

export default App

