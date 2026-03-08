import './App.css'
import { Routes, Route } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/next"
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
import DesignerWorkspace from './pages/DesignerWorkspace'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import JournalPage from './pages/JournalPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'

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
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/journal" element={<JournalPage />} />
        
        {/* Protected Admin Routes */}
        <Route path="/designer" element={
          <ProtectedRoute requireAdmin={true}>
            <DesignerWorkspace />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
