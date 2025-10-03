'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit2, Plus, Save, X, Settings2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CourseMapping {
  id: string
  doceboCourseId: string
  certopusOrganizationId: string
  certopusEventId: string
  certopusCategoryId?: string
  fieldMappings?: Record<string, string>
  autoGenerate: boolean
  createdAt: string
}



interface CertopusOrganization {
  id: string
  name: string
}

interface CertopusEvent {
  id: string
  name: string
}

interface CertopusCategory {
  id: string
  name: string
}

interface CertopusRecipientField {
  key: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  description?: string
}

interface DoceboCourse {
  id: number
  name: string
  description: string
  status: string
  type: string
}

export default function CourseMappingsPage() {
  const [mappings, setMappings] = useState<CourseMapping[]>([])
  const [organizations, setOrganizations] = useState<CertopusOrganization[]>([])
  const [events, setEvents] = useState<CertopusEvent[]>([])
  const [categories, setCategories] = useState<CertopusCategory[]>([])
  const [recipientFields, setRecipientFields] = useState<CertopusRecipientField[]>([])
  const [courses, setCourses] = useState<DoceboCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [courseSearch, setCourseSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMapping, setEditingMapping] = useState<CourseMapping | null>(null)
  const [formData, setFormData] = useState({
    doceboCourseId: '',
    certopusOrganizationId: '',
    certopusEventId: '',
    certopusCategoryId: '',
    fieldMappings: {} as Record<string, string>,
    autoGenerate: true
  })

  useEffect(() => {
    loadData()
    loadCourses()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (courseSearch.length >= 2 || courseSearch === '') {
        loadCourses()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [courseSearch])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load mappings
      const mappingsResponse = await fetch('/api/mappings')
      if (mappingsResponse.ok) {
        const mappingsData = await mappingsResponse.json()
        setMappings(mappingsData)
      } else {
        toast.error('Failed to load mappings')
      }

      // Load Certopus organizations (events will be loaded when organization is selected)
      await loadOrganizations()
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/certopus/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      } else {
        // Silently handle API errors - don't show errors to user
        console.log('Certopus organizations API unavailable')
        setOrganizations([])
      }
    } catch (error) {
      // Silently handle API errors - don't show errors to user
      console.log('Certopus organizations API error:', error instanceof Error ? error.message : 'Unknown error')
      setOrganizations([])
    }
  }

  const loadEvents = async (organizationId?: string) => {
    try {
      if (!organizationId) {
        setEvents([])
        return
      }
      
      const response = await fetch(`/api/certopus/events?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        // Silently handle API errors - don't show errors to user
        console.log('Certopus events API unavailable')
        setEvents([])
      }
    } catch (error) {
      // Silently handle API errors - don't show errors to user
      console.log('Certopus events API error:', error instanceof Error ? error.message : 'Unknown error')
      setEvents([])
    }
  }

  const loadCategories = async (organizationId?: string, eventId?: string) => {
    try {
      if (!organizationId || !eventId) {
        setCategories([])
        return
      }
      
      const response = await fetch(`/api/certopus/categories?organizationId=${organizationId}&eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        // Silently handle API errors - don't show errors to user
        console.log('Certopus categories API unavailable')
        setCategories([])
      }
    } catch (error) {
      // Silently handle API errors - don't show errors to user
      console.log('Certopus categories API error:', error instanceof Error ? error.message : 'Unknown error')
      setCategories([])
    }
  }

  const loadRecipientFields = async (organizationId?: string, eventId?: string, categoryId?: string) => {
    try {
      if (!organizationId || !eventId || !categoryId) {
        setRecipientFields([])
        return
      }
      
      const response = await fetch(`/api/certopus/recipient-fields?organizationId=${organizationId}&eventId=${eventId}&categoryId=${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        setRecipientFields(data)
      } else {
        // Silently handle API errors - don't show errors to user
        console.log('Certopus recipient fields API unavailable')
        setRecipientFields([])
      }
    } catch (error) {
      // Silently handle API errors - don't show errors to user
      console.log('Certopus recipient fields API error:', error instanceof Error ? error.message : 'Unknown error')
      setRecipientFields([])
    }
  }

  const loadCourses = async () => {
    try {
      setCoursesLoading(true)
      const params = new URLSearchParams()
      if (courseSearch) {
        params.set('search', courseSearch)
      }
      params.set('limit', '50')

      const response = await fetch(`/api/docebo/courses?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      } else {
        // Silently handle API errors - don't show errors to user
        console.log('Docebo API unavailable, using manual course input')
        setCourses([])
      }
    } catch (error) {
      // Silently handle API errors - don't show errors to user  
      console.log('Docebo API error:', error instanceof Error ? error.message : 'Unknown error')
      setCourses([])
    } finally {
      setCoursesLoading(false)
    }
  }

  const handleCreateMapping = async () => {
    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Course mapping created successfully')
        resetForm()
        loadData()
      } else {
        const error = await response.text()
        toast.error(`Failed to create mapping: ${error}`)
      }
    } catch (error) {
      console.error('Error creating mapping:', error)
      toast.error('Failed to create mapping')
    }
  }

  const handleUpdateMapping = async () => {
    if (!editingMapping) return

    try {
      const response = await fetch(`/api/mappings/${editingMapping.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Course mapping updated successfully')
        resetForm()
        loadData()
      } else {
        const error = await response.text()
        toast.error(`Failed to update mapping: ${error}`)
      }
    } catch (error) {
      console.error('Error updating mapping:', error)
      toast.error('Failed to update mapping')
    }
  }

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return

    try {
      const response = await fetch(`/api/mappings/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Course mapping deleted successfully')
        loadData()
      } else {
        const error = await response.text()
        toast.error(`Failed to delete mapping: ${error}`)
      }
    } catch (error) {
      console.error('Error deleting mapping:', error)
      toast.error('Failed to delete mapping')
    }
  }

  const resetForm = () => {
    setFormData({
      doceboCourseId: '',
      certopusOrganizationId: '',
      certopusEventId: '',
      certopusCategoryId: '',
      fieldMappings: {},
      autoGenerate: true
    })
    setCourseSearch('')
    setEditingMapping(null)
    setShowForm(false)
  }

  const startEdit = (mapping: CourseMapping) => {
    setFormData({
      doceboCourseId: mapping.doceboCourseId,
      certopusOrganizationId: mapping.certopusOrganizationId,
      certopusEventId: mapping.certopusEventId,
      certopusCategoryId: mapping.certopusCategoryId || '',
      fieldMappings: (mapping.fieldMappings as Record<string, string>) || {},
      autoGenerate: mapping.autoGenerate
    })
    // Pre-populate search with current course name if available
    const course = courses.find(c => c.id.toString() === mapping.doceboCourseId)
    if (course) {
      setCourseSearch(course.name)
    }
    setEditingMapping(mapping)
    setShowForm(true)
  }

  const getOrganizationName = (id: string) => {
    const org = organizations.find(o => o.id === id)
    return org?.name || id
  }

  const getEventName = (id: string) => {
    const event = events.find(e => e.id === id)
    return event?.name || id
  }

  const getCategoryName = (id: string) => {
    const category = categories.find(c => c.id === id)
    return category?.name || id
  }

  const getCourseName = (id: string) => {
    const course = courses.find(c => c.id.toString() === id)
    return course?.name || `Course ID: ${id}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course mappings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Course Mappings
          </h1>
          <p className="text-gray-600">
            Map Docebo courses to Certopus certificate templates
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      {/* Form Card */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingMapping ? 'Edit Course Mapping' : 'Create Course Mapping'}
            </CardTitle>
            <CardDescription>
              Configure how Docebo courses map to Certopus certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="courseSearch">Search Docebo Course</Label>
                <Input
                  id="courseSearch"
                  type="text"
                  placeholder="Search courses by name..."
                  value={courseSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCourseSearch(e.target.value)}
                />
                {coursesLoading && (
                  <p className="text-sm text-gray-500">Searching courses...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseId">Select Course</Label>
                {courses.length > 0 || coursesLoading ? (
                  <Select 
                    value={formData.doceboCourseId} 
                    onValueChange={(value: string) => setFormData({ ...formData, doceboCourseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{course.name}</span>
                              <span className="text-xs text-gray-500">ID: {course.id} • Type: {course.type}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-courses" disabled>
                          {coursesLoading ? 'Loading courses...' : courseSearch ? 'No courses found' : 'Start typing to search courses'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter course ID (e.g. 123)"
                      value={formData.doceboCourseId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, doceboCourseId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">API unavailable - enter course ID manually</p>
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2"></div>

              <div className="space-y-2">
                <Label htmlFor="organization">Certopus Organization</Label>
                {organizations.length > 0 ? (
                  <Select 
                    value={formData.certopusOrganizationId} 
                    onValueChange={(value: string) => {
                      setFormData({ 
                        ...formData, 
                        certopusOrganizationId: value,
                        certopusEventId: '', // Reset event selection
                        certopusCategoryId: '', // Reset category selection
                        fieldMappings: {} // Reset field mappings
                      })
                      loadEvents(value) // Load events for selected organization
                      setCategories([]) // Clear categories
                      setRecipientFields([]) // Clear recipient fields
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    <Input
                      type="text"
                      placeholder="Enter organization ID"
                      value={formData.certopusOrganizationId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, certopusOrganizationId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">API unavailable - enter organization ID manually</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="event">Certopus Event</Label>
                {!formData.certopusOrganizationId ? (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="First select an organization" />
                    </SelectTrigger>
                  </Select>
                ) : events.length > 0 ? (
                  <Select 
                    value={formData.certopusEventId} 
                    onValueChange={(value: string) => {
                      setFormData({ 
                        ...formData, 
                        certopusEventId: value,
                        certopusCategoryId: '', // Reset category selection
                        fieldMappings: {} // Reset field mappings
                      })
                      loadCategories(formData.certopusOrganizationId, value) // Load categories
                      setRecipientFields([]) // Clear recipient fields
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    <Input
                      type="text"
                      placeholder="Enter event ID"
                      value={formData.certopusEventId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, certopusEventId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">API unavailable - enter event ID manually</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Certopus Category</Label>
                {!formData.certopusEventId ? (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="First select an event" />
                    </SelectTrigger>
                  </Select>
                ) : categories.length > 0 ? (
                  <Select 
                    value={formData.certopusCategoryId} 
                    onValueChange={(value: string) => {
                      setFormData({ 
                        ...formData, 
                        certopusCategoryId: value,
                        fieldMappings: {} // Reset field mappings
                      })
                      loadRecipientFields(formData.certopusOrganizationId, formData.certopusEventId, value) // Load recipient fields
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    <Input
                      type="text"
                      placeholder="Enter category ID"
                      value={formData.certopusCategoryId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, certopusCategoryId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">API unavailable - enter category ID manually</p>
                  </div>
                )}
              </div>

              {recipientFields.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Field Mappings</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Map Certopus certificate fields to Docebo course data
                    </p>
                  </div>
                  
                  {recipientFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Select 
                        value={formData.fieldMappings[field.key] || ''} 
                        onValueChange={(value: string) => 
                          setFormData({ 
                            ...formData, 
                            fieldMappings: {
                              ...formData.fieldMappings,
                              [field.key]: value
                            }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select mapping for ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course_name">Course Name</SelectItem>
                          <SelectItem value="completion_date">Completion Date</SelectItem>
                          <SelectItem value="user_name">User Name</SelectItem>
                          <SelectItem value="user_email">User Email</SelectItem>
                          <SelectItem value="course_description">Course Description</SelectItem>
                          <SelectItem value="enrollment_date">Enrollment Date</SelectItem>
                          <SelectItem value="custom_static">Custom Static Value</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.description && (
                        <p className="text-xs text-gray-500">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="autoGenerate"
                checked={formData.autoGenerate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, autoGenerate: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="autoGenerate">
                Auto-generate certificates when course is completed
              </Label>
            </div>

            <div className="flex gap-4 mt-8">
              <Button 
                onClick={editingMapping ? handleUpdateMapping : handleCreateMapping}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingMapping ? 'Update' : 'Create'} Mapping
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Mappings</CardTitle>
          <CardDescription>
            All configured course-to-certificate mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <div className="text-center py-12">
              <Settings2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mappings configured</h3>
              <p className="text-gray-500 mb-4">
                Create your first course mapping to start generating certificates automatically.
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Mapping
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Auto-Generate</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{getCourseName(mapping.doceboCourseId)}</span>
                        <span className="text-xs text-gray-500">ID: {mapping.doceboCourseId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getOrganizationName(mapping.certopusOrganizationId)}
                    </TableCell>
                    <TableCell>
                      {getEventName(mapping.certopusEventId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={mapping.autoGenerate ? 'default' : 'secondary'}>
                        {mapping.autoGenerate ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(mapping.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(mapping)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMapping(mapping.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}