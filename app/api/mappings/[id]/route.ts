import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// PUT /api/mappings/[id] - Update a course mapping
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      doceboCourseId,
      certopusOrganizationId,
      certopusEventId,
      certopusCategoryId,
      fieldMappings,
      autoGenerate = true
    } = body

    // Validate required fields
    if (!doceboCourseId || !certopusOrganizationId || !certopusEventId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if mapping exists
    const existingMapping = await prisma.courseMapping.findUnique({
      where: { id }
    })

    if (!existingMapping) {
      return NextResponse.json(
        { error: 'Mapping not found' },
        { status: 404 }
      )
    }

    // Update the mapping
    const mapping = await prisma.courseMapping.update({
      where: { id },
      data: {
        doceboCourseId: parseInt(doceboCourseId),
        certopusOrgId: certopusOrganizationId,
        certopusEventId: certopusEventId,
        certopusCategoryId: certopusCategoryId || '',
        fieldMappings: fieldMappings || existingMapping.fieldMappings || {},
        autoGenerate: autoGenerate,
        updatedAt: new Date()
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

    return NextResponse.json(transformedMapping)
  } catch (error) {
    console.error('Error updating mapping:', error)
    return NextResponse.json(
      { error: 'Failed to update mapping' },
      { status: 500 }
    )
  }
}

// DELETE /api/mappings/[id] - Delete a course mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if mapping exists
    const existingMapping = await prisma.courseMapping.findUnique({
      where: { id }
    })

    if (!existingMapping) {
      return NextResponse.json(
        { error: 'Mapping not found' },
        { status: 404 }
      )
    }

    // Hard delete the mapping from database
    await prisma.courseMapping.delete({
      where: { id }
    })

    console.log(`Course mapping deleted: ${id}`)

    return NextResponse.json({ 
      success: true,
      message: 'Course mapping deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting mapping:', error)
    return NextResponse.json(
      { error: 'Failed to delete mapping' },
      { status: 500 }
    )
  }
}