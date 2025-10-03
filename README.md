# Docebo-Certopus Integration

Automatically generate certificates via Certopus when learners complete courses in Docebo. This integration uses webhooks to trigger certificate generation in real-time.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Docebo Setup](#docebo-setup)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Security](#security)
- [Development](#development)

## 🎯 Overview

This Next.js application serves as a middleware between Docebo LMS and Certopus certificate generation platform. When a learner completes a course in Docebo, a webhook triggers this application to automatically generate and issue a personalized certificate through Certopus.

## ✨ Features

- **Automated Certificate Generation**: Instant certificate issuance upon course completion
- **Flexible Field Mapping**: Map Docebo user fields to Certopus certificate fields
- **Multi-Organization Support**: Handle multiple Certopus organizations and events
- **Course-Specific Configuration**: Different certificate templates per course
- **Retry Mechanism**: Automatic retry for failed certificate generations
- **Admin Dashboard**: Web interface for managing course mappings
- **Secure Authentication**: 
  - Password-protected admin interface
  - HTTP Basic Auth for webhook endpoint
- **Detailed Logging**: Track certificate generation status and errors

## 🏗 Architecture

```
┌─────────┐         ┌──────────────────┐         ┌──────────┐
│ Docebo  │ Webhook │  Next.js App     │   API   │ Certopus │
│   LMS   ├────────►│  (This Service)  ├────────►│ Platform │
└─────────┘         └──────────────────┘         └──────────┘
                            │
                            │ Store
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │   Database   │
                    └──────────────┘
```

**Flow:**
1. Learner completes a course in Docebo
2. Docebo sends webhook to `/api/webhook` with course completion data
3. Application authenticates the webhook request
4. Fetches user details from Docebo API
5. Looks up course mapping configuration
6. Generates certificate via Certopus API with mapped fields
7. Stores certificate record in database

## 📦 Prerequisites

Before you begin, ensure you have:

### Required Accounts & Access

- **Docebo LMS Account** with admin access
  - API credentials (Client ID, Client Secret, Domain)
  - Ability to configure webhooks
- **Certopus Account** with API access
  - API Key from Certopus dashboard
- **PostgreSQL Database** (we recommend [Neon](https://neon.tech) for serverless PostgreSQL)
- **Hosting Platform** (Vercel, Railway, or any Node.js hosting)

### Development Tools

- Node.js 18+ and npm/yarn/pnpm
- Git

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/VrajGohil/certopus-docebo.git
cd certopus-docebo
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

## ⚙️ Configuration

### Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# Docebo API Credentials
DOCEBO_CLIENT_ID="your_docebo_client_id"
DOCEBO_CLIENT_SECRET="your_docebo_client_secret"
DOCEBO_DOMAIN="your-domain.docebosaas.com"

# Certopus API Credentials
CERTOPUS_API_KEY="your_certopus_api_key"

# Admin Authentication
# Generate a secure password with: openssl rand -base64 24
ADMIN_PASSWORD="your_secure_admin_password"

# Webhook Authentication (HTTP Basic Auth)
# These credentials will be used by Docebo to authenticate webhook requests
WEBHOOK_USERNAME="docebo_webhook"
WEBHOOK_PASSWORD="your_webhook_secure_password"

# Application URL (for webhook URL generation)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Generate Secure Passwords

```bash
# Generate admin password
openssl rand -base64 24

# Generate webhook password
openssl rand -base64 24
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/VrajGohil/certopus-docebo)

1. Click the "Deploy with Vercel" button
2. Connect your GitHub repository
3. Add all environment variables from `.env`
4. Deploy!

### Manual Deployment Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Set environment variables** on your hosting platform

3. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

### Deploy to Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Railway will automatically deploy on push

### Deploy to Custom Server

```bash
# Build the application
npm run build

# Start with PM2 (process manager)
pm2 start npm --name "docebo-certopus" -- start

# Or use systemd, Docker, etc.
```

## 🔧 Docebo Setup

### 1. Create API Credentials

1. Log in to Docebo as admin
2. Go to **Admin Menu** → **API & SSO** → **API Applications**
3. Click **Add Application**
4. Configure:
   - **Name**: Certopus Integration
   - **Grant Type**: Client Credentials
   - **Scopes**: Select required scopes:
     - `api:read:user`
     - `api:read:course`
5. Save and copy **Client ID** and **Client Secret**

### 2. Configure Webhook

1. Go to **Admin Menu** → **Advanced Settings** → **Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **Name**: Course Completion - Certopus
   - **Event**: Course Enrollment Status → Completed
   - **URL**: `https://your-domain.com/api/webhook`
   - **Authentication Method**: Basic Authentication
   - **Username**: `docebo_webhook` (from your WEBHOOK_USERNAME)
   - **Password**: Your WEBHOOK_PASSWORD value
   - **Content Type**: application/json
4. Test the webhook
5. Save

**Alternative URL Format with Embedded Credentials:**
```
https://docebo_webhook:your_webhook_password@your-domain.com/api/webhook
```

## 📖 Usage

### Access Admin Dashboard

1. Navigate to `https://your-domain.com`
2. Log in with your `ADMIN_PASSWORD`
3. You'll see the dashboard with:
   - Total mappings count
   - Generated certificates count
   - Webhook URL (with copy button)

### Create Course Mapping

1. Click **Mappings** in the sidebar
2. Click **Create New Mapping**
3. Select **Docebo Course** from dropdown
4. Select **Certopus Organization**
5. Select **Certopus Event**
6. Select **Certificate Category**
7. **Map Recipient Fields**:
   - For each required field in the certificate template
   - Map to corresponding Docebo user field
   - Example: Certificate "Name" field → Docebo "first_name + last_name"
8. Click **Create Mapping**

### Field Mapping Examples

| Certificate Field | Docebo Field | Example |
|------------------|--------------|---------|
| Name | `{Name}` | John Doe |
| Email | `{email}` | john@example.com |
| Course Name | `{course_name}` | Advanced JavaScript |
| Completion Date | `{completion_date}` | 2025-10-03 |
| User ID | `{user_id}` | 12345 |

### View Generated Certificates

1. Go to **Certificates** page
2. See list of all generated certificates with:
   - Certificate ID
   - User email
   - Course name
   - Status (Success/Failed)
   - Retry button for failed certificates

### Retry Failed Certificates

If a certificate generation fails:
1. Navigate to **Certificates** page
2. Find the failed certificate
3. Click **Retry** button
4. System will attempt to regenerate the certificate

## 🔍 Troubleshooting

### Common Issues

#### 1. Webhook Not Triggering

**Symptoms**: No certificates generated after course completion

**Solutions**:
- Verify webhook is active in Docebo
- Check webhook URL is correct
- Test webhook from Docebo admin panel
- Check application logs for incoming requests
- Verify webhook authentication credentials

#### 2. Authentication Failures

**Symptoms**: 401 Unauthorized errors in Docebo webhook logs

**Solutions**:
- Verify `WEBHOOK_USERNAME` and `WEBHOOK_PASSWORD` match Docebo configuration
- Check Base64 encoding of credentials
- Ensure credentials don't contain special characters that need escaping

#### 3. Docebo API Errors

**Symptoms**: "Failed to fetch user details" errors

**Solutions**:
- Verify Docebo API credentials (`CLIENT_ID`, `CLIENT_SECRET`, `DOMAIN`)
- Check API scopes include `api:read:user`
- Ensure OAuth token is being generated correctly
- Check Docebo domain format (no https://, no trailing slash)

#### 4. Certopus API Errors

**Symptoms**: "Failed to generate certificate" errors

**Solutions**:
- Verify `CERTOPUS_API_KEY` is correct
- Check API key has necessary permissions
- Verify organization/event/category IDs exist
- Ensure field mappings match certificate template
- Check Certopus API rate limits

#### 5. Database Connection Issues

**Symptoms**: "Cannot connect to database" errors

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check database is accessible from your hosting environment
- Run `npx prisma migrate deploy`
- Verify SSL mode if required by your database host

#### 6. Certificate Field Mapping Errors

**Symptoms**: Certificates generated with missing/incorrect data

**Solutions**:
- Verify field mappings in course configuration
- Check Docebo user has all required fields populated
- Review certificate template field names in Certopus
- Check webhook payload includes expected data

### Debug Mode

Enable detailed logging:

```bash
# Add to .env
NODE_ENV=development
```

View logs:
```bash
# If using Vercel
vercel logs

# If using Railway
railway logs

# If using PM2
pm2 logs docebo-certopus
```

### Test Webhook Manually

Use curl to test the webhook endpoint:

```bash
curl -X POST https://your-domain.com/api/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'docebo_webhook:your_password' | base64)" \
  -d '{
    "event": {
      "body": {
        "webhook_id": 123,
        "original_domain": "your-domain.docebosaas.com",
        "event": "course.enrollment.completed",
        "message_id": "test-123",
        "payload": {
          "fired_at": "2025-10-03T12:00:00Z",
          "user_id": 12345,
          "course_id": 67890,
          "completion_date": "2025-10-03",
          "status": "completed",
          "enrollment_date": "2025-10-01"
        }
      }
    }
  }'
```

## 📚 API Reference

### Webhook Endpoint

**POST** `/api/webhook`

Receives course completion webhooks from Docebo.

**Authentication**: HTTP Basic Auth
- Username: `WEBHOOK_USERNAME`
- Password: `WEBHOOK_PASSWORD`

**Request Body**:
```json
{
  "event": {
    "body": {
      "webhook_id": 123,
      "original_domain": "your-domain.docebosaas.com",
      "event": "course.enrollment.completed",
      "message_id": "unique-message-id",
      "payload": {
        "fired_at": "2025-10-03T12:00:00Z",
        "user_id": 12345,
        "course_id": 67890,
        "completion_date": "2025-10-03",
        "status": "completed",
        "enrollment_date": "2025-10-01"
      }
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "certificateId": "cert_123456",
  "message": "Certificate generated successfully"
}
```

### Admin Endpoints

All admin endpoints require authentication via session cookie (obtained through login).

#### Login
**POST** `/api/auth/login`
```json
{
  "password": "your_admin_password"
}
```

#### Logout
**POST** `/api/auth/logout`

#### Get Mappings
**GET** `/api/mappings`

#### Create Mapping
**POST** `/api/mappings`
```json
{
  "courseId": "12345",
  "courseName": "Advanced JavaScript",
  "organizationId": "org_123",
  "eventId": "evt_456",
  "categoryId": "cat_789",
  "fieldMappings": {
    "Name": "{first_name} {last_name}",
    "Email": "{email}"
  }
}
```

#### Update Mapping
**PUT** `/api/mappings/[id]`

#### Delete Mapping
**DELETE** `/api/mappings/[id]`

#### Retry Certificate
**POST** `/api/certificates/[id]/retry`

## 🔒 Security

### Authentication Layers

1. **Admin Interface**: Password-protected via `ADMIN_PASSWORD`
2. **Webhook Endpoint**: HTTP Basic Authentication
3. **Session Management**: HttpOnly cookies with 24-hour expiration
4. **API Keys**: Environment variable storage only

### Best Practices

- **Use Strong Passwords**: Generate with `openssl rand -base64 24`
- **Rotate Credentials**: Periodically update API keys and passwords
- **HTTPS Only**: Always use HTTPS in production
- **Environment Variables**: Never commit `.env` file to version control
- **Database Security**: Use SSL connections, restrict IP access
- **Monitor Logs**: Regularly review authentication attempts
- **Rate Limiting**: Consider implementing rate limits for production

### Security Checklist

- [ ] Strong `ADMIN_PASSWORD` set
- [ ] Strong `WEBHOOK_PASSWORD` set
- [ ] All API keys stored in environment variables
- [ ] `.env` file in `.gitignore`
- [ ] HTTPS enabled on deployment
- [ ] Database SSL connection enabled
- [ ] Webhook authentication configured in Docebo
- [ ] Regular credential rotation schedule established

## 🛠 Development

### Local Development

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Access locally:**
   - App: `http://localhost:3000`
   - Webhook endpoint: `http://localhost:3000/api/webhook`

3. **Test with ngrok** (for webhook testing):
   ```bash
   ngrok http 3000
   ```
   Use the ngrok URL in Docebo webhook configuration.

### Database Management

```bash
# Create a new migration
npx prisma migrate dev --name description_of_changes

# Reset database (development only!)
npx prisma migrate reset

# Open Prisma Studio (GUI for database)
npx prisma studio

# Generate Prisma Client after schema changes
npx prisma generate
```

### Project Structure

```
certopus-docebo/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── certificates/      # Certificate management
│   │   ├── certopus/          # Certopus API proxy
│   │   ├── courses/           # Docebo course endpoints
│   │   ├── mappings/          # Course mapping CRUD
│   │   └── webhook/           # Main webhook handler
│   ├── certificates/          # Certificates page
│   ├── login/                 # Login page
│   ├── mappings/              # Mappings management page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Dashboard
├── components/
│   ├── ui/                    # Reusable UI components
│   └── sidebar.tsx            # Navigation sidebar
├── lib/
│   ├── auth.ts                # Authentication utilities
│   ├── certopus-service.ts    # Certopus API client
│   ├── docebo-service.ts      # Docebo API client
│   ├── prisma.ts              # Prisma client instance
│   └── utils.ts               # Utility functions
├── prisma/
│   └── schema.prisma          # Database schema
├── middleware.ts              # Route protection
├── .env.example               # Environment template
└── README.md                  # This file
```

### Adding New Features

1. **New API Endpoint**: Create route handler in `app/api/`
2. **New Page**: Create page component in `app/`
3. **Database Changes**: Update `schema.prisma` and run migrations
4. **New Service**: Add service class in `lib/`

### Running Tests

```bash
# Run tests (add your test framework)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues and questions:

- **GitHub Issues**: [Create an issue](https://github.com/VrajGohil/certopus-docebo/issues)
- **Documentation**: [Wiki](https://github.com/VrajGohil/certopus-docebo/wiki)
- **Docebo Support**: [Docebo Help Center](https://help.docebo.com)
- **Certopus Support**: [Certopus Documentation](https://certopus.com/docs)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Hosted on [Vercel](https://vercel.com/)

---

**Made with ❤️ for seamless certificate automation**
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