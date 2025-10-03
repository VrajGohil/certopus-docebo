import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DoceboService } from '@/lib/docebo-service'
import { CertopusService } from '@/lib/certopus-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certificateId = params.id

    // Get the certificate and related data
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        courseMapping: {
          include: {
            doceboDomain: true
          }
        }
      }
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Update status to GENERATING
    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: 'GENERATING',
        errorMessage: null,
        updatedAt: new Date()
      }
    })

    try {
      // Get user details from Docebo API
      const userDetails = await getUserDetailsFromDocebo(
        certificate.doceboUserId, 
        certificate.courseMapping.doceboDomain?.name || 'default'
      )
      
      if (!userDetails) {
        throw new Error(`Failed to get user details for user_id: ${certificate.doceboUserId}`)
      }

      // Get course details from Docebo API  
      const courseDetails = await getCourseDetailsFromDocebo(
        certificate.doceboCourseId,
        certificate.courseMapping.doceboDomain?.name || 'default'
      )
      
      if (!courseDetails) {
        throw new Error(`Failed to get course details for course_id: ${certificate.doceboCourseId}`)
      }

      // Generate certificate using Certopus API
      const certopusResult = await generateCertopusCredential({
        organisationId: certificate.courseMapping.certopusOrgId,
        eventId: certificate.courseMapping.certopusEventId,
        categoryId: certificate.courseMapping.certopusCategoryId,
        recipientName: certificate.userName,
        recipientEmail: certificate.userEmail,
        courseName: courseDetails.name,
        completionDate: certificate.completionDate.toISOString().split('T')[0],
        fieldMappings: certificate.courseMapping.fieldMappings,
        userDetails: userDetails,
        courseDetails: courseDetails,
        autoGenerate: certificate.courseMapping.autoGenerate,
        autoPublish: certificate.courseMapping.autoPublish
      })

      // Update certificate with Certopus details
      await prisma.certificate.update({
        where: { id: certificateId },
        data: {
          certopusCredentialId: certopusResult.id,
          certificateUrl: certopusResult.url,
          status: 'SUCCESS',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        success: true,
        certificateUrl: certopusResult.url
      })
    } catch (error: any) {
      // Update certificate with error
      await prisma.certificate.update({
        where: { id: certificateId },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Certificate generation failed',
          updatedAt: new Date()
        }
      })

      return NextResponse.json(
        { error: 'Failed to regenerate certificate', message: error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error retrying certificate generation:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

async function getUserDetailsFromDocebo(userId: number, domainName: string) {
  const doceboService = new DoceboService(
    process.env.DOCEBO_API_URL || 'https://doceboapi.docebosaas.com'
  )
  
  return await doceboService.getUserDetails(
    userId, 
    domainName, 
    process.env.DOCEBO_API_USERNAME || '', 
    process.env.DOCEBO_API_PASSWORD || ''
  )
}

async function getCourseDetailsFromDocebo(courseId: number, domainName: string) {
  const doceboService = new DoceboService(
    process.env.DOCEBO_API_URL || 'https://doceboapi.docebosaas.com'
  )
  
  return await doceboService.getCourseDetails(
    courseId, 
    domainName, 
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
  if (!customData['{course_name}'] && data.courseName) {
    customData['{course_name}'] = data.courseName
  }
  if (!customData['{completion_date}'] && data.completionDate) {
    customData['{completion_date}'] = formatDate(data.completionDate)
  }
  if (!customData['{recipient_name}'] && data.recipientName) {
    customData['{recipient_name}'] = data.recipientName
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