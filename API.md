# API Documentation

Comprehensive documentation for the Job Application Tracker REST API.

## Base URL

```link
Development:  http://localhost:8000
Production:   https://api.yourdomain.com
```

## Authentication

Currently, the API is open (no authentication required). For production, consider implementing JWT authentication.

## Response Format

All responses are JSON with the following structure:

### Success Response (2xx)

```json
{
  "id": 1,
  "company": "Google",
  "position_title": "Senior Software Engineer",
  ...
}
```

### Error Response (4xx, 5xx)

```json
{
  "detail": "Error message describing what went wrong"
}
```

## Common Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Endpoints

### Health Check

#### GET /health

Check if the API is running and responsive.

**Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2025-12-06T10:30:00Z"
}
```

**Example:**

```bash
curl http://localhost:8000/health
```

---

### Applications

#### POST /api/applications

Create a new job application.

**Request Body:**

```json
{
  "company": "Google",
  "position_title": "Senior Software Engineer",
  "current_stage": "resume_screening",
  "status": "pending",
  "application_date": "2025-12-06T10:30:00Z",
  "rejection_reason": null,
  "job_url": "https://careers.google.com/jobs/...",
  "notes": "Great opportunity for growth",
  "salary_min": 150000,
  "salary_max": 200000,
  "location": "San Francisco, CA",
  "application_source": "linkedin",
  "follow_up_date": null
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "company": "Google",
  "position_title": "Senior Software Engineer",
  "current_stage": "resume_screening",
  "status": "pending",
  "application_date": "2025-12-06T10:30:00Z",
  "rejection_reason": null,
  "job_url": "https://careers.google.com/jobs/...",
  "notes": "Great opportunity for growth",
  "salary_min": 150000,
  "salary_max": 200000,
  "location": "San Francisco, CA",
  "application_source": "linkedin",
  "follow_up_date": null,
  "created_at": "2025-12-06T10:30:00Z",
  "updated_at": "2025-12-06T10:30:00Z"
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "position_title": "Senior Software Engineer",
    "location": "San Francisco, CA"
  }'
```

**Validation Rules:**

- `company` (required): 1-255 characters
- `position_title` (required): 1-255 characters
- `current_stage`: One of [resume_screening, phone_screen, technical_round, onsite, offer, rejected]
- `status`: One of [pending, accepted, rejected, withdrawn]
- `application_source`: One of [linkedin, company_site, referral, job_board, recruiter, other]
- `salary_min`, `salary_max`: Positive numbers or null
- `application_date`: ISO 8601 datetime

---

#### GET /api/applications

List all applications with optional filters and pagination.

**Query Parameters:**

- `skip` (int, default: 0): Number of records to skip
- `limit` (int, default: 100, max: 1000): Number of records to return
- `company` (string): Filter by company name (case-insensitive)
- `stage` (string): Filter by application stage
- `status` (string): Filter by application status

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "company": "Google",
    "position_title": "Senior Software Engineer",
    ...
  },
  {
    "id": 2,
    "company": "Microsoft",
    "position_title": "Cloud Architect",
    ...
  }
]
```

**Examples:**

```bash
# Get first 10 applications
curl http://localhost:8000/api/applications?skip=0&limit=10

# Filter by company
curl http://localhost:8000/api/applications?company=Google

# Filter by stage and status
curl http://localhost:8000/api/applications?stage=technical_round&status=pending

# Multiple filters
curl "http://localhost:8000/api/applications?company=Google&status=rejected&skip=0&limit=50"
```

**Performance Notes:**

- Results are cached for 2 minutes
- Cache key is based on query parameters
- Cache automatically invalidated when applications are created/updated

---

#### GET /api/applications/{id}

Get a specific application by ID.

**Path Parameters:**

- `id` (int, required): Application ID

**Response (200 OK):**

```json
{
  "id": 1,
  "company": "Google",
  "position_title": "Senior Software Engineer",
  "current_stage": "technical_round",
  "status": "pending",
  "application_date": "2025-12-06T10:30:00Z",
  "rejection_reason": null,
  "job_url": "https://careers.google.com/jobs/...",
  "notes": "Great opportunity for growth",
  "salary_min": 150000,
  "salary_max": 200000,
  "location": "San Francisco, CA",
  "application_source": "linkedin",
  "follow_up_date": "2025-12-20T00:00:00Z",
  "created_at": "2025-12-06T10:30:00Z",
  "updated_at": "2025-12-10T15:45:00Z"
}
```

**Error Response (404 Not Found):**

