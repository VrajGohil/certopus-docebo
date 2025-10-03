/**
 * Cloudflare Worker for Docebo-Certopus Integration
 * 
 * This worker:
 * 1. Listens to Docebo webhooks for course completion events
 * 2. Uses basic authentication for security
 * 3. Maps Docebo courses to Certopus certificate generation
 * 4. Calls Certopus API to generate certificates
 */

// Configuration - Set these as environment variables in Cloudflare Workers
const CONFIG = {
  // Basic Auth credentials
  WEBHOOK_USERNAME: 'docebo_webhook',
  WEBHOOK_PASSWORD: 'your_secure_password_here',
  
  // Certopus API configuration
  CERTOPUS_API_URL: 'https://api.stg.certopus.in/v1',
  CERTOPUS_API_KEY: 'af388545d9d83dfd5c323abed876c6059cb0f9d77be60709fd9dea1bc8a94a11',
  CERTOPUS_ORG_ID: 'your_certopus_org_id',
  CERTOPUS_EVENT_ID: 'your_certopus_event_id',
  
  // Optional: Certopus category ID
  CERTOPUS_CATEGORY_ID: 'your_certopus_category_id', // Leave empty if not needed
}

// Course mapping from Docebo course IDs to Certopus UIDs
const COURSE_MAPPING = {
  1: { name: 'Darwinbox Core', uidCourse: 'E-E0JM0Z' },
  2: { name: 'HR Docs & Letters', uidCourse: 'E-D19PVG' },
  3: { name: 'Custom Workflows & FAAS', uidCourse: 'E-J0E815' },
  7: { name: 'Standard Workflows', uidCourse: 'E-P08J03' },
  8: { name: 'Leave Management', uidCourse: 'E-GVP31J' },
  9: { name: 'Attendance Management', uidCourse: 'E-O06RVJ' },
  10: { name: 'Performance Management', uidCourse: 'E-N05ZVP' },
  11: { name: 'Feedback', uidCourse: 'E-Y1QZ1K' },
  12: { name: 'Recruitment Management', uidCourse: 'E-Z1G903' },
  13: { name: 'Onboarding', uidCourse: 'E-P0Y20O' },
  14: { name: 'Reimbursement', uidCourse: 'E-Q072V6' }
}

// Helper function to verify basic auth
function verifyBasicAuth(request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }
  
  try {
    const base64Credentials = authHeader.split(' ')[1]
    const credentials = atob(base64Credentials)
    const [username, password] = credentials.split(':')
    
    return username === CONFIG.WEBHOOK_USERNAME && password === CONFIG.WEBHOOK_PASSWORD
  } catch (error) {
    console.error('Error verifying basic auth:', error)
    return false
  }
}

// Helper function to extract user info from webhook payload
function extractUserInfo(payload) {
  try {
    // Common Docebo webhook payload structures
    const user = payload.user || payload.learner || payload.data?.user || payload.data?.learner
    const course = payload.course || payload.data?.course
    
    if (!user || !course) {
      throw new Error('Missing user or course information in webhook payload')
    }
    
    return {
      userId: user.id || user.user_id || user.learner_id,
      userEmail: user.email || user.e_mail,
      userName: user.name || user.firstname + ' ' + user.lastname || user.full_name,
      courseId: course.id || course.course_id,
      courseName: course.name || course.title,
      completionDate: payload.completion_date || payload.completed_at || new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to extract user info: ${error.message}`)
  }
}

// Function to generate certificate via Certopus API
async function generateCertificate(userInfo, courseMapping) {
  try {
    const certopusPayload = {
      organization_id: CONFIG.CERTOPUS_ORG_ID,
      event_id: CONFIG.CERTOPUS_EVENT_ID,
      category_id: CONFIG.CERTOPUS_CATEGORY_ID || undefined,
      recipient: {
        name: userInfo.userName,
        email: userInfo.userEmail,
        external_id: userInfo.userId.toString()
      },
      certificate_data: {
        course_name: courseMapping.name,
        course_uid: courseMapping.uidCourse,
        completion_date: userInfo.completionDate,
        docebo_course_id: userInfo.courseId.toString()
      },
      auto_publish: true,
      send_email: true
    }
    
    console.log('Generating certificate with payload:', JSON.stringify(certopusPayload, null, 2))
    
    const response = await fetch(`${CONFIG.CERTOPUS_API_URL}/certificates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.CERTOPUS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(certopusPayload)
    })
    
    const responseData = await response.text()
    
    if (!response.ok) {
      throw new Error(`Certopus API error (${response.status}): ${responseData}`)
    }
    
    const certificate = JSON.parse(responseData)
    console.log('Certificate generated successfully:', certificate)
    
    return {
      success: true,
      certificate_id: certificate.id || certificate.certificate_id,
      certificate_url: certificate.url || certificate.certificate_url,
      message: 'Certificate generated successfully'
    }
  } catch (error) {
    console.error('Error generating certificate:', error)
    throw error
  }
}

