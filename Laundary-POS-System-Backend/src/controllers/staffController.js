const Staff = require('../models/Staff');
const User = require('../models/User');

/**
 * Staff Controller - Comprehensive staff management system
 * Admin: Full access to all staff operations
 * Features: Staff lifecycle management, performance tracking, attendance, documents
 * Note: Staff members cannot login - they are managed by admin only
 */

/**
 * @desc    Create new staff member
 * @route   POST /api/staff
 * @access  Admin only
 */
const createStaff = async (req, res) => {
  try {
    const {
      personalInfo,
      employmentInfo
    } = req.body;

    if (!personalInfo?.idNumber || personalInfo.idNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'ID number is required',
        field: 'idNumber'
      });
    }

    // Normalize key personal info fields
    personalInfo.idNumber = personalInfo.idNumber.trim().toUpperCase();
    if (personalInfo.email) {
      personalInfo.email = personalInfo.email.trim().toLowerCase();
    }
    if (personalInfo.phoneNumber) {
      personalInfo.phoneNumber = personalInfo.phoneNumber.trim();
    }

    // Enhanced validation
    const { validateStaffCreate, formatValidationErrors } = require('../utils/validators');
    const validation = validateStaffCreate({ personalInfo, employmentInfo });
    
    if (!validation.isValid) {
      const formattedErrors = formatValidationErrors(validation.errors);
      return res.status(400).json({
        success: false,
        ...formattedErrors
      });
    }

    // Check if email already exists (only if email is provided)
    if (personalInfo.email && personalInfo.email.trim() !== '') {
      const existingStaff = await Staff.findOne({ 
        'personalInfo.email': personalInfo.email.toLowerCase() 
      });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Staff member with this email already exists',
          field: 'email'
        });
      }
    }

    // Check if phone number already exists
    const existingPhone = await Staff.findOne({ 
      'personalInfo.phoneNumber': personalInfo.phoneNumber 
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this phone number already exists',
        field: 'phoneNumber'
      });
    }

    // Check if ID number already exists
    const existingIdNumber = await Staff.findOne({
      'personalInfo.idNumber': personalInfo.idNumber
    });
    if (existingIdNumber) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this ID number already exists',
        field: 'idNumber'
      });
    }

    // Set default values
    const staffData = {
      personalInfo,
      employmentInfo,
      createdBy: req.user._id
    };

    console.log('Creating staff with data:', JSON.stringify(staffData, null, 2));
    
    const staff = await Staff.create(staffData);
    
    console.log('Staff created successfully:', staff._id);

    // Populate the created staff with references
    const populatedStaff = await Staff.findById(staff._id)
      .populate('createdBy', 'name email')
      .populate('employmentInfo.reportingManager', 'name email');

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: populatedStaff
    });
  } catch (error) {
    console.error('❌ Error creating staff:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      let message = 'Duplicate field value. Email or employee ID already exists.';
      if (duplicateField === 'personalInfo.email') {
        message = 'Staff member with this email already exists.';
      } else if (duplicateField === 'personalInfo.phoneNumber') {
        message = 'Staff member with this phone number already exists.';
      } else if (duplicateField === 'personalInfo.idNumber') {
        message = 'Staff member with this ID number already exists.';
      }
      return res.status(400).json({
        success: false,
        message
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message
    });
  }
};

/**
 * @desc    Get all staff members with filtering and pagination
 * @route   GET /api/staff
 * @access  Admin only
 */
const getAllStaff = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search across multiple fields
    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: 'i' } },
        { 'personalInfo.idNumber': { $regex: search, $options: 'i' } },
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { 'personalInfo.phoneNumber': { $regex: search, $options: 'i' } },
        { 'employmentInfo.position': { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const maxLimit = Math.min(parseInt(limit) || 10, 100);
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * maxLimit;

    const staff = await Staff.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('employmentInfo.reportingManager', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(maxLimit);

    const total = await Staff.countDocuments(query);

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / maxLimit),
          totalStaff: total,
          hasNext: pageNum < Math.ceil(total / maxLimit),
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff members',
      error: error.message
    });
  }
};

/**
 * @desc    Get staff member by ID
 * @route   GET /api/staff/:id
 * @access  Admin only
 */
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('employmentInfo.reportingManager', 'name email');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff member',
      error: error.message
    });
  }
};