```json
{
  "detail": "Application not found"
}
```

**Example:**

```bash
curl http://localhost:8000/api/applications/1
```

**Performance Notes:**

- Cached for 10 minutes
- Cache invalidated when application is updated

---

#### PUT /api/applications/{id}

Update an existing application.

**Path Parameters:**

- `id` (int, required): Application ID

**Request Body:** (all fields optional)

```json
{
  "company": "Google",
  "current_stage": "onsite",
  "status": "accepted",
  "notes": "Final round scheduled"
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "company": "Google",
  "position_title": "Senior Software Engineer",
  "current_stage": "onsite",
  "status": "accepted",
  ...
  "updated_at": "2025-12-11T09:00:00Z"
}
```

**Error Response (404 Not Found):**

```json
{
  "detail": "Application not found"
}
```

**Example:**

```bash
curl -X PUT http://localhost:8000/api/applications/1 \
  -H "Content-Type: application/json" \
  -d '{
    "current_stage": "onsite",
    "status": "accepted"
  }'
```

**Cache Invalidation:**

- Clears detail cache for this application
- Clears all application list caches
- Clears analytics caches

---

#### DELETE /api/applications/{id}

Delete an application.

**Path Parameters:**

- `id` (int, required): Application ID

**Response (204 No Content)**
No body returned.

**Error Response (404 Not Found):**

```json
{
  "detail": "Application not found"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:8000/api/applications/1
```

**Cache Invalidation:**

- Clears detail cache for deleted application
- Clears all application list caches
- Clears analytics caches

---

### Analytics

#### GET /api/analytics/overview

Get comprehensive analytics overview with key metrics.

**Query Parameters:** None

**Response (200 OK):**

```json
{
  "total_applications": 50,
  "active_applications": 12,
  "rejection_rate": 48.0,
  "interview_conversion_rate": 28.0,
  "average_response_time_days": 7.5,
  "offers_received": 2,
  "applications_by_stage": {
    "resume_screening": 15,
    "phone_screen": 12,
    "technical_round": 8,
    "onsite": 5,
    "offer": 2,
    "rejected": 24
  },
  "applications_by_source": {
    "linkedin": 20,
    "company_site": 15,
    "referral": 10,
    "job_board": 5,
    "recruiter": 0,
    "other": 0
  },
  "top_rejecting_companies": [
    {"company": "Company A", "rejections": 5},
    {"company": "Company B", "rejections": 3}
  ]
}
```

**Example:**

```bash
curl http://localhost:8000/api/analytics/overview
```

**Performance Notes:**

- Cached for 5 minutes
- Complex aggregation query optimized with database indexes
- Cache invalidated on any application change

---

#### GET /api/analytics/rejections

Get detailed rejection analysis by stage and company.

**Query Parameters:**

- `company` (string): Filter by specific company (optional)
- `days` (int, default: 30, min: 1): Analyze rejections from last N days

**Response (200 OK):**

```json
{
  "rejections_by_stage": {
    "resume_screening": 8,
    "phone_screen": 5,
    "technical_round": 3,
    "onsite": 2,
    "offer": 0,
    "rejected": 0
  },
  "rejections_by_company": {
    "Google": 5,
    "Microsoft": 3,
    "Amazon": 2
  },
  "total_rejections": 18,
  "rejection_rate": 35.5
}
```

**Examples:**

```bash
# Rejections from last 30 days
curl http://localhost:8000/api/analytics/rejections

# Rejections from last 90 days
curl http://localhost:8000/api/analytics/rejections?days=90

# Rejections for specific company
curl http://localhost:8000/api/analytics/rejections?company=Google
```

**Performance Notes:**

- Cached with filter parameters
- Cache TTL: 5 minutes

---

#### GET /api/analytics/time-series

Get time series data for applications over time.

**Query Parameters:**

- `days` (int, default: 90, min: 1, max: 365): Number of days to analyze

**Response (200 OK):**

```json
{
  "data": [
    {
      "date": "2025-09-07",
      "applications": 2,
      "rejections": 0
    },
    {
      "date": "2025-09-08",
      "applications": 1,
      "rejections": 1
    },
    ...
  ]
}
```

**Example:**

```bash
# Get last 90 days
curl http://localhost:8000/api/analytics/time-series

# Get last 180 days
curl http://localhost:8000/api/analytics/time-series?days=180
```

**Use Cases:**

- Visualize application trends
- Identify seasonal patterns
- Measure velocity of applications
- Track response patterns

---

#### POST /api/analytics/predict

Get ML prediction for success probability.

**Query Parameters:**

