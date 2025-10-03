import axios from 'axios'

export interface CertopusOrganisation {
  id: string
  name: string
  imageUrl?: string
}

export interface CertopusEvent {
  id: string
  title: string
}

export interface CertopusCategory {
  id: string
  title: string
}

export interface CertopusRecipientField {
  key: string
  label: string
  type: string
  required: boolean
}

export interface CertopusCredential {
  id: string
  message: string
  url?: string
  share_url?: string
}

export interface CertopusCredentialRequest {
  organisationId: string
  eventId: string
  categoryId: string
  recipientName: string
  recipientEmail: string
  courseName?: string
  completionDate?: string
  customFields?: Record<string, any>
  autoGenerate?: boolean
  autoPublish?: boolean
}

export class CertopusService {
  private baseURL: string
  private apiKey: string

  constructor(apiKey: string, baseURL: string = 'https://api.certopus.com/v1') {
    this.apiKey = apiKey
    this.baseURL = baseURL
    console.log('CertopusService initialized with:', { baseURL, apiKeyLength: apiKey?.length })
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-KEY': this.apiKey
    }
  }

  /**
   * Get all organisations for the user
   */
  async getOrganisations(): Promise<CertopusOrganisation[]> {
    try {
      console.log('Fetching organizations from:', `${this.baseURL}/organisations`)
      console.log('Using headers:', this.getHeaders())
      
      const response = await axios.get(`${this.baseURL}/organisations`, {
        headers: this.getHeaders()
      })

      console.log('Organizations response:', response.status, response.data)
      return response.data.data || response.data || []
    } catch (error: any) {
      console.error('Failed to get Certopus organisations:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: `${this.baseURL}/organisations`
      })
      throw new Error(`Failed to get organisations: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Get events for an organisation
   */
  async getEvents(organisationId: string): Promise<CertopusEvent[]> {
    try {
      const response = await axios.get(`${this.baseURL}/events/${organisationId}`, {
        headers: this.getHeaders()
      })

      return response.data.data || response.data || []
    } catch (error: any) {
      console.error('Failed to get Certopus events:', error.response?.data || error.message)
      throw new Error(`Failed to get events: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Get categories for an organisation and event
   */
  async getCategories(organisationId: string, eventId: string): Promise<CertopusCategory[]> {
    try {
      const response = await axios.get(`${this.baseURL}/categories`, {
        headers: this.getHeaders(),
        params: {
          organisationId,
          eventId
        }
      })

      return response.data.data || response.data || []
    } catch (error: any) {
      console.error('Failed to get Certopus categories:', error.response?.data || error.message)
      throw new Error(`Failed to get categories: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Get recipient fields for a category
   */
  async getRecipientFields(
    organisationId: string, 
    eventId: string, 
    categoryId: string
  ): Promise<CertopusRecipientField[]> {
    try {
      const response = await axios.get(`${this.baseURL}/recipient_fields`, {
        headers: this.getHeaders(),
        params: {
          categoryId,
          organisationId,
          eventId
        }
      })

      return response.data.data || []
    } catch (error: any) {
      console.error('Failed to get recipient fields:', error.response?.data || error.message)
      throw new Error(`Failed to get recipient fields: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Create a credential/certificate
   */
  async createCredential(request: CertopusCredentialRequest): Promise<CertopusCredential> {
    try {
      // Prepare custom data fields
      let customData: Record<string, any> = {}
      
      // Handle custom field mappings from the request
      if (request.customFields) {
        Object.entries(request.customFields).forEach(([key, value]) => {
          customData[key] = value
        })
      }

      // Add standard fields if not already mapped
      if (request.courseName && !customData['{course_name}']) {
        customData['{course_name}'] = request.courseName
      }
      if (request.completionDate && !customData['{completion_date}']) {
        customData['{completion_date}'] = this.formatDate(request.completionDate)
      }
      if (request.recipientName && !customData['{recipient_name}']) {
        customData['{recipient_name}'] = request.recipientName
      }

      const payload = {
        categoryId: request.categoryId,
        organisationId: request.organisationId,
        eventId: request.eventId,
        generate: request.autoGenerate || false,
        publish: request.autoPublish || false,
        recipients: [
          {
            email: request.recipientEmail,
            data: customData
          }
        ]
      }

      console.log('Creating Certopus credential:', payload)

      const response = await axios.post(`${this.baseURL}/certificates`, payload, {
        headers: this.getHeaders()
      })

      const result = response.data
      console.log('Certopus credential created:', result)

      return {
        id: result.id || result.message_id || 'unknown',
        message: result.message || 'Credential created successfully',
        url: result.url || result.share_url,
        share_url: result.share_url
      }

    } catch (error: any) {
      console.error('Failed to create Certopus credential:', error.response?.data || error.message)
      
      // Handle specific Certopus API errors
      if (error.response?.status === 400) {
        throw new Error(`Invalid credential data: ${error.response.data.message || 'Bad request'}`)
      } else if (error.response?.status === 401) {
        throw new Error('Certopus API authentication failed - check API key')
      } else if (error.response?.status === 404) {
        throw new Error(`Resource not found - check organisation, event, or category ID`)
      } else if (error.response?.status === 429) {
        throw new Error('Certopus API rate limit exceeded')
      }

      throw new Error(`Certopus API error: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Format date for certificate display
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.warn('Failed to format date, using original:', dateString)
      return dateString
    }
  }

  /**
   * Validate API configuration
   */
  validateConfiguration(): boolean {
    if (!this.baseURL) {
      throw new Error('CERTOPUS_API_URL is not configured')
    }

    if (!this.apiKey) {
      throw new Error('CERTOPUS_API_KEY is not configured')
    }

    return true
  }
}