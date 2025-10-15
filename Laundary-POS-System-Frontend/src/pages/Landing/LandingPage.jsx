import React, { useState } from 'react';
import Navigation from '../../components/landing/Navigation';
import Hero from '../../components/landing/Hero';
import About from '../../components/landing/About';
import WhyChooseUs from '../../components/landing/WhyChooseUs';
import Services from '../../components/landing/Services';
import Contact from '../../components/landing/Contact';
import Footer from '../../components/landing/Footer';
import PopupRegistrationForm from '../../components/landing/PopupRegistrationForm';

/**
 * Landing Page Component
 * Public-facing customer landing page for FoldFox Laundry
 * 
 * Features:
 * - Campaign-aware registration with student validation
 * - Smooth scrolling navigation
 * - Responsive design for all devices
 * - Integration with campaign config and student ID validator
 */
const LandingPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const handleOpenRegistration = () => {
    setIsRegistrationOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseRegistration = () => {
    setIsRegistrationOpen(false);
    // Re-enable body scroll when modal is closed
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation onRegisterClick={handleOpenRegistration} />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero onCTAClick={handleOpenRegistration} />

        {/* About Section */}
        <About />

        {/* Why Choose Us Section */}
        <WhyChooseUs />

        {/* Services Section */}
        <Services onRegisterClick={handleOpenRegistration} />

        {/* Contact Section */}
        <Contact />
      </main>

      {/* Footer */}
      <Footer />

      {/* Registration Form Modal */}
      <PopupRegistrationForm 
        isOpen={isRegistrationOpen} 
        onClose={handleCloseRegistration} 
      />
    </div>
  );
};

export default LandingPage;