- `company` (string, required): Company name
- `source` (string, required): Application source (linkedin, company_site, referral, job_board, recruiter, other)
- `day_of_week` (int, required): Day of week (0=Monday, 1=Tuesday, ..., 6=Sunday)

**Response (200 OK):**

```json
{
  "success_probability": 0.65,
  "confidence": 0.85,
  "recommendations": [
    "This company has a 65% success rate historically",
    "Referrals typically have higher success rates - consider seeking referrals",
    "Follow up within 1-2 weeks after applying"
  ]
}
```

**Example:**

```bash
curl "http://localhost:8000/api/analytics/predict?company=Google&source=linkedin&day_of_week=2"
```

**Interpretation:**

- `success_probability`: Likelihood of success (0-1)
  - < 0.3: Low success rate, consider strategy changes
  - 0.3-0.7: Moderate success rate
  - > 0.7: High success rate
- `confidence`: Model confidence in prediction (0-1)
  - < 0.3: Limited historical data
  - 0.3-0.7: Moderate confidence
  - > 0.7: High confidence in prediction
- `recommendations`: Actionable suggestions

**ML Model Details:**

- Features: Company, source, day of week, hour, days since app
- Training: Last 6 months of data with clear outcomes
- Accuracy improves as more data is collected
- Can be retrained manually with `train_model.py`

---

## Error Handling

### Standard Error Responses

**400 Bad Request** - Invalid input data:

```json
{
  "detail": "Invalid input: company must be 1-255 characters"
}
```

**404 Not Found** - Resource doesn't exist:

```json
{
  "detail": "Application not found"
}
```

**500 Internal Server Error** - Server error:

```json
{
  "detail": "Internal server error"
}
```

### Handling Errors in Code

```typescript
// Example with Axios
try {
  const response = await apiClient.get('/api/applications/999');
} catch (error) {
  if (error.response?.status === 404) {
    console.log('Application not found');
  } else if (error.response?.status === 400) {
    console.log('Invalid request:', error.response.data.detail);
  } else {
    console.log('Server error');
  }
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider implementing:

- Per-IP rate limits
- Per-user rate limits (with authentication)
- Tiered limits for different endpoint categories

---

## Pagination

For list endpoints with many results, use pagination:

```bash
# Get first 20 results
curl http://localhost:8000/api/applications?skip=0&limit=20

# Get next 20 results
curl http://localhost:8000/api/applications?skip=20&limit=20

# Get results 100-150
curl http://localhost:8000/api/applications?skip=100&limit=50
```

---

## Caching

The API implements intelligent caching to improve performance:

### Cached Endpoints

- `GET /api/applications` - 2 min TTL
- `GET /api/applications/{id}` - 10 min TTL
- `GET /api/analytics/overview` - 5 min TTL
- `GET /api/analytics/rejections` - 5 min TTL
- `GET /api/analytics/time-series` - varies

### Cache Invalidation

Caches are automatically cleared when:

- `POST /api/applications` - Create new application
- `PUT /api/applications/{id}` - Update application
- `DELETE /api/applications/{id}` - Delete application

### Manual Cache Control

```bash
# No automatic cache control headers in v1.0
# Add ?nocache=true to bypass cache (development)
curl http://localhost:8000/api/applications?nocache=true
```

---

## Example Workflows

### Complete Application Workflow

```bash
# 1. Create application
APPLICATION=$(curl -X POST http://localhost:8000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "position_title": "Senior Software Engineer",
    "location": "San Francisco, CA",
    "application_source": "linkedin"
  }')

APP_ID=$(echo $APPLICATION | jq '.id')

# 2. Check analytics
curl http://localhost:8000/api/analytics/overview

# 3. Update application status
curl -X PUT http://localhost:8000/api/applications/$APP_ID \
  -H "Content-Type: application/json" \
  -d '{"current_stage": "phone_screen", "status": "accepted"}'

# 4. Get prediction
curl "http://localhost:8000/api/analytics/predict?company=Google&source=linkedin&day_of_week=2"

# 5. Delete if needed
curl -X DELETE http://localhost:8000/api/applications/$APP_ID
```

---

## OpenAPI/Swagger Documentation

Visit <http://localhost:8000/docs> for interactive API documentation with:

- Endpoint descriptions
- Request/response schemas
- Try-it-out functionality
- Parameter validation

---

## Version History

**v1.0.0** (December 2025)

- Initial release
- 7+ endpoints
- Redis caching
- ML predictions
- Analytics dashboard

---

**Last Updated**: December 2025
