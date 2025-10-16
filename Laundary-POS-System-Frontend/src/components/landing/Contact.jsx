import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Facebook,
  Instagram,
  MessageCircle
} from 'lucide-react';

/**
 * Contact Section Component
 * Displays contact information and location
 */
const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      detail: "300m from SLIIT Campus, Malabe",
      subdetail: "Easy walking distance from campus gate",
      onClick: () => {
        // Could open map or scroll to map section
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      icon: Phone,
      title: "Phone",
      detail: "070 700 6557",
      subdetail: "Call us anytime for inquiries",
      onClick: () => window.open('tel:+94707006557', '_self')
    },
    {
      icon: Mail,
      title: "Email",
      detail: "contact.foldfox@gmail.com",
      subdetail: "We'll respond within 24 hours",
      onClick: () => window.open('mailto:contact.foldfox@gmail.com', '_self')
    },
    {
      icon: Clock,
      title: "Working Hours",
      detail: "Mon - Sat: 7:00 AM - 8:00 PM",
      subdetail: "Sunday: 8:00 AM - 6:00 PM",
      onClick: () => {
        // Could show working hours popup or just do nothing
        console.log('Working hours clicked');
      }
    }
  ];

  const socialLinks = [
    {
      icon: Facebook,
      name: "Facebook",
      url: "https://web.facebook.com/profile.php?id=61579580631873",
      color: "hover:bg-blue-600"
    },
    {
      icon: Instagram,
      name: "Instagram",
      url: "#",
      color: "hover:bg-pink-600"
    },
    {
      icon: MessageCircle,
      name: "WhatsApp",
      url: "https://wa.me/94707006557",
      color: "hover:bg-green-600"
    }
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-orange text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase leading-relaxed mb-4 sm:mb-6">
            Contact & Order
          </h2>
          
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-navy text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-3 sm:mb-4 tracking-tight px-4 sm:px-0">
              Ready to place an order?
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Order via call/WhatsApp or walk into our store. We're here to make your life easier!
            </p>
          </div>
        </div>

        {/* How to Order - Prominent Section */}
        <div className="bg-gradient-to-br from-orange/10 via-orange/5 to-blue/10 border-2 border-orange/30 rounded-2xl p-6 sm:p-8 mb-12 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-bold text-navy mb-6 text-center flex items-center justify-center gap-2">
            <span className="text-2xl">🛒</span>
            3 Easy Ways to Order
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Method 1: Call */}
            <div className="bg-white rounded-xl p-5 border-2 border-orange/20 hover:border-orange hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-orange rounded-full flex items-center justify-center mb-3 shadow-lg">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <h4 className="font-bold text-navy mb-2 text-lg">1. Call Us</h4>
                <p className="text-sm text-gray-600 mb-3">Quick & easy phone ordering</p>
                <a 
                  href="tel:+94707006557"
                  className="w-full bg-orange text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-orange/90 transition-all"
                >
                  070 700 6557
                </a>
                <p className="text-xs text-gray-500 mt-2">FREE pickup arranged</p>
              </div>
            </div>

            {/* Method 2: WhatsApp */}
            <div className="bg-white rounded-xl p-5 border-2 border-green-500/20 hover:border-green-500 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <h4 className="font-bold text-navy mb-2 text-lg">2. WhatsApp</h4>
                <p className="text-sm text-gray-600 mb-3">Message us your order</p>
                <a 
                  href="https://wa.me/94707006557"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all"
                >
                  Chat Now
                </a>
                <p className="text-xs text-gray-500 mt-2">Quick responses</p>
              </div>
            </div>

            {/* Method 3: Walk-in */}
            <div className="bg-white rounded-xl p-5 border-2 border-blue-500/20 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h4 className="font-bold text-navy mb-2 text-lg">3. Walk In</h4>
                <p className="text-sm text-gray-600 mb-3">Visit our store directly</p>
                <div className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-center">
                  300m from SLIIT
                </div>
                <p className="text-xs text-gray-500 mt-2">No pickup needed</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 text-center bg-white/50 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              💡 <strong>Note:</strong> Already registered? Just call or WhatsApp with your phone number and order details. 
              We'll handle the rest - pickup, washing, and delivery!
            </p>
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {contactInfo.map((info, index) => (
            <div 
              key={index}
              onClick={info.onClick}
              className="text-center p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border-2 border-navy/20 hover:border-orange/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full"
            >
              <div className="mb-3 sm:mb-4">
                <div className="flex justify-center">
                  <info.icon className="w-5 h-5 sm:w-6 sm:h-6 text-navy group-hover:text-orange transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-navy mb-2 group-hover:text-navy/90 transition-colors duration-300">
                {info.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-900 font-medium mb-1">
                {info.detail}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                {info.subdetail}
              </p>
            </div>
          ))}
        </div>

        {/* Map and Social Section */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
          
          {/* Map Placeholder */}
          <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-gray-200 h-64 sm:h-80">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.798467600348!2d79.9729!3d6.9147!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae256db1a6771c5%3A0x2c63e344ab9a7536!2sSri%20Lanka%20Institute%20of%20Information%20Technology!5e0!3m2!1sen!2slk!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="FoldFox Laundry Location"
            ></iframe>
          </div>

          {/* Social and CTA */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-navy mb-3 sm:mb-4">
                Connect With Us
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Follow us on social media for updates, special offers, and laundry tips!
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-navy text-white ${social.color} transition-all duration-300 hover:scale-110`}
                    aria-label={social.name}
                  >
                    <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Order Now Quick Card */}
            <div className="bg-gradient-to-br from-orange/10 to-navy/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-orange/30 shadow-lg">
              <h4 className="text-base sm:text-lg font-bold text-navy mb-2 sm:mb-3 flex items-center gap-2">
                <span className="text-xl">🚀</span>
                Place Your Order Now!
              </h4>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Choose your preferred method - we offer pickup & delivery or walk-in service!
              </p>
              
              {/* Ordering Methods */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-6 h-6 bg-orange/20 rounded-full flex items-center justify-center">
                    <Phone className="w-3 h-3 text-orange" />
                  </div>
                  <span><strong>Call:</strong> We arrange FREE pickup</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <span><strong>WhatsApp:</strong> Send order details</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-blue-600" />
                  </div>
                  <span><strong>Walk-in:</strong> Bring clothes directly</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <a 
                  href="tel:+94707006557"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange to-orange/90 hover:from-orange/90 hover:to-orange/80 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold border border-orange/30 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Button Background Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
                  
                  <span className="relative z-10 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Call to Order
                  </span>
                  
                  {/* Subtle Inner Highlight */}
                  <div className="absolute inset-0 rounded-lg border border-white/20 pointer-events-none"></div>
                </a>
                <a 
                  href="https://wa.me/94707006557?text=Hi%20FoldFox%20Laundry!%20I'd%20like%20to%20place%20an%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-600/90 hover:from-green-600/90 hover:to-green-600/80 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold border border-green-600/30 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Button Background Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
                  
                  <span className="relative z-10 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Order
                  </span>
                  
                  {/* Subtle Inner Highlight */}
                  <div className="absolute inset-0 rounded-lg border border-white/20 pointer-events-none"></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

