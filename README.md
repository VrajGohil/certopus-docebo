# Docebo-Certopus Integration Platform

A comprehensive Next.js application for automating certificate generation when students complete Docebo courses using the Certopus API.

## Features

🚀 **Web Interface**
- Dashboard with overview metrics
- Docebo domain management
- Course-to-certificate mapping configuration
- Real-time webhook monitoring
- Certificate generation tracking

🔗 **Webhook Processing**
- Automated webhook handling for course completions
- Real-time certificate generation
- Error tracking and retry mechanisms
- Webhook event logging

🎓 **Certificate Management**
- Dynamic field mapping between Docebo and Certopus
- Bulk certificate generation
- Certificate status tracking
- Custom field configuration

📊 **Monitoring & Analytics**
- Real-time activity feed
- Certificate generation statistics
- Webhook event monitoring
- Error tracking and reporting

## Architecture

```
Docebo → Webhook → Next.js App → Database → Certopus API
                     ↓
              Web Interface (React)
```

## Quick Start

### 1. Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Docebo API credentials
- Certopus API key

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd docebo-certopus-integration

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Initialize Prisma and create database schema
npx prisma generate
npx prisma db push

# Optional: Open Prisma Studio to view data
npx prisma studio
```

### 4. Configuration

Edit `.env` file with your settings:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/docebo_certopus"

# Docebo API Configuration
DOCEBO_API_URL="https://doceboapi.docebosaas.com"
DOCEBO_API_USERNAME="your_docebo_username"
DOCEBO_API_PASSWORD="your_docebo_password"

# Certopus API Configuration  
CERTOPUS_API_URL="https://api.certopus.com/v1"
CERTOPUS_API_KEY="your_certopus_api_key"
```

### 5. Start the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Visit http://localhost:3000 to access the application.

## Configuration Workflow

### 1. Setup Docebo Domain

1. Navigate to **Domains** in the web interface
2. Click "Add Domain" 
3. Configure:
   - Domain name (e.g., yourcompany.docebosaas.com)
   - API credentials (username/password)
   - Test the connection

### 2. Configure Certopus Integration

The application automatically uses your Certopus API key to:
- Fetch available organizations
- Load events and certificate templates
- Cache template field requirements

### 3. Create Course Mappings

1. Go to **Course Mappings**
2. Click "Add Mapping"
3. Select:
   - Docebo domain and course
   - Certopus organization, event, and certificate template
   - Map fields between Docebo user data and certificate fields
   - Configure auto-generation settings

### 4. Setup Docebo Webhooks

Configure Docebo to send webhooks to your application:

**Webhook URL**: `https://yourdomain.com/api/webhook`
**Event**: `course.enrollment.completed` 
**Method**: POST
**Content-Type**: application/json

## API Endpoints

### Webhook Endpoint
```
POST /api/webhook
```
Receives Docebo course completion webhooks and triggers certificate generation.

### Domain Management
```
GET /api/domains - List configured domains
POST /api/domains - Add new domain
PUT /api/domains/[id] - Update domain
DELETE /api/domains/[id] - Remove domain
```

### Course Mappings
```
GET /api/mappings - List course mappings
POST /api/mappings - Create new mapping
PUT /api/mappings/[id] - Update mapping
DELETE /api/mappings/[id] - Remove mapping
```

### Certificate Tracking
```
GET /api/certificates - List generated certificates
GET /api/certificates/[id] - Get certificate details
POST /api/certificates/[id]/retry - Retry failed certificate
```

### Certopus Integration
```
GET /api/certopus/organisations - List Certopus organizations
GET /api/certopus/events/[orgId] - List events for organization
GET /api/certopus/categories - List certificate categories
GET /api/certopus/fields - Get template field requirements
```

## Database Schema

The application uses Prisma with PostgreSQL to store:

- **DoceboDomain**: Docebo instance configurations
- **CourseMapping**: Course-to-certificate mappings
- **Certificate**: Generated certificate records
- **WebhookLog**: Webhook processing logs
- **CertopusOrganisation/Event/Category**: Cached Certopus data

## Web Interface Pages

### Dashboard (`/`)
- Overview metrics and statistics
- Recent activity feed
- Quick action buttons
- System status indicators

