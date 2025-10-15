/**
 * ============================================================================
 * Registration Validation Middleware
 * ============================================================================
 * 
 * Specific validation for public landing page registration
 * Prevents invalid data from reaching the database layer
 * 
 */

/**
 * Validate and normalize phone number
 * Accepts various formats and normalizes to digits only
 */
const validatePhoneNumber = (req, res, next) => {
  const phone = req.body.phone || req.body.phoneNumber;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  // Remove all non-digit characters
  const normalizedPhone = phone.toString().replace(/\D/g, '');
  
  // Validate length (10-15 digits)
  if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid phone number (10-15 digits)'
    });
  }
  
  // Normalize phone number in request body
  req.body.phoneNumber = normalizedPhone;
  delete req.body.phone; // Remove non-normalized version
  
  next();
};

/**
 * Validate email format (if provided)
 * Email is optional but must be valid if present
 */
const validateEmail = (req, res, next) => {
  const email = req.body.email;
  
  // Email is optional
  if (!email || email.trim() === '') {
    delete req.body.email; // Remove empty email
    return next();
  }
  
  // Validate email format
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  // Normalize email to lowercase
  req.body.email = email.trim().toLowerCase();
  
  next();
};

/**
 * Validate required fields for registration
 */
const validateRequiredFields = (req, res, next) => {
  const { fullName } = req.body;
  
  if (!fullName || fullName.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Full name is required'
    });
  }
  
  // Validate name length
  if (fullName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Full name must be at least 2 characters'
    });
  }
  
  if (fullName.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Full name cannot exceed 100 characters'
    });
  }
  
  // Trim full name
  req.body.fullName = fullName.trim();
  
  next();
};

/**
 * Validate student information (if provided)
 */
const validateStudentInfo = (req, res, next) => {
  const { isStudent, studentId } = req.body;
  
  // If marked as student, student ID is required
  if (isStudent === true || isStudent === 'true') {
    if (!studentId || studentId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required for student registration'
      });
    }
    
    // Normalize student ID
    req.body.studentId = studentId.trim().toUpperCase();
  }
  
  next();
};

/**
 * Sanitize request body to prevent injection attacks
 */
const sanitizeInput = (req, res, next) => {
  const { fullName, email, studentId, university, address } = req.body;
  
  // Remove any potential script tags or dangerous characters
  const sanitize = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  };
  
  if (fullName) req.body.fullName = sanitize(fullName);
  if (email) req.body.email = sanitize(email);
  if (studentId) req.body.studentId = sanitize(studentId);
  if (university) req.body.university = sanitize(university);
  
  // Sanitize address fields if present
  if (address && typeof address === 'object') {
    if (address.street) req.body.address.street = sanitize(address.street);
    if (address.city) req.body.address.city = sanitize(address.city);
    if (address.state) req.body.address.state = sanitize(address.state);
    if (address.zipCode) req.body.address.zipCode = sanitize(address.zipCode);
  }
  
  next();
};

/**
 * Combined validation middleware for registration
 * Use this for the public registration endpoint
 */
const validateRegistration = [
  sanitizeInput,
  validateRequiredFields,
  validatePhoneNumber,
  validateEmail,
  validateStudentInfo
];

module.exports = {
  validatePhoneNumber,
  validateEmail,
  validateRequiredFields,
  validateStudentInfo,
  sanitizeInput,
  validateRegistration
};

