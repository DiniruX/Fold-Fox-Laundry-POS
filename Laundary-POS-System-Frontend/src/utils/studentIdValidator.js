/**
 * ============================================================================
 * Student ID Validator - Universities Around Malabe
 * ============================================================================
 * 
 * Validates student IDs for universities near SLIIT Malabe campus:
 * - SLIIT (Sri Lanka Institute of Information Technology)
 * - CINEC Campus (Colombo International Nautical and Engineering College)
 * - Horizon Campus
 * - KIU (Kaatsu International University)
 * 
 * ============================================================================
 */

/**
 * University Student ID Patterns
 * Each university has specific formats based on faculty/program codes
 */
const UNIVERSITY_PATTERNS = {
  'SLIIT': {
    name: 'SLIIT',
    patterns: [
      // Old Format: IT20XXXXX (2-3 letter prefix + 2 digit year + 5 digits)
      /^(IT|BM|ENG|EN|ARC)[0-9]{2}[0-9]{5}$/i,
      // New Format: SA24XXXXXX (2 letter prefix + 2 digit year + 6+ digits)
      /^(SA)[0-9]{2}[0-9]{6,}$/i
    ],
    examples: [
      'IT2012345 (Computing)',
      'BM2112345 (Business)',
      'ENG2212345 (Engineering)',
      'SA24123456 (New Format)'
    ],
    description: 'Format: Prefix + Year + Number (e.g., IT2012345 or SA24123456)'
  },
  
  'CINEC Campus': {
    name: 'CINEC Campus',
    patterns: [
      // Format: MM231045 (2-3 letter prefix + 2 digit year + 4+ digits)
      /^(MM|MS|ME|MR|ET|EN|MG|MT)[0-9]{2}[0-9]{4,}$/i
    ],
    examples: [
      'MM231045 (Maritime)',
      'ME241234 (Marine Engineering)',
      'EN231234 (Engineering)',
      'MG241234 (Management)'
    ],
    description: 'Format: Prefix + Year + Number (e.g., MM231045)'
  },
  
  'Horizon Campus': {
    name: 'Horizon Campus',
    patterns: [
      // Format: IT231234 (2 letter prefix + 2 digit year + 4+ digits)
      /^(IT|MN|MG|SC|ED)[0-9]{2}[0-9]{4,}$/i
    ],
    examples: [
      'IT231234 (IT)',
      'MN241234 (Management)',
      'SC231234 (Science)',
      'ED241234 (Education)'
    ],
    description: 'Format: Prefix + Year + Number (e.g., IT231234)'
  },
  
  'KIU': {
    name: 'KIU (Kaatsu International University)',
    patterns: [
      // Format: NU220567 (2-3 letter prefix + 2 digit year + 4+ digits)
      /^(NU|HS|BS|MT|CP|CS)[0-9]{2}[0-9]{4,}$/i
    ],
    examples: [
      'NU220567 (Nursing)',
      'HS231234 (Health Science)',
      'MT241234 (Management)',
      'CP231234 (Computing)'
    ],
    description: 'Format: Prefix + Year + Number (e.g., NU220567)'
  },
  
  'University of Colombo': {
    name: 'University of Colombo',
    patterns: [
      // General university format
      /^[A-Z]{2,4}\/[0-9]{4}\/[0-9]{3,}$/i, // Format: DEPT/YEAR/NUMBER
      /^[0-9]{8,10}$/i // Simple numeric format
    ],
    examples: [
      'UCSC/2023/001',
      '2023001234'
    ],
    description: 'Format varies by faculty'
  },
  
  'University of Moratuwa': {
    name: 'University of Moratuwa',
    patterns: [
      // Engineering format
      /^[0-9]{6}[A-Z]$/i, // Format: YYXXXX + Letter (e.g., 200123A)
      /^[0-9]{8,10}$/i // Numeric format
    ],
    examples: [
      '200123A',
      '20231234'
    ],
    description: 'Format varies by faculty'
  },
  
  'Other': {
    name: 'Other University',
    patterns: [
      // Accept any reasonable student ID format
      /^[A-Z0-9\/\-]{6,15}$/i
    ],
    examples: [
      'Any format accepted'
    ],
    description: 'Enter your student ID as shown on your ID card'
  }
};

/**
 * Validate student ID based on selected university
 * @param {string} studentId - The student ID to validate
 * @param {string} university - The selected university name
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateStudentId = (studentId, university) => {
  // Remove whitespace and convert to uppercase for validation
  const cleanId = studentId.trim().toUpperCase();
  
  // Check if ID is empty
  if (!cleanId) {
    return {
      isValid: false,
      message: 'Student ID is required'
    };
  }
  
  // Check if ID is too short
  if (cleanId.length < 6) {
    return {
      isValid: false,
      message: 'Student ID must be at least 6 characters'
    };
  }
  
  // Get patterns for selected university
  const universityConfig = UNIVERSITY_PATTERNS[university];
  
  if (!universityConfig) {
    // If university not in our list, accept any reasonable format
    if (/^[A-Z0-9\/\-]{6,15}$/i.test(cleanId)) {
      return { isValid: true, message: '' };
    }
    return {
      isValid: false,
      message: 'Invalid student ID format'
    };
  }
  
  // Check against all patterns for the university
  const isValid = universityConfig.patterns.some(pattern => pattern.test(cleanId));
  
  if (isValid) {
    return {
      isValid: true,
      message: '✓ Valid student ID'
    };
  }
  
  // Return detailed error message
  return {
    isValid: false,
    message: `Invalid format for ${universityConfig.name}. ${universityConfig.description}`
  };
};

/**
 * Get student ID examples for a specific university
 * @param {string} university - The university name
 * @returns {Array} - Array of example student IDs
 */
export const getStudentIdExamples = (university) => {
  const universityConfig = UNIVERSITY_PATTERNS[university];
  return universityConfig ? universityConfig.examples : ['Enter your student ID'];
};

/**
 * Get student ID format description for a university
 * @param {string} university - The university name
 * @returns {string} - Description of the expected format
 */
export const getStudentIdFormat = (university) => {
  const universityConfig = UNIVERSITY_PATTERNS[university];
  return universityConfig ? universityConfig.description : 'Enter your student ID as shown on your ID card';
};

/**
 * Real-time validation as user types
 * Provides immediate feedback on format correctness
 * @param {string} studentId - Current input value
 * @param {string} university - Selected university
 * @returns {Object} - { status: 'valid'|'invalid'|'incomplete', message: string }
 */
export const validateStudentIdRealtime = (studentId, university) => {
  const cleanId = studentId.trim().toUpperCase();
  
  if (!cleanId) {
    return { status: 'incomplete', message: '' };
  }
  
  if (cleanId.length < 6) {
    return {
      status: 'incomplete',
      message: `${6 - cleanId.length} more character${cleanId.length === 5 ? '' : 's'} needed`
    };
  }
  
  const validation = validateStudentId(studentId, university);
  
  return {
    status: validation.isValid ? 'valid' : 'invalid',
    message: validation.message
  };
};

/**
 * Auto-format student ID as user types (uppercase, remove spaces)
 * @param {string} studentId - Raw input value
 * @returns {string} - Formatted student ID
 */
export const formatStudentId = (studentId) => {
  return studentId.toUpperCase().replace(/\s+/g, '');
};



