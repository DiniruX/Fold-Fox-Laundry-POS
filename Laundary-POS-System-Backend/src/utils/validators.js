/**
 * Enhanced Backend Validation Utilities
 * Comprehensive validation with detailed error messages
 */

const validator = require('validator');

/**
 * Validate user creation data
 */
const validateUserCreate = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (data.name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  } else if (data.name.length > 50) {
    errors.push({ field: 'name', message: 'Name must be less than 50 characters' });
  } else if (!/^[a-zA-Z\s]+$/.test(data.name)) {
    errors.push({ field: 'name', message: 'Name can only contain letters and spaces' });
  }
  
  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validator.isEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }
  
  // Password validation
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (data.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  } else if (data.password.length > 100) {
    errors.push({ field: 'password', message: 'Password is too long' });
  }
  
  // Role validation
  const validRoles = ['admin', 'cashier', 'staff'];
  if (!data.role) {
    errors.push({ field: 'role', message: 'Role is required' });
  } else if (!validRoles.includes(data.role)) {
    errors.push({ field: 'role', message: `Role must be one of: ${validRoles.join(', ')}` });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate staff creation data
 */
const validateStaffCreate = (data) => {
  const errors = [];
  
  // Personal Info validation
  if (!data.personalInfo) {
    errors.push({ field: 'personalInfo', message: 'Personal information is required' });
    return { isValid: false, errors };
  }
  
  const { personalInfo } = data;
  
  // First name
  if (!personalInfo.firstName || personalInfo.firstName.trim() === '') {
    errors.push({ field: 'firstName', message: 'First name is required' });
  } else if (personalInfo.firstName.length < 2) {
    errors.push({ field: 'firstName', message: 'First name must be at least 2 characters' });
  } else if (!/^[a-zA-Z\s]+$/.test(personalInfo.firstName)) {
    errors.push({ field: 'firstName', message: 'First name can only contain letters' });
  }
  
  // Last name
  if (!personalInfo.lastName || personalInfo.lastName.trim() === '') {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  } else if (personalInfo.lastName.length < 2) {
    errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters' });
  } else if (!/^[a-zA-Z\s]+$/.test(personalInfo.lastName)) {
    errors.push({ field: 'lastName', message: 'Last name can only contain letters' });
  }
  
  // ID Number
  if (!personalInfo.idNumber || personalInfo.idNumber.trim() === '') {
    errors.push({ field: 'idNumber', message: 'ID number is required' });
  } else if (!/^[A-Za-z0-9\-/]{5,20}$/.test(personalInfo.idNumber.trim())) {
    errors.push({ field: 'idNumber', message: 'ID number must be 5-20 characters (letters, numbers, slash or hyphen)' });
  }
  
  // Date of birth
  if (!personalInfo.dateOfBirth) {
    errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
  } else {
    const dob = new Date(personalInfo.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push({ field: 'dateOfBirth', message: 'Invalid date of birth' });
    } else {
      const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        errors.push({ field: 'dateOfBirth', message: 'Staff member must be at least 18 years old' });
      } else if (age > 100) {
        errors.push({ field: 'dateOfBirth', message: 'Invalid date of birth' });
      }
    }
  }
  
  // Gender
  const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
  if (!personalInfo.gender) {
    errors.push({ field: 'gender', message: 'Gender is required' });
  } else if (!validGenders.includes(personalInfo.gender)) {
    errors.push({ field: 'gender', message: `Gender must be one of: ${validGenders.join(', ')}` });
  }
  
  // Phone number
  if (!personalInfo.phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else if (!/^[0-9]{10,15}$/.test(personalInfo.phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Phone number must be 10-15 digits' });
  }
  
  // Email (optional)
  if (personalInfo.email && personalInfo.email.trim() !== '') {
    if (!validator.isEmail(personalInfo.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }
  
  // Employment Info validation
  if (!data.employmentInfo) {
    errors.push({ field: 'employmentInfo', message: 'Employment information is required' });
    return { isValid: false, errors };
  }
  
  const { employmentInfo } = data;
  
  // Position
  if (!employmentInfo.position || employmentInfo.position.trim() === '') {
    errors.push({ field: 'position', message: 'Position is required' });
  } else if (employmentInfo.position.length < 2) {
    errors.push({ field: 'position', message: 'Position must be at least 2 characters' });
  }
  
  // Employment type
  const validTypes = ['full_time', 'part_time', 'contract', 'intern'];
  if (!employmentInfo.employmentType) {
    errors.push({ field: 'employmentType', message: 'Employment type is required' });
  } else if (!validTypes.includes(employmentInfo.employmentType)) {
    errors.push({ field: 'employmentType', message: `Employment type must be one of: ${validTypes.join(', ')}` });
  }
  
  // Hire date
  if (!employmentInfo.hireDate) {
    errors.push({ field: 'hireDate', message: 'Hire date is required' });
  } else {
    const hireDate = new Date(employmentInfo.hireDate);
    if (isNaN(hireDate.getTime())) {
      errors.push({ field: 'hireDate', message: 'Invalid hire date' });
    }
  }
  
  // Salary validation (optional)
  if (employmentInfo.salary) {
    if (employmentInfo.salary.amount !== undefined && employmentInfo.salary.amount < 0) {
      errors.push({ field: 'salaryAmount', message: 'Salary amount cannot be negative' });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate user update data
 */
const validateUserUpdate = (data) => {
  const errors = [];
  
  // Name validation (if provided)
  if (data.name !== undefined) {
    if (data.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name cannot be empty' });
    } else if (data.name.length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
    } else if (!/^[a-zA-Z\s]+$/.test(data.name)) {
      errors.push({ field: 'name', message: 'Name can only contain letters and spaces' });
    }
  }
  
  // Email validation (if provided)
  if (data.email !== undefined) {
    if (data.email.trim() === '') {
      errors.push({ field: 'email', message: 'Email cannot be empty' });
    } else if (!validator.isEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }
  
  // Password validation (if provided)
  if (data.password !== undefined) {
    if (data.password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    }
  }
  
  // Role validation (if provided)
  if (data.role !== undefined) {
    const validRoles = ['admin', 'cashier', 'staff'];
    if (!validRoles.includes(data.role)) {
      errors.push({ field: 'role', message: `Role must be one of: ${validRoles.join(', ')}` });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format validation errors for response
 */
const formatValidationErrors = (errors) => {
  if (Array.isArray(errors) && errors.length > 0) {
    return {
      message: 'Validation failed',
      errors: errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {}),
      details: errors
    };
  }
  return null;
};

module.exports = {
  validateUserCreate,
  validateStaffCreate,
  validateUserUpdate,
  formatValidationErrors
};
