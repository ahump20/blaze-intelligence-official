import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Features from './components/Features';
import SportsAnalytics from './components/SportsAnalytics';
import TechnologyStack from './components/TechnologyStack';
import DemoSection from './components/DemoSection';
import PricingSection from './components/PricingSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <Features />
              <SportsAnalytics />
              <TechnologyStack />
              <DemoSection />
              <PricingSection />
              <ContactSection />
              <Footer />
            </>
          } />
          <Route path="/analytics" element={<SportsAnalytics />} />
          <Route path="/demo" element={<DemoSection />} />
          <Route path="/contact" element={<ContactSection />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
