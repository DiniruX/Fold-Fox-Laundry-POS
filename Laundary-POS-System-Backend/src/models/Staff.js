const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  personalInfo: {
    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      required: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      required: false, // Optional for staff
      unique: true,
      sparse: true, // Allows multiple null/empty values for unique index
      lowercase: true,
      validate: {
        validator: function(v) {
          if (!v || v === '') return true; // Allow empty
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email'
      }
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String
    }
  },
  employmentInfo: {
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern'],
      default: 'full_time'
    },
    hireDate: {
      type: Date,
      required: [true, 'Hire date is required'],
      default: Date.now
    },
    workSchedule: {
      startTime: String, // Format: "09:00"
      endTime: String,   // Format: "18:00"
      workingDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      shiftType: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night'],
        default: 'morning'
      }
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    salary: {
      amount: {
        type: Number,
        min: [0, 'Salary cannot be negative']
      },
      currency: {
        type: String,
        default: 'LKR'
      },
      paymentFrequency: {
        type: String,
        enum: ['monthly', 'weekly', 'daily'],
        default: 'monthly'
      }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
staffSchema.index({ employeeId: 1 });
staffSchema.index({ 'personalInfo.email': 1 });
staffSchema.index({ 'personalInfo.phoneNumber': 1 });
staffSchema.index({ 'employmentInfo.hireDate': 1 });
staffSchema.index({ 'personalInfo.firstName': 'text', 'personalInfo.lastName': 'text' });
staffSchema.index({ 'personalInfo.idNumber': 1 }, { unique: true, sparse: true });

// Virtual for full name
staffSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for age
staffSchema.virtual('age').get(function() {
  if (!this.personalInfo.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for years of service
staffSchema.virtual('yearsOfService').get(function() {
  if (!this.employmentInfo.hireDate) return 0;
  const today = new Date();
  const hireDate = new Date(this.employmentInfo.hireDate);
  const diffTime = Math.abs(today - hireDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 365);
});

// Pre-save middleware to generate employee ID
staffSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    console.log('🔢 Auto-generating employee ID...');
    const Counter = require('./Counter');
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const key = `staff:${year}-${month}`;
    
    try {
      const updated = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      this.employeeId = `EMP${year}${month}${updated.seq.toString().padStart(4, '0')}`;
      console.log('✅ Generated employee ID:', this.employeeId);
    } catch (error) {
      console.error('❌ Error generating employee ID:', error);
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
