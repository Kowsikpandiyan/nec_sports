const Settings = require('../models/Settings');
const College = require('../models/College');
const { uploadImage } = require('../config/cloudinary');

/**
 * GET /api/v1/settings/:collegeId
 * Retrieve or initialize site branding settings
 */
exports.getSettings = async (req, res, next) => {
  try {
    const { collegeId } = req.params;

    let settings = await Settings.findOne({ college: collegeId }).populate('college');
    
    // Create initial settings from college profile if none exists yet
    if (!settings) {
      const college = await College.findById(collegeId);
      if (!college) {
        return res.status(404).json({
          success: false,
          message: 'College not found'
        });
      }

      settings = await Settings.create({
        college: college._id,
        collegeName: college.name,
        logo: college.logo || '',
        primaryColor: '#3b82f6',
        darkMode: false,
        allowPublicRegistration: false,
        updatedBy: college.createdBy
      });

      settings = await Settings.findById(settings._id).populate('college');
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/settings/:collegeId
 * Update college settings (superAdmin only)
 */
exports.update = async (req, res, next) => {
  try {
    const { collegeId } = req.params;
    const { collegeName, primaryColor, darkMode, allowPublicRegistration } = req.body;

    let settings = await Settings.findOne({ college: collegeId });
    if (!settings) {
      // Find college to make sure it exists
      const college = await College.findById(collegeId);
      if (!college) {
        return res.status(404).json({
          success: false,
          message: 'College not found'
        });
      }

      settings = new Settings({
        college: collegeId,
        collegeName: college.name,
        updatedBy: req.user.id
      });
    }

    settings.collegeName = collegeName !== undefined ? collegeName : settings.collegeName;
    settings.primaryColor = primaryColor !== undefined ? primaryColor : settings.primaryColor;
    settings.darkMode = darkMode !== undefined ? (darkMode === 'true' || darkMode === true) : settings.darkMode;
    settings.allowPublicRegistration = allowPublicRegistration !== undefined 
      ? (allowPublicRegistration === 'true' || allowPublicRegistration === true) 
      : settings.allowPublicRegistration;
    settings.updatedBy = req.user.id;

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'branding');
      if (uploadResult) {
        settings.logo = uploadResult.url;
      }
    }

    await settings.save();
    const updated = await Settings.findOne({ college: collegeId }).populate('college');

    res.status(200).json({
      success: true,
      message: 'App settings updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