// Main webhook handler
async function handleWebhook(request) {
  try {
    // Verify basic authentication
    if (!verifyBasicAuth(request)) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Docebo Webhook"'
        }
      })
    }
    
    // Parse webhook payload
    const payload = await request.json()
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2))
    
    // Check if this is a course completion event
    const eventType = payload.event || payload.type || payload.event_type
    if (!eventType || !eventType.includes('completion') && !eventType.includes('completed')) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Event ignored (not a completion event)',
        event_type: eventType
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Extract user information
    const userInfo = extractUserInfo(payload)
    console.log('Extracted user info:', userInfo)
    
    // Check if course is mapped
    const courseMapping = COURSE_MAPPING[userInfo.courseId]
    if (!courseMapping) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Course not mapped for certificate generation',
        course_id: userInfo.courseId,
        available_courses: Object.keys(COURSE_MAPPING).map(id => ({
          id: parseInt(id),
          name: COURSE_MAPPING[id].name
        }))
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Generate certificate
    const certificateResult = await generateCertificate(userInfo, courseMapping)
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Certificate generated successfully',
      user: {
        id: userInfo.userId,
        name: userInfo.userName,
        email: userInfo.userEmail
      },
      course: {
        id: userInfo.courseId,
        name: courseMapping.name,
        uid: courseMapping.uidCourse
      },
      certificate: certificateResult
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Health check endpoint
function handleHealthCheck() {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'Docebo-Certopus Integration Worker',
    timestamp: new Date().toISOString(),
    mapped_courses: Object.keys(COURSE_MAPPING).length,
    version: '1.0.0'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Main request handler
async function handleRequest(request) {
  const url = new URL(request.url)
  
  // CORS headers for preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }
  
  // Route handling
  switch (url.pathname) {
    case '/':
    case '/health':
      return handleHealthCheck()
      
    case '/webhook':
      if (request.method === 'POST') {
        return await handleWebhook(request)
      } else {
        return new Response('Method not allowed', { status: 405 })
      }
      
    case '/courses':
      // Return available course mappings
      return new Response(JSON.stringify({
        courses: Object.entries(COURSE_MAPPING).map(([id, course]) => ({
          id: parseInt(id),
          name: course.name,
          uid: course.uidCourse
        }))
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
    default:
      return new Response(JSON.stringify({
        error: 'Not Found',
        available_endpoints: [
          'GET / - Health check',
          'GET /health - Health check',
          'POST /webhook - Webhook endpoint (requires basic auth)',
          'GET /courses - List available course mappings'
        ]
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
  }
}

// Event listener for Cloudflare Workers
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Export for ES modules (newer Workers runtime)
export default {
  async fetch(request, env, ctx) {
    // Override config with environment variables if available
    if (env) {
      CONFIG.WEBHOOK_USERNAME = env.WEBHOOK_USERNAME || CONFIG.WEBHOOK_USERNAME
      CONFIG.WEBHOOK_PASSWORD = env.WEBHOOK_PASSWORD || CONFIG.WEBHOOK_PASSWORD
      CONFIG.CERTOPUS_API_URL = env.CERTOPUS_API_URL || CONFIG.CERTOPUS_API_URL
      CONFIG.CERTOPUS_API_KEY = env.CERTOPUS_API_KEY || CONFIG.CERTOPUS_API_KEY
      CONFIG.CERTOPUS_ORG_ID = env.CERTOPUS_ORG_ID || CONFIG.CERTOPUS_ORG_ID
      CONFIG.CERTOPUS_EVENT_ID = env.CERTOPUS_EVENT_ID || CONFIG.CERTOPUS_EVENT_ID
      CONFIG.CERTOPUS_CATEGORY_ID = env.CERTOPUS_CATEGORY_ID || CONFIG.CERTOPUS_CATEGORY_ID
    }
    
    return handleRequest(request)
  }
}