/**
 * @desc    Update staff member
 * @route   PUT /api/staff/:id
 * @access  Admin only
 */
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.employeeId;
    delete updateData.createdBy;
    delete updateData.createdAt;

    // Normalize and validate personal info updates
    if (updateData.personalInfo) {
      if (updateData.personalInfo.idNumber) {
        updateData.personalInfo.idNumber = updateData.personalInfo.idNumber.trim().toUpperCase();
        const existingId = await Staff.findOne({
          'personalInfo.idNumber': updateData.personalInfo.idNumber,
          _id: { $ne: id }
        });
        if (existingId) {
          return res.status(400).json({
            success: false,
            message: 'Staff member with this ID number already exists',
            field: 'idNumber'
          });
        }
      }
      if (updateData.personalInfo.email !== undefined) {
        const emailTrimmed = updateData.personalInfo.email?.trim();
        if (!emailTrimmed) {
          delete updateData.personalInfo.email;
        } else {
          updateData.personalInfo.email = emailTrimmed.toLowerCase();
          const existingEmail = await Staff.findOne({
            'personalInfo.email': updateData.personalInfo.email,
            _id: { $ne: id }
          });
          if (existingEmail) {
            return res.status(400).json({
              success: false,
              message: 'Staff member with this email already exists',
              field: 'email'
            });
          }
        }
      }
      if (updateData.personalInfo.phoneNumber) {
        updateData.personalInfo.phoneNumber = updateData.personalInfo.phoneNumber.trim();
        const existingPhone = await Staff.findOne({
          'personalInfo.phoneNumber': updateData.personalInfo.phoneNumber,
          _id: { $ne: id }
        });
        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message: 'Staff member with this phone number already exists',
            field: 'phoneNumber'
          });
        }
      }
    }

    // Add updatedBy field
    updateData.updatedBy = req.user._id;

    const staff = await Staff.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('employmentInfo.reportingManager', 'name email');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      let message = 'Duplicate field value. Email already exists.';
      if (duplicateField === 'personalInfo.email') {
        message = 'Staff member with this email already exists.';
      } else if (duplicateField === 'personalInfo.phoneNumber') {
        message = 'Staff member with this phone number already exists.';
      } else if (duplicateField === 'personalInfo.idNumber') {
        message = 'Staff member with this ID number already exists.';
      }
      return res.status(400).json({
        success: false,
        message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member',
      error: error.message
    });
  }
};

/**
 * @desc    Update staff status (activate/deactivate/terminate)
 * @route   PUT /api/staff/:id/status
 * @access  Admin only
 */
const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { employmentStatus, terminationReason, lastWorkingDay } = req.body;

    if (!employmentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Employment status is required'
      });
    }

    const validStatuses = ['active', 'inactive', 'terminated', 'on_leave', 'suspended'];
    if (!validStatuses.includes(employmentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employment status'
      });
    }

    const updateData = {
      'status.employmentStatus': employmentStatus,
      'status.isActive': employmentStatus === 'active',
      updatedBy: req.user._id
    };

    if (employmentStatus === 'terminated') {
      updateData['status.terminationDate'] = new Date();
      updateData['status.terminationReason'] = terminationReason || 'Not specified';
      updateData['status.lastWorkingDay'] = lastWorkingDay ? new Date(lastWorkingDay) : new Date();
    }

    const staff = await Staff.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('employmentInfo.reportingManager', 'name email');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: `Staff status updated to ${employmentStatus}`,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update staff status',
      error: error.message
    });
  }
};

