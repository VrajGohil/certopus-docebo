import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/mappings - Get all course mappings
export async function GET() {
  try {
    // For single client deployment, we'll get the first (and should be only) domain
    const domain = await prisma.doceboDomain.findFirst()
    
    if (!domain) {
      return NextResponse.json({ error: 'No domain configured' }, { status: 404 })
    }

    const mappings = await prisma.courseMapping.findMany({
      where: {
        doceboDomainId: domain.id,
        active: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match our frontend interface
    const transformedMappings = mappings.map(mapping => ({
      id: mapping.id,
      doceboCourseId: mapping.doceboCourseId.toString(),
      certopusOrganizationId: mapping.certopusOrgId,
      certopusEventId: mapping.certopusEventId,
      certopusCategoryId: mapping.certopusCategoryId,
      autoGenerate: mapping.autoGenerate,
      createdAt: mapping.createdAt.toISOString()
    }))

    return NextResponse.json(transformedMappings)
  } catch (error) {
    console.error('Error fetching mappings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mappings' },
      { status: 500 }
    )
  }
}

// POST /api/mappings - Create a new course mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      doceboCourseId, 
      certopusOrganizationId, 
      certopusEventId,
      certopusCategoryId,
      fieldMappings,
      autoGenerate = true 
    } = body    // Validate required fields
    if (!doceboCourseId || !certopusOrganizationId || !certopusEventId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For single client deployment, we'll get the first (and should be only) domain
    const domain = await prisma.doceboDomain.findFirst()
    
    if (!domain) {
      return NextResponse.json({ error: 'No domain configured' }, { status: 404 })
    }

    // Check if mapping already exists
    const existingMapping = await prisma.courseMapping.findUnique({
      where: {
        doceboDomainId_doceboCourseId: {
          doceboDomainId: domain.id,
          doceboCourseId: parseInt(doceboCourseId)
        }
      }
    })

    if (existingMapping) {
      return NextResponse.json(
        { error: 'Mapping already exists for this course' },
        { status: 409 }
      )
    }

    // Create the mapping
    const mapping = await prisma.courseMapping.create({
      data: {
        doceboDomainId: domain.id,
        doceboCourseId: parseInt(doceboCourseId),
        certopusOrgId: certopusOrganizationId,
        certopusEventId: certopusEventId,
        certopusCategoryId: certopusCategoryId || '',
        fieldMappings: fieldMappings || {},
        autoGenerate: autoGenerate
      }
    })

    // Transform the data to match our frontend interface
    const transformedMapping = {
      id: mapping.id,
      doceboCourseId: mapping.doceboCourseId.toString(),
      certopusOrganizationId: mapping.certopusOrgId,
      certopusEventId: mapping.certopusEventId,
      certopusCategoryId: mapping.certopusCategoryId,
      autoGenerate: mapping.autoGenerate,
      createdAt: mapping.createdAt.toISOString()
    }

    return NextResponse.json(transformedMapping, { status: 201 })
  } catch (error) {
    console.error('Error creating mapping:', error)
    return NextResponse.json(
      { error: 'Failed to create mapping' },
      { status: 500 }
    )
  }
}