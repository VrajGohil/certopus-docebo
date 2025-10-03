import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { DoceboService } from '@/lib/docebo-service'
import { CertopusService } from '@/lib/certopus-service'

// Webhook payload validation schema - supports multiple Docebo formats
const webhookSchema = z.object({
  context: z.object({
    id: z.string(),
    ts: z.string(),
  }).optional(),
  event: z.union([
    // Format 1: Nested event object
    z.object({
      body: z.object({
        webhook_id: z.number(),
        original_domain: z.string(),
        event: z.enum(['course.enrollment.completed']),
        fired_by_batch_action: z.boolean().optional(),
        message_id: z.string(),
        payload: z.object({
          fired_at: z.string(),
          user_id: z.number(),
          course_id: z.number(),
          completion_date: z.string(),
          subscribed_by_id: z.number().optional(),
          status: z.enum(['completed']),
          level: z.string().optional(),
          enrollment_date: z.string(),
          enrollment_date_begin_validity: z.string().nullable().optional(),
          enrollment_date_end_validity: z.string().nullable().optional(),
        }),
      }),
    }),
    // Format 2: Flat event string (legacy format)
    z.string(),
  ]),
  // Alternative flat format
  webhook_id: z.number().optional(),
  original_domain: z.string().optional(),
  message_id: z.string().optional(),
  payload: z.object({
    fired_at: z.string().optional(),
    user_id: z.number(),
    course_id: z.number(),
    completion_date: z.string(),
    subscribed_by_id: z.number().optional(),
    status: z.enum(['completed']).optional(),
    level: z.string().optional(),
    enrollment_date: z.string().optional(),
    enrollment_date_begin_validity: z.string().nullable().optional(),
    enrollment_date_end_validity: z.string().nullable().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  let body: any
  
  try {
    body = await request.json()
    
    // Log the raw payload for debugging
    console.log('Received webhook payload:', JSON.stringify(body, null, 2))
    
    // Validate webhook payload
    const validatedData = webhookSchema.parse(body)
    
    // Normalize the payload to handle different formats
    let eventData: any
    let payload: any
    let messageId: string
    let domain: string
    let eventType: string
    
    if (typeof validatedData.event === 'object' && validatedData.event.body) {
      // Format 1: Nested event object
      eventData = validatedData.event.body
      payload = eventData.payload
      messageId = eventData.message_id
      domain = eventData.original_domain
      eventType = eventData.event
    } else {
      // Format 2: Flat structure
      eventData = validatedData
      payload = validatedData.payload || {
        user_id: (validatedData as any).user_id,
        course_id: (validatedData as any).course_id,
        completion_date: (validatedData as any).completion_date,
        status: 'completed',
        enrollment_date: (validatedData as any).enrollment_date,
      }
      messageId = validatedData.message_id || `webhook_${Date.now()}`
      domain = validatedData.original_domain || 'default'
      eventType = typeof validatedData.event === 'string' ? validatedData.event : 'course.enrollment.completed'
    }

    console.log('Normalized webhook data:', {
      eventType,
      userId: payload.user_id,
      courseId: payload.course_id,
      messageId,
      domain
    })

    // Log the webhook (use upsert to handle retries)
    const doceboDomain = await prisma.doceboDomain.upsert({
      where: { name: domain },
      update: {},
      create: {
        name: domain,
        apiUrl: process.env.DOCEBO_API_URL || 'https://doceboapi.docebosaas.com',
        username: process.env.DOCEBO_API_USERNAME || '',
        password: process.env.DOCEBO_API_PASSWORD || '',
        active: false, // Will need manual configuration
      }
    })

    await prisma.webhookLog.upsert({
      where: { messageId },
      update: {
        status: 'RECEIVED',
        payload: body
      },
      create: {
        messageId,
        event: eventType,
        payload: body,
        status: 'RECEIVED',
        doceboDomainId: doceboDomain.id
      }
    })

    // Check if this is a course completion event
    if (eventType !== 'course.enrollment.completed' || (payload.status && payload.status !== 'completed')) {
      console.log('Webhook event not relevant for certificate generation')
      return NextResponse.json({
        success: true,
        message: 'Webhook received but not processed (not a course completion)'
      })
    }

    // Process certificate generation
    await processCertificateGeneration(payload, domain, messageId)

    return NextResponse.json({
      success: true,
      message: 'Certificate generation initiated successfully'
    })

  } catch (error) {
    console.error('Error processing Docebo webhook:', error)
    
    // Log the error if we can (use already parsed body)
    try {
      if (body) {
        const messageId = body?.event?.body?.message_id || body?.message_id || `error_${Date.now()}`
        const event = body?.event?.body?.event || body?.event || 'unknown'
        
        // Use upsert to avoid duplicate key errors
        await prisma.webhookLog.upsert({
          where: { messageId },
          update: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          },
          create: {
            messageId,
            event,
            payload: body,
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function processCertificateGeneration(
  payload: any, 
  domain: string, 
  messageId: string
) {
  try {
    const { user_id, course_id, completion_date } = payload

    // Update webhook log to processing
    await prisma.webhookLog.updateMany({
      where: { messageId },
      data: { status: 'PROCESSING' }
    })

    // Find course mapping
    const courseMapping = await prisma.courseMapping.findFirst({
      where: {
        doceboCourseId: course_id,
        doceboDomain: { name: domain },
        active: true
      },
      include: {
        doceboDomain: true
      }
    })

    if (!courseMapping) {
      throw new Error(`No course mapping found for course_id: ${course_id} in domain: ${domain}`)
    }

    // Get user details from Docebo API
    const userDetails = await getUserDetailsFromDocebo(user_id, domain)
    
    if (!userDetails) {
      throw new Error(`Failed to get user details for user_id: ${user_id}`)
    }

    // Validate required user information
    if (!userDetails.email || userDetails.email.trim() === '') {
      throw new Error(`User email not found in Docebo for user_id: ${user_id}. Email is required for certificate generation.`)
    }

    // Get course details from Docebo API
    const courseDetails = await getCourseDetailsFromDocebo(course_id, domain)
    
    if (!courseDetails) {
      throw new Error(`Failed to get course details for course_id: ${course_id}`)
    }

    // Prepare user name with fallback
    const userFullName = [userDetails.firstname, userDetails.lastname]
      .filter(n => n && n.trim() !== '')
      .join(' ') || userDetails.username || `User ${user_id}`

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        doceboUserId: user_id,
        doceboCourseId: course_id,
        userEmail: userDetails.email.trim(),
        userName: userFullName,
        completionDate: new Date(completion_date),
        status: 'GENERATING',
        doceboDomain: { connect: { id: courseMapping.doceboDomainId } },
        courseMapping: { connect: { id: courseMapping.id } }
      }
    })

    // Log course mapping details for debugging
    console.log('Course mapping details:', {
      certopusOrgId: courseMapping.certopusOrgId,
      certopusEventId: courseMapping.certopusEventId,
      certopusCategoryId: courseMapping.certopusCategoryId,
      fieldMappings: courseMapping.fieldMappings
    })

    // Generate certificate using Certopus API
    const certopusResult = await generateCertopusCredential({
      organisationId: courseMapping.certopusOrgId,
      eventId: courseMapping.certopusEventId,
      categoryId: courseMapping.certopusCategoryId || '',
      recipientName: `${userDetails.firstname} ${userDetails.lastname}`,
      recipientEmail: userDetails.email,
      courseName: courseDetails.name,
      completionDate: completion_date,
      fieldMappings: courseMapping.fieldMappings,
      userDetails: userDetails,
      courseDetails: courseDetails,
      autoGenerate: courseMapping.autoGenerate,
      autoPublish: courseMapping.autoPublish
    })

    // Update certificate with Certopus details
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        certopusCredentialId: certopusResult.id,
        certificateUrl: certopusResult.url,
        status: 'SUCCESS'
      }
    })

    // Update webhook log to success
    await prisma.webhookLog.updateMany({
      where: { messageId },
      data: { status: 'SUCCESS' }
    })

    console.log('Certificate generated successfully:', {
      certificateId: certificate.id,
      certopusCredentialId: certopusResult.id,
      recipientEmail: userDetails.email
    })

  } catch (error) {
    console.error('Error in certificate generation:', error)
    
    // Update webhook log to failed
    await prisma.webhookLog.updateMany({
      where: { messageId },
      data: { 
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    throw error
  }
}

async function getUserDetailsFromDocebo(userId: number, domain: string) {
  const doceboService = new DoceboService(
    process.env.DOCEBO_API_URL || 'https://doceboapi.docebosaas.com'
  )
  
  const username = process.env.DOCEBO_API_USERNAME || ''
  const password = process.env.DOCEBO_API_PASSWORD || ''
  
  // Try primary API first
  let userDetails = await doceboService.getUserDetails(userId, domain, username, password)
  
  // If email is missing, try alternative API
  if (userDetails && (!userDetails.email || userDetails.email.trim() === '')) {
    console.log('Email not found in primary API, trying alternative endpoint...')
    const altDetails = await doceboService.getUserDetailsAlternative(userId, domain, username, password)
    if (altDetails && altDetails.email) {
      userDetails = altDetails
    }
  }
  
  return userDetails
}

async function getCourseDetailsFromDocebo(courseId: number, domain: string) {
  const doceboService = new DoceboService(
    process.env.DOCEBO_API_URL || 'https://doceboapi.docebosaas.com'
  )
  
  return await doceboService.getCourseDetails(
    courseId, 
    domain, 
    process.env.DOCEBO_API_USERNAME || '', 
    process.env.DOCEBO_API_PASSWORD || ''
  )
}

async function generateCertopusCredential(data: any) {
  const apiKey = process.env.CERTOPUS_API_KEY
  const apiUrl = process.env.CERTOPUS_API_URL || 'https://api.certopus.com/v1'
  
  if (!apiKey) {
    throw new Error('CERTOPUS_API_KEY not configured')
  }
  
  // Build dynamic field mappings based on the configuration
  const customData: Record<string, any> = {}
  
  if (data.fieldMappings && typeof data.fieldMappings === 'object') {
    Object.entries(data.fieldMappings).forEach(([certopusField, doceboField]) => {
      switch (doceboField) {
        case 'course_name':
          customData[certopusField] = data.courseName || data.courseDetails?.name
          break
        case 'completion_date':
          customData[certopusField] = formatDate(data.completionDate)
          break
        case 'user_name':
          customData[certopusField] = data.recipientName
          break
        case 'user_email':
          customData[certopusField] = data.recipientEmail
          break
        case 'course_description':
          customData[certopusField] = data.courseDetails?.description || ''
          break
        case 'enrollment_date':
          customData[certopusField] = formatDate(data.userDetails?.enrollment_date || data.completionDate)
          break
        case 'custom_static':
          // For static values, the field mapping value should be the actual static text
          customData[certopusField] = doceboField
          break
        default:
          // Unknown mapping, use as static value
          customData[certopusField] = doceboField
      }
    })
  }
  
  // Add default mappings for common fields if not already mapped
  // Note: Use {Name} as the standard Certopus field for recipient name
  if (!customData['{Name}'] && data.recipientName) {
    customData['{Name}'] = data.recipientName
  }
  if (!customData['{course_name}'] && data.courseName) {
    customData['{course_name}'] = data.courseName
  }
  if (!customData['{completion_date}'] && data.completionDate) {
    customData['{completion_date}'] = formatDate(data.completionDate)
  }
  
  console.log('Generated custom data for certificate:', customData)
  
  const certopusService = new CertopusService(apiKey, apiUrl)
  
  return await certopusService.createCredential({
    organisationId: data.organisationId,
    eventId: data.eventId,
    categoryId: data.categoryId,
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail,
    courseName: data.courseName,
    completionDate: data.completionDate,
    customFields: customData,
    autoGenerate: data.autoGenerate,
    autoPublish: data.autoPublish
  })
}

function formatDate(dateString: string): string {
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