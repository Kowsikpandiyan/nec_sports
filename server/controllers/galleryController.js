const Gallery = require('../models/Gallery');
const { uploadImage } = require('../config/cloudinary');

/**
 * GET /api/v1/gallery
 * List gallery media with optional tournament filtering
 */
exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.tournamentId) {
      query.tournament = req.query.tournamentId;
    }

    const total = await Gallery.countDocuments(query);
    const mediaList = await Gallery.find(query)
      .populate('tournament', 'name')
      .populate('uploadedBy', 'name role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: mediaList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/gallery
 * Upload media (image/video) to gallery
 */
exports.create = async (req, res, next) => {
  try {
    const { tournament, title } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Determine type from mimetype
    const isVideo = req.file.mimetype.startsWith('video/');
    const fileType = isVideo ? 'video' : 'image';

    // Upload using standard cloudinary service
    const uploadResult = await uploadImage(req.file.path, 'gallery');
    
    if (!uploadResult) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process media upload'
      });
    }

    const galleryItem = await Gallery.create({
      tournament,
      title: title || req.file.originalname,
      fileUrl: uploadResult.url,
      fileType,
      uploadedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully to tournament gallery',
      data: galleryItem
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/gallery/:id
 * Remove media item
 */
exports.delete = async (req, res, next) => {
  try {
    const media = await Gallery.findById(req.params.id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media item not found'
      });
    }

    // Only creator or admin can delete
    if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    await Gallery.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Media removed from gallery'
    });
  } catch (error) {
    next(error);
  }
};