/**
 * @desc    Update staff attendance
 * @route   PUT /api/staff/:id/attendance
 * @access  Admin only
 */
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { hoursWorked = 8, date } = req.body;

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    await staff.updateAttendance(hoursWorked);

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: {
        employeeId: staff.employeeId,
        fullName: staff.fullName,
        totalDaysWorked: staff.attendance.totalDaysWorked,
        totalHoursWorked: staff.attendance.totalHoursWorked,
        attendanceRate: staff.attendance.attendanceRate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk update staff members
 * @route   PUT /api/staff/bulk-update
 * @access  Admin only
 */
const bulkUpdateStaff = async (req, res) => {
  try {
    const { staffIds, updateData, action } = req.body;

    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Staff IDs array is required'
      });
    }

    let result;

    switch (action) {
      case 'activate':
        result = await Staff.updateMany(
          { _id: { $in: staffIds } },
          { 
            'status.isActive': true,
            'status.employmentStatus': 'active',
            updatedBy: req.user._id
          }
        );
        break;
      case 'deactivate':
        result = await Staff.updateMany(
          { _id: { $in: staffIds } },
          { 
            'status.isActive': false,
            updatedBy: req.user._id
          }
        );
        break;
      case 'terminate':
        result = await Staff.updateMany(
          { _id: { $in: staffIds } },
          { 
            'status.isActive': false,
            'status.employmentStatus': 'terminated',
            'status.terminationDate': new Date(),
            updatedBy: req.user._id
          }
        );
        break;
      case 'update':
        if (!updateData) {
          return res.status(400).json({
            success: false,
            message: 'Update data is required for update action'
          });
        }
        updateData.updatedBy = req.user._id;
        result = await Staff.updateMany(
          { _id: { $in: staffIds } },
          updateData
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be activate, deactivate, terminate, or update'
        });
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        staffIds
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk update',
      error: error.message
    });
  }
};

/**
 * @desc    Get staff statistics
 * @route   GET /api/staff/stats
 * @access  Admin only
 */
const getStaffStats = async (req, res) => {
  try {
    const stats = await Staff.getStats();
    const processedStats = stats[0] || {
      totalStaff: 0,
      activeStaff: 0,
      byEmploymentType: [],
      byStatus: []
    };

    // Process employment type breakdown (handle empty arrays)
    const employmentTypeBreakdown = {};
    if (Array.isArray(processedStats.byEmploymentType)) {
      processedStats.byEmploymentType.forEach(type => {
        employmentTypeBreakdown[type] = (employmentTypeBreakdown[type] || 0) + 1;
      });
    }

    // Process status breakdown (handle empty arrays)
    const statusBreakdown = {};
    if (Array.isArray(processedStats.byStatus)) {
      processedStats.byStatus.forEach(status => {
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });
    }

    // Get recent hires (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHires = await Staff.countDocuments({
      'employmentInfo.hireDate': { $gte: thirtyDaysAgo }
    });

    // Get average attendance rate (handle empty collection)
    const avgAttendance = await Staff.aggregate([
      { $match: { 'status.isActive': true } },
      { $group: { _id: null, avgAttendance: { $avg: '$attendance.attendanceRate' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalStaff: processedStats.totalStaff || 0,
          activeStaff: processedStats.activeStaff || 0,
          inactiveStaff: (processedStats.totalStaff || 0) - (processedStats.activeStaff || 0),
          recentHires: recentHires || 0
        },
        employmentTypeBreakdown,
        statusBreakdown,
        averageAttendanceRate: avgAttendance[0] ? Math.round(avgAttendance[0].avgAttendance) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Search staff members
 * @route   GET /api/staff/search
 * @access  Admin only
 */
const searchStaff = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const staff = await Staff.searchStaff(q, { limit: parseInt(limit) });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search staff',
      error: error.message
    });
  }
};

/**
 * @desc    Get staff performance analytics
 * @route   GET /api/staff/:id/analytics
 * @access  Admin only
 */
const getStaffAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Calculate analytics
    const analytics = {
      basicInfo: {
        employeeId: staff.employeeId,
        fullName: staff.fullName,
        position: staff.employmentInfo.position,
        yearsOfService: staff.yearsOfService
      },
      attendance: {
        totalDaysWorked: staff.attendance.totalDaysWorked,
        totalHoursWorked: staff.attendance.totalHoursWorked,
        attendanceRate: staff.attendance.attendanceRate,
        lastAttendanceDate: staff.attendance.lastAttendanceDate
      },
      employment: {
        hireDate: staff.employmentInfo.hireDate,
        employmentStatus: staff.status.employmentStatus,
        employmentType: staff.employmentInfo.employmentType,
        isActive: staff.status.isActive
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Delete staff member (soft delete)
 * @route   DELETE /api/staff/:id
 * @access  Admin only
 */
/**
 * @desc    Delete staff (Hard delete - permanently removes from database)
 * @route   DELETE /api/staff/:id
 * @access  Admin only
 */
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByIdAndDelete(id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff member',
      error: error.message
    });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff
};
