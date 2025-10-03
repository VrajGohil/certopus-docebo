import axios from 'axios'

export interface DoceboUser {
  id: number
  email: string
  firstname: string
  lastname: string
  username: string
  active: boolean
  creation_date: string
  last_access_date?: string
}

export interface DoceboCourse {
  id: number
  name: string
  code: string
  description?: string
  language?: string
  status?: string
  creation_date?: string
  course_type?: string
}

export class DoceboService {
  private baseURL: string
  private accessToken: string | null = null
  private tokenExpiry: number | null = null

  constructor(apiUrl: string = 'https://doceboapi.docebosaas.com') {
    this.baseURL = apiUrl
  }

  /**
   * Authenticate with Docebo API and get access token
   */
  async authenticate(domain: string, username: string, password: string): Promise<string> {
    try {
      const clientId = process.env.DOCEBO_CLIENT_ID
      const clientSecret = process.env.DOCEBO_CLIENT_SECRET
      
      if (!clientId || !clientSecret) {
        throw new Error('DOCEBO_CLIENT_ID and DOCEBO_CLIENT_SECRET are required')
      }

      // Use FormData for multipart/form-data as required by Docebo
      const formData = new FormData()
      formData.append('client_id', clientId)
      formData.append('client_secret', clientSecret)
      formData.append('grant_type', 'password')
      formData.append('scope', 'api')
      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch(`${this.baseURL}/oauth2/token`, {
        method: 'POST',
        headers: {
          'X-Domain': domain
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Authentication failed (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000)

      console.log('Successfully authenticated with Docebo API')
      return this.accessToken!

    } catch (error: any) {
      console.error('Failed to authenticate with Docebo API:', error.message)
      throw new Error(`Docebo authentication failed: ${error.message}`)
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(domain: string, username: string, password: string): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      await this.authenticate(domain, username, password)
    }
  }

  /**
   * Get user details by user ID
   */
  async getUserDetails(
    userId: number, 
    domain: string, 
    username: string, 
    password: string
  ): Promise<DoceboUser | null> {
    try {
      await this.ensureValidToken(domain, username, password)

      const response = await axios.get(`${this.baseURL}/manage/v1/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Domain': domain
        }
      })

      // Log the full response to debug the structure
      console.log('Docebo user API response:', JSON.stringify(response.data, null, 2))
      
      // Handle different response structures
      const rawData = response.data.data || response.data
      const userData = rawData.user_data || rawData
      
      // Extract user information with fallbacks for different field names
      const user = {
        id: userData.user_id || userData.id || userId,
        email: userData.email || userData.mail || userData.user_email || '',
        firstname: userData.first_name || userData.firstname || userData.name?.split(' ')[0] || '',
        lastname: userData.last_name || userData.lastname || userData.name?.split(' ').slice(1).join(' ') || '',
        username: userData.username || userData.user_name || userData.userid || '',
        active: userData.valid === '1' || userData.active !== undefined ? userData.active : true,
        creation_date: userData.creation_date || userData.register_date || new Date().toISOString(),
        last_access_date: userData.last_access_date || userData.last_login_date || userData.last_update
      }
      
      console.log('Retrieved user details from Docebo:', {
        userId: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname
      })

      return user

    } catch (error: any) {
      console.error('Failed to get user details from Docebo:', {
        userId: userId,
        error: error.response?.data || error.message
      })
      
      if (error.response?.status === 401) {
        // Token might be expired, try to re-authenticate once
        this.accessToken = null
        return await this.getUserDetails(userId, domain, username, password)
      }
      
      return null
    }
  }

  /**
   * Get user details using alternative users API endpoint
   */
  async getUserDetailsAlternative(
    userId: number, 
    domain: string, 
    username: string, 
    password: string
  ): Promise<DoceboUser | null> {
    try {
      await this.ensureValidToken(domain, username, password)

      // Try the /manage/v1/users endpoint with filter
      const response = await axios.get(`${this.baseURL}/manage/v1/users`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Domain': domain
        },
        params: {
          'search_text': userId.toString(),
          'page_size': 1
        }
      })

      console.log('Docebo users API response:', JSON.stringify(response.data, null, 2))
      
      const users = response.data.data?.items || []
      const userData = users.find((u: any) => u.id === userId || u.user_id === userId)
      
      if (!userData) {
        return null
      }

      // Extract user information with fallbacks
      return {
        id: userData.id || userData.user_id || userId,
        email: userData.email || userData.mail || userData.user_email || '',
        firstname: userData.firstname || userData.first_name || userData.name?.split(' ')[0] || '',
        lastname: userData.lastname || userData.last_name || userData.name?.split(' ').slice(1).join(' ') || '',
        username: userData.username || userData.user_name || userData.userid || '',
        active: userData.active !== undefined ? userData.active : true,
        creation_date: userData.creation_date || userData.register_date || new Date().toISOString(),
        last_access_date: userData.last_access_date || userData.last_login_date
      }

    } catch (error: any) {
      console.error('Failed to get user details from alternative API:', {
        userId: userId,
        error: error.response?.data || error.message
      })
      return null
    }
  }

  /**
   * Get course details by course ID
   */
  async getCourseDetails(
    courseId: number, 
    domain: string, 
    username: string, 
    password: string
  ): Promise<DoceboCourse | null> {
    try {
      await this.ensureValidToken(domain, username, password)

      const response = await axios.get(`${this.baseURL}/learn/v1/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Domain': domain
        }
      })

      const course = response.data.data
      
      console.log('Retrieved course details from Docebo:', {
        courseId: courseId,
        name: course.name,
        code: course.code
      })

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description,
        language: course.language,
        status: course.status,
        creation_date: course.creation_date,
        course_type: course.course_type
      }

    } catch (error: any) {
      console.error('Failed to get course details from Docebo:', {
        courseId: courseId,
        error: error.response?.data || error.message
      })
      
      if (error.response?.status === 401) {
        // Token might be expired, try to re-authenticate once
        this.accessToken = null
        return await this.getCourseDetails(courseId, domain, username, password)
      }
      
      return null
    }
  }

  /**
   * List courses from Docebo
   */
  async listCourses(
    domain: string,
    username: string,
    password: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ data: DoceboCourse[], total: number }> {
    try {
      await this.ensureValidToken(domain, username, password)

      const response = await axios.get(`${this.baseURL}/learn/v1/courses`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Domain': domain
        },
        params: {
          page: page,
          page_size: pageSize
        }
      })

      return {
        data: response.data.data.items || [],
        total: response.data.data.total_count || 0
      }

    } catch (error: any) {
      console.error('Failed to list courses from Docebo:', error.response?.data || error.message)
      
      if (error.response?.status === 401) {
        // Token might be expired, try to re-authenticate once
        this.accessToken = null
        return await this.listCourses(domain, username, password, page, pageSize)
      }
      
      return { data: [], total: 0 }
    }
  }
}