import './App.css'
import { Routes, Route } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Features from './components/Features'
import ProductGrid from './components/ProductGrid'
import Collections from './components/Collections'
// Persistence: display saved designs on the home page
import Testimonials from './components/Testimonials'
import ImageMarquee from './components/ImageMarquee'
import Newsletter from './components/Newsletter'
import Footer from './components/Footer'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DesignerWorkspace from './pages/DesignerWorkspace'
import RoomConfigurator from './pages/RoomConfigurator'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import PastOrders from './pages/PastOrders'
import ProductsPage from './pages/ProductsPage'
import JournalPage from './pages/JournalPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import MyDesigns from './pages/MyDesigns'

function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Marquee />
      <Features />
      <ProductGrid />
      <Collections />
      <Testimonials />
      <ImageMarquee />
      <Newsletter />
      <Footer />
    </>
  )
}

function App() {
  return (
    <div className="min-h-screen">
      <Analytics />
      <Routes>
        {/* Public: accessible without login */}
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Protected Customer Routes */}
        <Route path="/orders" element={
          <ProtectedRoute>
            <PastOrders />
          </ProtectedRoute>
        } />
        <Route path="/my-designs" element={
          <ProtectedRoute>
            <MyDesigns />
          </ProtectedRoute>
        } />

        {/* Protected Customer Routes: Designer */}
        <Route path="/configure" element={
          <ProtectedRoute requireAdmin={true}>
            <RoomConfigurator />
          </ProtectedRoute>
        } />
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
