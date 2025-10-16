import { useState } from 'react';
import { X, User, Mail, Phone, MapPin, GraduationCap, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Check, Gift } from 'lucide-react';
import { isCampaignActive } from '../../config/campaign';
import campaignConfig from '../../config/campaign';
import { formatStudentId } from '../../utils/studentIdValidator';
import { customerService } from '../../services/customerService';
import ErrorModal from './ErrorModal';

const Button = ({ children, onClick, disabled, isLoading, variant = 'primary', className = '' }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-orange text-white hover:bg-orange/90 hover:shadow-lg hover:-translate-y-0.5",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

const PopupRegistrationForm = ({ isOpen = true, onClose = () => {} }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [discountData, setDiscountData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    isStudent: false,
    university: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    studentId: ''
  });
  
  // Error handling state
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const steps = [
    { id: 1, title: "Personal", icon: User, fields: ['fullName'] },
    { id: 2, title: "Contact", icon: Mail, fields: ['phone', 'email'] },
    { id: 3, title: "Address", icon: MapPin, fields: ['streetAddress', 'city'] },
    { id: 4, title: "Student", icon: GraduationCap, fields: ['isStudent'] },
    { id: 5, title: "Review", icon: CheckCircle, fields: [] }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle student ID with auto-formatting
    if (name === 'studentId') {
      const formattedId = formatStudentId(value);
      setFormData(prev => ({ ...prev, [name]: formattedId }));
    }
    // Handle other inputs normally
    else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().length > 0;
      case 2:
        // Phone is required, email is optional (but must be valid if provided)
        const phoneValid = formData.phone.trim().length >= 10;
        const emailValid = !formData.email || formData.email.trim() === '' || formData.email.includes('@');
        return phoneValid && emailValid;
      case 3:
        // Address is now optional - allow skipping
        return true;
      case 4:
        // If student, must have student ID
        return !formData.isStudent || (formData.studentId.trim().length > 0);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 6 && isStepValid()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId) => {
    if (stepId <= currentStep || completedSteps.includes(stepId - 1)) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = async (isRetry = false) => {
    setIsLoading(true);
    setErrorMessage(''); // Clear previous errors
    
    // Increment retry count if this is a retry
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    }
    
    try {
      // Get campaign code if campaign is active
      const campaignCode = isCampaignActive() ? campaignConfig.campaignCode : null;
      
      // Prepare registration data
      const registrationData = {
        fullName: formData.fullName,
        phone: formData.phone,
        phoneNumber: formData.phone, // Backend uses phoneNumber
        email: formData.email || undefined,
        address: {
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        isStudent: formData.isStudent,
        studentId: formData.isStudent ? formData.studentId : null,
        university: formData.isStudent ? formData.university : null,
        campaignCode: campaignCode
      };

      // Call backend API with retry support (max 3 attempts)
      const result = await customerService.registerFromLanding(registrationData, 3);

      if (result.success) {
        // Store discount data for success screen
        setDiscountData(result.customer.discountInfo);
        
        // Reset error state and retry count
        setErrorMessage('');
        setRetryCount(0);
        
        // Show success step
        setRegistrationSuccess(true);
        setCurrentStep(6); // Move to success step
        
      } else {
        // Show user-friendly error in modal
        setErrorMessage(result.error || 'Registration failed. Please check your information and try again.');
        setShowErrorModal(true);
      }
      
    } catch (error) {
      // Network or server error
      console.error('Registration error:', error);
      setErrorMessage('Unable to connect to server. Please check your internet connection and try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRetry = () => {
    setShowErrorModal(false);
    // Small delay before retrying
    setTimeout(() => {
      handleSubmit(true);
    }, 500);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange/20 to-orange/10 mb-2 sm:mb-4">
                <User className="w-7 h-7 sm:w-10 sm:h-10 text-orange" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">What's your name?</h3>
              <p className="text-xs sm:text-base text-gray-500">This helps us personalize your experience</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange focus:ring-4 focus:ring-orange/10 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base sm:text-lg"
                placeholder="John Doe"
                autoFocus
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange/20 to-orange/10 mb-2 sm:mb-4">
                <Mail className="w-7 h-7 sm:w-10 sm:h-10 text-orange" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">How can we reach you?</h3>
              <p className="text-xs sm:text-base text-gray-500">We'll send order updates to these contacts</p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange focus:ring-4 focus:ring-orange/10 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base sm:text-lg"
                    placeholder="0707006557 (10-15 digits)"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Required for order placement and SMS updates</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Email Address <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange focus:ring-4 focus:ring-orange/10 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base sm:text-lg"
                    placeholder="customer@example.com"
                  />
                </div>
                <p className="text-xs text-blue-600 mt-1 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                  💡 Optional but recommended for email receipts and confirmations
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange/20 to-orange/10 mb-2 sm:mb-4">
                <MapPin className="w-7 h-7 sm:w-10 sm:h-10 text-orange" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Where should we deliver?</h3>
              <p className="text-xs sm:text-base text-gray-500">
                <span className="text-gray-400">(Optional)</span> - Provide now or later when ordering
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-800 text-center">
                💡 <strong>You can skip this!</strong> Provide your address when placing orders that need pickup/delivery.
              </p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Street Address <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange focus:ring-4 focus:ring-orange/10 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base sm:text-lg"
                  placeholder="e.g., Room 305, SLIIT Hostel, Malabe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    City <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange focus:ring-4 focus:ring-orange/10 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base sm:text-lg"
                    placeholder="Colombo"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Zip Code <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange focus:ring-4 focus:ring-orange/10 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base sm:text-lg"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange/20 to-orange/10 mb-2 sm:mb-4">
                <GraduationCap className="w-7 h-7 sm:w-10 sm:h-10 text-orange" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Are you a student?</h3>
              <p className="text-xs sm:text-base text-gray-500">Get exclusive student discounts and offers</p>
            </div>
            
            <div className="space-y-5">
              <label className="relative flex items-start p-5 rounded-2xl border-2 border-gray-200 hover:border-orange/50 transition-all duration-200 cursor-pointer group bg-white hover:bg-orange/5">
                <input
                  type="checkbox"
                  name="isStudent"
                  checked={formData.isStudent}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-orange border-gray-300 rounded focus:ring-orange/50 focus:ring-2 cursor-pointer"
                />
                <div className="ml-4 flex-1">
                  <span className="text-base font-semibold text-gray-900 block group-hover:text-orange transition-colors">
                    Yes, I'm currently a student
                  </span>
                  <span className="text-sm text-gray-500 mt-1 block">
                    Unlock special pricing and student benefits
                  </span>
                </div>
                {formData.isStudent && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </label>
              
              {formData.isStudent && (
                <div className="space-y-3 sm:space-y-4 pt-2 animate-fade-in">
                  {/* Student ID Only - Simple */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      Student ID Number
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange focus:ring-4 focus:ring-orange/10 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base sm:text-lg font-mono"
                      placeholder="Enter your student ID"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-500/20 to-green-500/10 mb-2 sm:mb-4">
                <CheckCircle className="w-7 h-7 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Almost there!</h3>
              <p className="text-xs sm:text-base text-gray-500">Review your information before submitting</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 space-y-4 sm:space-y-5">
              <div>
                <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 sm:py-2">
                    <span className="text-xs sm:text-sm text-gray-600">Name</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2">
                    <span className="text-xs sm:text-sm text-gray-600">Phone</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2">
                    <span className="text-xs sm:text-sm text-gray-600">Email</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right break-all">{formData.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 sm:pt-5">
                <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Delivery Address</h4>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{formData.streetAddress}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{formData.city}, {formData.zipCode || 'N/A'}</p>
                </div>
              </div>
              
              {formData.isStudent && (
                <div className="border-t border-gray-200 pt-4 sm:pt-5">
                  <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Student Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 sm:py-2">
                      <span className="text-xs sm:text-sm text-gray-600">Student ID</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right font-mono">{formData.studentId}</span>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs sm:text-sm text-blue-900">
                      <span className="font-semibold">Student status verified.</span> Discount will be applied at checkout in our POS system.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        // Success Screen
        return (
          <div className="space-y-6 animate-fade-in text-center py-8">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-14 h-14 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange flex items-center justify-center animate-bounce">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h3 className="text-3xl font-bold text-navy mb-3">
                Registration Successful!
              </h3>
              <p className="text-lg text-gray-600 mb-2">
                Welcome to FoldFox Laundry, {formData.fullName}!
              </p>
            </div>

            {/* Discount Information */}
            {discountData && discountData.percentage > 0 && (
              <div className="bg-gradient-to-br from-orange/10 via-orange/5 to-orange/10 border-2 border-orange/30 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Gift className="w-8 h-8 text-orange" />
                  <h4 className="text-xl font-bold text-navy">Special Discount Unlocked!</h4>
                </div>
                
                <div className="bg-white rounded-xl p-4 mb-4">
                  <div className="text-5xl font-black text-orange mb-2">
                    {discountData.percentage}% OFF
                  </div>
                  <div className="text-navy font-bold text-lg mb-1">
                    {discountData.description}
                  </div>
                  <div className="text-sm text-gray-600">
                    {discountData.isOneTime 
                      ? '✨ Applied automatically on your first order' 
                      : '🎓 Applied to all your orders'}
                  </div>
                </div>

                {/* Future Discount (if student) */}
                {formData.isStudent && discountData.type === 'campaign' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Bonus:</span> After your first order, you'll continue to receive 10% student discount on all future orders! 🎓
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps - How to Place Orders */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
              <h4 className="font-bold text-navy mb-3 text-lg flex items-center gap-2">
                📱 How to Place Your Order
              </h4>
              <div className="space-y-3">
                {/* Option 1: Call or WhatsApp */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-orange">
                  <h5 className="font-bold text-orange mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Option 1: Call or WhatsApp Us
                  </h5>
                  <ul className="text-left space-y-1.5 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Call <strong className="text-orange">070 700 6557</strong> to place your order</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>WhatsApp us with your order details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>We'll arrange <strong>FREE pickup</strong> from your location!</span>
                    </li>
                  </ul>
                </div>

                {/* Option 2: Walk-in */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                  <h5 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Option 2: Visit Our Store
                  </h5>
                  <ul className="text-left space-y-1.5 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Walk into our store (300m from SLIIT gate)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Bring your clothes and mention your phone number</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Your discount applies automatically!</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <a 
                  href="tel:+94707006557"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-orange text-white px-4 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Phone className="w-4 h-4" />
                  Call to Order Now
                </a>
                <a 
                  href="https://wa.me/94707006557"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="text-lg">💬</span>
                  WhatsApp Order
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  // Reset form
                  setFormData({
                    fullName: '',
                    phone: '',
                    email: '',
                    isStudent: false,
                    university: '',
                    streetAddress: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    studentId: ''
                  });
                  setCurrentStep(1);
                  setCompletedSteps([]);
                  setRegistrationSuccess(false);
                  setDiscountData(null);
                  onClose();
                }}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden">
        {/* Header with Modern Progress */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
          >
            <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
          
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Join FoldFox</h2>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm">
              {currentStep === 6 ? 'Registration Complete!' : `Complete your registration in ${5 - currentStep + 1} easy steps`}
            </p>
          </div>
          
          {/* Enhanced Step Navigation */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id) || currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= currentStep || completedSteps.includes(step.id - 1);
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={!isAccessible}
                    className={`relative flex flex-col items-center w-full group ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 mb-1 sm:mb-2 ${
                      isCompleted 
                        ? 'bg-orange text-white shadow-lg shadow-orange/30' 
                        : isCurrent 
                        ? 'bg-white text-orange shadow-lg' 
                        : 'bg-white/10 text-white/40'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      ) : (
                        <step.icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-medium transition-colors hidden sm:block ${
                      isCurrent ? 'text-white' : 'text-white/50'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 sm:mx-2 transition-all duration-500 ${
                      isCompleted ? 'bg-orange' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8 pb-6 sm:pb-8 overflow-y-auto max-h-[calc(98vh-280px)] sm:max-h-[calc(95vh-300px)]">
          {renderStepContent()}
        </div>
        
        {/* Footer */}
        {/* Footer Buttons (Hide on success screen) */}
        {currentStep !== 6 && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center gap-3 sm:gap-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 ${
                  currentStep === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              
              {currentStep === 5 ? (
                <Button
                  onClick={handleSubmit}
                  isLoading={isLoading}
                  className="px-5 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base"
                >
                  {isLoading ? 'Submitting...' : 'Complete Registration'}
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="px-5 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      
      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onRetry={handleRetry}
        errorMessage={errorMessage}
        title="Registration Failed"
        showRetry={retryCount < 3}
      />
    </div>
  );
};

export default PopupRegistrationForm;