import { 
  Shield, 
  Clock, 
  DollarSign, 
  Smartphone, 
  Truck, 
  Heart,
  Zap,
  CheckCircle2
} from 'lucide-react';

/**
 * Why Choose Us Section Component
 * Highlights key benefits and features
 */
const WhyChooseUs = () => {
  const benefits = [
    {
      icon: Truck,
      title: "Free Pickup & Delivery",
      description: "We come to you! Free pickup and delivery service within campus area.",
      color: "blue"
    },
    {
      icon: Heart,
      title: "Special Care for Girls' Clothes",
      description: "Separate washing and extra care for delicate garments. Safer and more hygienic!",
      color: "pink"
    },
    {
      icon: Clock,
      title: "24-Hour Express Service",
      description: "Need it fast? Our express service gets your laundry done in 24 hours.",
      color: "green"
    },
    {
      icon: DollarSign,
      title: "Student-Friendly Pricing",
      description: "Affordable rates designed specifically for students. Quality service, budget prices!",
      color: "orange"
    },
    {
      icon: Smartphone,
      title: "Smart POS System",
      description: "Track your orders in real-time with our modern POS system. Transparent and efficient!",
      color: "purple"
    },
    {
      icon: Shield,
      title: "100% Quality Guarantee",
      description: "We stand behind our work. If you're not satisfied, we'll rewash for free!",
      color: "red"
    },
    {
      icon: Zap,
      title: "Eco-Friendly Products",
      description: "We use environmentally friendly detergents that are gentle on clothes and nature.",
      color: "teal"
    },
    {
      icon: CheckCircle2,
      title: "Convenient Location",
      description: "Just 300m from SLIIT Campus. Drop off on your way to class!",
      color: "indigo"
    }
  ];

  const colorClasses = {
    blue: "bg-gradient-to-br from-navy/10 to-navy/15 border-2 border-navy/20 hover:from-navy/15 hover:to-navy/20 hover:border-navy/30 transition-all duration-300",
    pink: "bg-gradient-to-br from-orange/10 to-orange/15 border-2 border-orange/30 hover:from-orange/15 hover:to-orange/20 hover:border-orange/40 transition-all duration-300",
    green: "bg-gradient-to-br from-navy/10 to-navy/15 border-2 border-navy/25 hover:from-navy/15 hover:to-navy/20 hover:border-navy/35 transition-all duration-300",
    orange: "bg-gradient-to-br from-orange/10 to-orange/15 border-2 border-orange/40 hover:from-orange/15 hover:to-orange/20 hover:border-orange/50 transition-all duration-300",
    purple: "bg-gradient-to-br from-navy/10 to-navy/15 border-2 border-navy/30 hover:from-navy/15 hover:to-navy/20 hover:border-navy/40 transition-all duration-300",
    red: "bg-gradient-to-br from-orange/10 to-orange/15 border-2 border-orange/35 hover:from-orange/15 hover:to-orange/20 hover:border-orange/45 transition-all duration-300",
    teal: "bg-gradient-to-br from-navy/10 to-navy/15 border-2 border-navy/20 hover:from-navy/15 hover:to-navy/20 hover:border-navy/30 transition-all duration-300",
    indigo: "bg-gradient-to-br from-orange/10 to-orange/15 border-2 border-orange/25 hover:from-orange/15 hover:to-orange/20 hover:border-orange/35 transition-all duration-300",
  };

  const iconColorClasses = {
    blue: "text-navy",
    pink: "text-orange",
    green: "text-navy",
    orange: "text-orange",
    purple: "text-navy",
    red: "text-orange",
    teal: "text-navy",
    indigo: "text-orange",
  };

  return (
    <section id="why-choose-us" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-orange text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase leading-relaxed mb-4 sm:mb-6">
            Why Choose Us
          </h2>
          
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-navy text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-3 sm:mb-4 tracking-tight px-4 sm:px-0">
              We're not just another laundry service
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Discover what makes FoldFox the preferred choice for students
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className={`p-5 sm:p-6 rounded-xl sm:rounded-2xl ${colorClasses[benefit.color]} group cursor-pointer`}
            >
              <div className="mb-3 sm:mb-4">
                <div className="flex justify-center">
                  <benefit.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColorClasses[benefit.color]} group-hover:scale-110 transition-transform duration-300`} />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-navy mb-2 text-center group-hover:text-navy/90 transition-colors duration-300">
                {benefit.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed text-center group-hover:text-gray-700 transition-colors duration-300">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

       
      </div>
    </section>
  );
};

export default WhyChooseUs;