### Domains (`/domains`)
- List configured Docebo domains
- Add/edit domain configurations  
- Test API connections
- View domain statistics

### Course Mappings (`/mappings`)
- List course-to-certificate mappings
- Create new mappings with field configuration
- Edit existing mappings
- Enable/disable mappings

### Certificates (`/certificates`)
- View generated certificates
- Search and filter certificates
- Retry failed generations
- Export certificate data

### Webhooks (`/webhooks`)
- Webhook setup instructions
- View webhook logs
- Debug webhook issues
- Webhook testing tools

### Activity (`/activity`)
- Real-time activity feed
- Certificate generation events
- Error logs and alerts
- System notifications

## Webhook Processing Flow

1. **Webhook Received**: Docebo sends course completion event
2. **Validation**: Payload validated and logged
3. **Domain Lookup**: Find matching Docebo domain configuration
4. **Course Mapping**: Check for course-to-certificate mapping
5. **User Data**: Fetch user details from Docebo API
6. **Course Data**: Fetch course details from Docebo API  
7. **Field Mapping**: Map Docebo fields to Certopus template fields
8. **Certificate Creation**: Generate certificate via Certopus API
9. **Status Update**: Update certificate status and webhook log

## Certificate Field Mapping

The application supports dynamic field mapping between Docebo user/course data and Certopus certificate templates:

**Standard Fields:**
- `{recipient_name}` - User's full name
- `{recipient_email}` - User's email address  
- `{course_name}` - Course title
- `{completion_date}` - Formatted completion date
- `{course_code}` - Course identifier

**Custom Fields:**
- Map any Docebo user field to certificate template fields
- Support for calculated fields and transformations
- Date formatting and text transformations

## Error Handling

- **Webhook Failures**: Logged with retry mechanisms
- **API Errors**: Comprehensive error logging and user notifications
- **Certificate Failures**: Detailed error tracking with manual retry options
- **Connection Issues**: Automatic retry with exponential backoff

## Security

- **API Authentication**: Secure storage of API credentials
- **Webhook Validation**: Request validation and duplicate prevention
- **Rate Limiting**: Built-in rate limiting for API calls
- **Error Sanitization**: Sensitive data protection in logs

## Monitoring & Logging

- **Structured Logging**: JSON-formatted logs for easy parsing
- **Error Tracking**: Comprehensive error collection and reporting  
- **Performance Metrics**: API response times and success rates
- **Health Checks**: System health monitoring endpoints

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
Ensure all required environment variables are configured in production:
- Database connection
- API credentials
- Security keys
- Domain configurations

### Database Migration
```bash
npx prisma migrate deploy
```

## Development

### Project Structure
```
/app                 # Next.js app directory
  /api              # API routes
  /domains          # Domain management pages
  /mappings         # Course mapping pages
  /certificates     # Certificate tracking pages
  /webhooks         # Webhook management pages
/components         # React components
  /ui              # Reusable UI components
/lib               # Utility libraries and services
/prisma           # Database schema and migrations
```

### Adding New Features

1. **Database Changes**: Update Prisma schema and migrate
2. **API Routes**: Add new API endpoints in `/app/api`
3. **UI Components**: Create reusable components in `/components`
4. **Pages**: Add new pages in `/app` directory
5. **Services**: Add business logic in `/lib` directory

### Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (when implemented)
npm run test
```

## Troubleshooting

### Common Issues

1. **Webhook Not Received**
   - Check webhook URL configuration in Docebo
   - Verify network connectivity
   - Check webhook logs in the application

2. **Certificate Generation Fails**
   - Verify Certopus API credentials
   - Check template field mappings
   - Review certificate error logs

3. **Database Connection Issues**
   - Verify DATABASE_URL configuration
   - Check database server status
   - Run database migrations

4. **API Authentication Failures**
   - Verify Docebo API credentials
   - Check API user permissions
   - Review API endpoint URLs

### Debug Mode

Set environment variable for detailed logging:
```bash
LOG_LEVEL=debug npm run dev
```

## Support

For issues and questions:
- Check the application logs and error messages
- Review API documentation for Docebo and Certopus
- Check GitHub issues for known problems

## License

MIT License - see LICENSE file for details