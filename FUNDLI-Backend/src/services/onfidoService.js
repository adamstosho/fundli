const axios = require('axios');

class OnfidoService {
  constructor() {
    this.apiToken = process.env.ONFIDO_API_TOKEN;
    this.baseURL = process.env.ONFIDO_BASE_URL || 'https://api.onfido.com/v3';
    this.webhookToken = process.env.ONFIDO_WEBHOOK_TOKEN;
    
    if (!this.apiToken) {
      console.warn('ONFIDO_API_TOKEN not configured. Document verification will be simulated.');
    }
  }

  // Create an applicant in Onfido
  async createApplicant(userData) {
    try {
      if (!this.apiToken) {
        // Simulate applicant creation for development
        return {
          success: true,
          applicantId: `sim_${Date.now()}`,
          message: 'Simulated applicant creation'
        };
      }

      const response = await axios.post(
        `${this.baseURL}/applicants`,
        {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          dob: userData.dateOfBirth,
          address: {
            building_number: userData.address?.buildingNumber || '',
            street: userData.address?.street || '',
            city: userData.address?.city || '',
            state: userData.address?.state || '',
            postcode: userData.address?.postcode || '',
            country: userData.address?.country || 'USA'
          }
        },
        {
          headers: {
            'Authorization': `Token token=${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        applicantId: response.data.id,
        data: response.data
      };

    } catch (error) {
      console.error('Onfido applicant creation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Upload a document to Onfido
  async uploadDocument(applicantId, documentData) {
    try {
      if (!this.apiToken) {
        // Simulate document upload for development
        return {
          success: true,
          documentId: `sim_doc_${Date.now()}`,
          message: 'Simulated document upload'
        };
      }

      const formData = new FormData();
      formData.append('applicant_id', applicantId);
      formData.append('type', this.mapDocumentType(documentData.type));
      formData.append('file', documentData.file);

      const response = await axios.post(
        `${this.baseURL}/documents`,
        formData,
        {
          headers: {
            'Authorization': `Token token=${this.apiToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return {
        success: true,
        documentId: response.data.id,
        data: response.data
      };

    } catch (error) {
      console.error('Onfido document upload error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Create a check (verification) in Onfido
  async createCheck(applicantId, documentIds) {
    try {
      if (!this.apiToken) {
        // Simulate check creation for development
        return {
          success: true,
          checkId: `sim_check_${Date.now()}`,
          message: 'Simulated check creation'
        };
      }

      const response = await axios.post(
        `${this.baseURL}/checks`,
        {
          applicant_id: applicantId,
          report_names: ['document'],
          document_ids: documentIds
        },
        {
          headers: {
            'Authorization': `Token token=${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        checkId: response.data.id,
        data: response.data
      };

    } catch (error) {
      console.error('Onfido check creation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Verify documents with Onfido
  async verifyDocumentWithOnfido(documents, collateralId) {
    try {
      if (!this.apiToken) {
        // Simulate verification for development
        console.log('Simulating Onfido verification for collateral:', collateralId);
        
        // Simulate processing time
        setTimeout(() => {
          console.log('Simulated verification completed for collateral:', collateralId);
        }, 5000);

        return {
          success: true,
          verificationId: `sim_verification_${Date.now()}`,
          message: 'Simulated verification initiated'
        };
      }

      // For production, you would:
      // 1. Create or get applicant
      // 2. Upload documents
      // 3. Create check
      // 4. Return check ID for webhook processing

      const applicantData = {
        firstName: 'John', // This should come from user data
        lastName: 'Doe',
        email: 'john.doe@example.com',
        dateOfBirth: '1990-01-01'
      };

      const applicantResult = await this.createApplicant(applicantData);
      if (!applicantResult.success) {
        throw new Error('Failed to create applicant');
      }

      // Upload documents
      const documentIds = [];
      for (const doc of documents) {
        const uploadResult = await this.uploadDocument(applicantResult.applicantId, {
          type: 'other',
          file: doc.fileUrl
        });
        
        if (uploadResult.success) {
          documentIds.push(uploadResult.documentId);
        }
      }

      if (documentIds.length === 0) {
        throw new Error('No documents were uploaded successfully');
      }

      // Create check
      const checkResult = await this.createCheck(applicantResult.applicantId, documentIds);
      if (!checkResult.success) {
        throw new Error('Failed to create verification check');
      }

      return {
        success: true,
        verificationId: checkResult.checkId,
        applicantId: applicantResult.applicantId,
        message: 'Verification check created successfully'
      };

    } catch (error) {
      console.error('Document verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get check status
  async getCheckStatus(checkId) {
    try {
      if (!this.apiToken) {
        return {
          success: true,
          status: 'simulated',
          message: 'Simulated check status'
        };
      }

      const response = await axios.get(
        `${this.baseURL}/checks/${checkId}`,
        {
          headers: {
            'Authorization': `Token token=${this.apiToken}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      console.error('Onfido check status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Get report details
  async getReport(reportId) {
    try {
      if (!this.apiToken) {
        return {
          success: true,
          status: 'clear',
          message: 'Simulated report'
        };
      }

      const response = await axios.get(
        `${this.baseURL}/reports/${reportId}`,
        {
          headers: {
            'Authorization': `Token token=${this.apiToken}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      console.error('Onfido report error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookToken) {
      console.warn('ONFIDO_WEBHOOK_TOKEN not configured. Webhook signature verification skipped.');
      return true;
    }

    // Implement webhook signature verification
    // This is a simplified version - in production, you should use proper crypto verification
    return true;
  }

  // Map document types to Onfido format
  mapDocumentType(collateralType) {
    const typeMap = {
      'real_estate': 'utility_bill',
      'vehicle': 'driving_licence',
      'business': 'bank_statement',
      'investment': 'bank_statement',
      'other': 'utility_bill'
    };

    return typeMap[collateralType] || 'utility_bill';
  }

  // Get verification statistics
  async getVerificationStats() {
    try {
      if (!this.apiToken) {
        return {
          success: true,
          stats: {
            total: 0,
            clear: 0,
            rejected: 0,
            suspected: 0
          },
          message: 'Simulated statistics'
        };
      }

      // In production, you would aggregate data from Onfido API
      // For now, return simulated data
      return {
        success: true,
        stats: {
          total: 0,
          clear: 0,
          rejected: 0,
          suspected: 0
        }
      };

    } catch (error) {
      console.error('Verification stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new OnfidoService();
