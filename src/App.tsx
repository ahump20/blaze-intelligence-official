import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { trackPageView } from './utils/analytics';
import { Auth0Provider } from '@auth0/auth0-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Components
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Features from './components/Features';
import SportsAnalytics from './components/SportsAnalytics';
import TechnologyStack from './components/TechnologyStack';
import DemoSection from './components/DemoSection';
import PricingSection from './components/PricingSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

// Enhanced Components
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import UserProfile from './components/UserProfile';
import SubscriptionManager from './components/SubscriptionManager';
import RealTimeUpdates from './components/RealTimeUpdates';
import CognitivePerformanceDashboard from './components/CognitivePerformanceDashboard';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { SportsDataProvider } from './contexts/SportsDataContext';

// Initialize services
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

const auth0Config = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN!,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID!,
  authorizationParams: {
    redirect_uri: window.location.origin,
    scope: 'openid profile email',
  },
};

// Page tracking component
const PageTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
};

function App() {
  return (
    <HelmetProvider>
      <Auth0Provider {...auth0Config}>
        <QueryClientProvider client={queryClient}>
          <Elements stripe={stripePromise}>
            <AuthProvider>
              <SportsDataProvider>
                <Router>
                  <div className="min-h-screen bg-gray-50">
                    <PageTracker />
                    <Navigation />
                    <RealTimeUpdates />
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
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/analytics" element={<SportsAnalytics />} />
                      <Route path="/demo" element={<DemoSection />} />
                      <Route path="/contact" element={<ContactSection />} />
                      <Route path="/profile" element={<UserProfile />} />
                      <Route path="/subscription" element={<SubscriptionManager />} />
                      <Route path="/cognitive" element={<CognitivePerformanceDashboard />} />
                    </Routes>
                    <AIChat />
                    <Toaster
                      position="bottom-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                      }}
                    />
                  </div>
                </Router>
              </SportsDataProvider>
            </AuthProvider>
          </Elements>
        </QueryClientProvider>
      </Auth0Provider>
    </HelmetProvider>
  );
}

export default App;
