import { Sparkles, Users, Award, TrendingUp } from 'lucide-react';

/**
 * About Section Component
 * Tells the story of FoldFox Laundry
 */
const About = () => {
  const stats = [
    { icon: Users, value: "500+", label: "Happy Customers" },
    { icon: Award, value: "100%", label: "Quality Guaranteed" },
    { icon: TrendingUp, value: "24hrs", label: "Fast Turnaround" },
    { icon: Sparkles, value: "5 Star", label: "Service Rating" },
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-orange text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase leading-relaxed mb-4 sm:mb-6">
            About Us
          </h2>
          
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-navy text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-3 sm:mb-4 tracking-tight px-4 sm:px-0">
              Your trusted laundry partner near SLIIT Campus
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Smart laundry solutions for busy students and professionals
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16">
          
          {/* Story */}
          <div className="space-y-4 sm:space-y-6 order-2 md:order-1">
            <h3 className="text-xl sm:text-2xl font-bold text-navy">
              Smart Laundry Solutions for Busy Students
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              At FoldFox Laundry, we understand the challenges students face managing 
              their laundry while focusing on academics. That's why we've created a 
              convenient, affordable, and reliable laundry service just 300m from SLIIT Campus.
            </p>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Our state-of-the-art facility uses modern washing technology and eco-friendly 
              detergents to ensure your clothes are cleaned to perfection. With our new 
              POS system, tracking your orders has never been easier!
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Certified Quality</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Eco-Friendly</span>
              </div>
            </div>
          </div>

          {/* About Image */}
          <div className="relative order-1 md:order-2">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange/10 to-navy/10 flex items-center justify-center overflow-hidden shadow-2xl">
              <img 
                src="/about.webp" 
                alt="Professional laundry service with modern washing machine and organized folded clothes" 
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="text-center p-8">
                      <div class="text-5xl sm:text-6xl mb-4">🧺</div>
                      <p class="text-sm sm:text-base text-gray-500">Professional Laundry Service</p>
                    </div>
                  `;
                }}
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-orange/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-20 h-20 sm:w-32 sm:h-32 bg-navy/20 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border-2 border-navy/20 hover:border-orange/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full"
            >
              <div className="flex justify-center mb-2 sm:mb-4">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-navy group-hover:text-orange transition-colors duration-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-navy mb-1 sm:mb-2 group-hover:text-navy/90 transition-colors duration-300">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;

