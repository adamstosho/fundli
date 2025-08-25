const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Debug Cloudinary configuration
console.log('Cloudinary Configuration:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set');

class CloudinaryService {
  constructor() {
    this.uploadPresets = {
      profile: 'fundli_profile',
      kyc: 'fundli_kyc',
      collateral: 'fundli_collateral',
      documents: 'fundli_documents'
    };
  }

  /**
   * Upload a single file to Cloudinary
   * @param {string} filePath - Path to the file
   * @param {string} folder - Cloudinary folder
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(filePath, folder = 'fundli', options = {}) {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
      }

      // Get file info
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Check file size (max 10MB)
      if (fileSize > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Get file extension
      const ext = path.extname(filePath).toLowerCase();
      
      // Validate file type
      const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
      if (!allowedTypes.includes(ext)) {
        throw new Error('File type not allowed');
      }

      // Set upload options
      const uploadOptions = {
        folder: folder,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        transformation: [],
        ...options
      };

      // Add image transformations for images
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        uploadOptions.transformation = [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ];
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      // Clean up local file
      fs.unlinkSync(filePath);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        resourceType: result.resource_type
      };

    } catch (error) {
      // Clean up local file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param {Array} files - Array of file paths
   * @param {string} folder - Cloudinary folder
   * @param {Object} options - Upload options
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadMultipleFiles(files, folder = 'fundli', options = {}) {
    try {
      const uploadPromises = files.map(filePath => 
        this.uploadFile(filePath, folder, options)
      );

      const results = await Promise.all(uploadPromises);
      return results;

    } catch (error) {
      throw new Error(`Multiple upload failed: ${error.message}`);
    }
  }

  /**
   * Upload KYC documents with specific settings
   * @param {Object} documents - Object containing document paths
   * @returns {Promise<Object>} Upload results for all documents
   */
  async uploadKYCDocuments(documents) {
    try {
      const results = {};
      const uploadPromises = [];

      // Upload ID Front
      if (documents.idFront) {
        uploadPromises.push(
          this.uploadFile(documents.idFront, 'fundli/kyc/id_front', {
            resource_type: 'image',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ]
          }).then(result => { results.idFront = result; })
        );
      }

      // Upload ID Back
      if (documents.idBack) {
        uploadPromises.push(
          this.uploadFile(documents.idBack, 'fundli/kyc/id_back', {
            resource_type: 'image',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ]
          }).then(result => { results.idBack = result; })
        );
      }

      // Upload Selfie
      if (documents.selfie) {
        uploadPromises.push(
          this.uploadFile(documents.selfie, 'fundli/kyc/selfie', {
            resource_type: 'image',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ]
          }).then(result => { results.selfie = result; })
        );
      }

      // Upload Proof of Address
      if (documents.proofOfAddress) {
        uploadPromises.push(
          this.uploadFile(documents.proofOfAddress, 'fundli/kyc/address', {
            resource_type: 'auto'
          }).then(result => { results.proofOfAddress = result; })
        );
      }

      await Promise.all(uploadPromises);
      return results;

    } catch (error) {
      throw new Error(`KYC documents upload failed: ${error.message}`);
    }
  }

  /**
   * Test Cloudinary connectivity
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      console.log('Testing Cloudinary connection...');
      const result = await cloudinary.api.ping();
      console.log('Cloudinary connection test result:', result);
      return {
        success: true,
        message: 'Cloudinary connection successful',
        result
      };
    } catch (error) {
      console.error('Cloudinary connection test failed:', error);
      return {
        success: false,
        message: 'Cloudinary connection failed',
        error: error.message
      };
    }
  }

  /**
   * Upload KYC document
   * @param {string} base64Data - Base64 encoded image data
   * @param {string} documentType - Type of document (idFront, idBack, selfie, proofOfAddress)
   * @returns {Promise<Object>} Upload result
   */
  async uploadKYCDocument(base64Data, documentType) {
    try {
      // Validate input
      if (!base64Data) {
        throw new Error('No base64 data provided');
      }
      
      if (typeof base64Data !== 'string') {
        throw new Error('Base64 data must be a string');
      }
      
      // Check if Cloudinary is properly configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration incomplete. Please check environment variables.');
      }
      
      // Ensure base64 data has proper format
      let formattedData = base64Data;
      if (!base64Data.startsWith('data:image/')) {
        // If it's just base64 without data URL prefix, add it
        formattedData = `data:image/jpeg;base64,${base64Data}`;
      }
      
      console.log(`Uploading KYC document ${documentType} to Cloudinary...`);
      console.log(`Data length: ${formattedData.length}`);
      console.log(`Data starts with: ${formattedData.substring(0, 50)}...`);
      
      const result = await cloudinary.uploader.upload(formattedData, {
        folder: `fundli/kyc/${documentType}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      });
      
      console.log(`KYC document ${documentType} uploaded successfully:`, result.secure_url);
      return result;
      
    } catch (error) {
      console.error(`KYC document upload failed for ${documentType}:`, error);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid api_key')) {
        throw new Error('Invalid Cloudinary API key');
      } else if (error.message.includes('Invalid signature')) {
        throw new Error('Invalid Cloudinary API secret');
      } else if (error.message.includes('Invalid cloud_name')) {
        throw new Error('Invalid Cloudinary cloud name');
      } else if (error.message.includes('File is empty')) {
        throw new Error('Uploaded file appears to be empty or corrupted');
      } else {
        throw new Error(`KYC document upload failed: ${error.message}`);
      }
    }
  }

  /**
   * Upload profile picture
   * @param {string} base64Data - Base64 encoded image data
   * @returns {Promise<Object>} Upload result
   */
  async uploadProfilePicture(base64Data) {
    try {
      return await cloudinary.uploader.upload(base64Data, {
        folder: 'fundli/profile',
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      });
    } catch (error) {
      throw new Error(`Profile picture upload failed: ${error.message}`);
    }
  }

  /**
   * Upload loan collateral documents
   * @param {Array} collateralFiles - Array of collateral file paths
   * @param {Array} supportingDocs - Array of supporting document paths
   * @returns {Promise<Object>} Upload results
   */
  async uploadLoanCollateral(collateralFiles = [], supportingDocs = []) {
    try {
      const results = {
        collateral: [],
        supportingDocs: []
      };

      // Upload collateral files
      if (collateralFiles.length > 0) {
        const collateralResults = await this.uploadMultipleFiles(
          collateralFiles,
          'fundli/loans/collateral',
          {
            resource_type: 'auto',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ]
          }
        );
        results.collateral = collateralResults;
      }

      // Upload supporting documents
      if (supportingDocs.length > 0) {
        const supportingResults = await this.uploadMultipleFiles(
          supportingDocs,
          'fundli/loans/supporting',
          { resource_type: 'auto' }
        );
        results.supportingDocs = supportingResults;
      }

      return results;

    } catch (error) {
      throw new Error(`Loan collateral upload failed: ${error.message}`);
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Resource type (image, video, raw)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(publicId, resourceType = 'auto') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      return {
        success: result.result === 'ok',
        publicId: publicId,
        result: result.result
      };

    } catch (error) {
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from Cloudinary
   * @param {Array} publicIds - Array of public IDs
   * @param {string} resourceType - Resource type
   * @returns {Promise<Array>} Array of deletion results
   */
  async deleteMultipleFiles(publicIds, resourceType = 'auto') {
    try {
      const deletePromises = publicIds.map(publicId => 
        this.deleteFile(publicId, resourceType)
      );

      const results = await Promise.all(deletePromises);
      return results;

    } catch (error) {
      throw new Error(`Multiple file deletion failed: ${error.message}`);
    }
  }

  /**
   * Get file information from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      
      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        resourceType: result.resource_type,
        createdAt: result.created_at,
        tags: result.tags || []
      };

    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Generate a signed upload URL for client-side uploads
   * @param {string} folder - Cloudinary folder
   * @param {Object} options - Upload options
   * @returns {Object} Signed upload parameters
   */
  generateSignedUploadUrl(folder = 'fundli', options = {}) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      
      const params = {
        timestamp: timestamp,
        folder: folder,
        ...options
      };

      const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

      return {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp: timestamp,
        signature: signature,
        params: params
      };

    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Optimize image for web delivery
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Optimization options
   * @returns {string} Optimized URL
   */
  getOptimizedUrl(publicId, options = {}) {
    try {
      const defaultOptions = {
        quality: 'auto:good',
        fetch_format: 'auto',
        ...options
      };

      return cloudinary.url(publicId, defaultOptions);

    } catch (error) {
      throw new Error(`Failed to generate optimized URL: ${error.message}`);
    }
  }
}

module.exports = new CloudinaryService(); 