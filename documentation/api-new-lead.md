# Jumbo CRM - Leads API Integration Guide

This document explains how external partners (Housing.com, MagicBricks, 99acres, etc.) can integrate with the Jumbo CRM Leads API to submit buyer leads.

---

## Quick Start

```bash
curl -X POST https://your-domain.com/api/v1/leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "source": "housing.com",
    "externalId": "HOU-12345",
    "profile": {
      "fullName": "Rahul Sharma",
      "phone": "+919876543210",
      "email": "rahul@example.com"
    },
    "requirements": {
      "bhk": [2, 3],
      "budget_min": 5000000,
      "budget_max": 15000000,
      "localities": ["Whitefield", "Sarjapur Road"]
    }
  }'
```

---

## Authentication

All requests must include an API key in the header.

| Header       | Value           |
|--------------|-----------------|
| `x-api-key`  | Your API key    |

> **Note:** Contact the Jumbo CRM admin to obtain your API key.

---

## Endpoint

### Create Lead

**POST** `/api/v1/leads`

Creates a new buyer lead in the CRM system.

---

## Request Body

| Field                      | Type       | Required | Description                                      |
|----------------------------|------------|----------|--------------------------------------------------|
| `source`                   | string     | Yes      | Your platform identifier (e.g., `housing.com`)   |
| `externalId`               | string     | No*      | Your unique lead ID for deduplication            |
| `profile`                  | object     | Yes      | Buyer contact information                        |
| `profile.fullName`         | string     | Yes      | Buyer's full name (min 2 characters)             |
| `profile.phone`            | string     | Yes      | Phone in format `+91XXXXXXXXXX`                  |
| `profile.email`            | string     | No       | Buyer's email address                            |
| `requirements`             | object     | No       | Buyer's property requirements                    |
| `requirements.bhk`         | number[]   | No       | Array of BHK preferences (e.g., `[2, 3]`)        |
| `requirements.budget_min`  | number     | No       | Minimum budget in INR                            |
| `requirements.budget_max`  | number     | No       | Maximum budget in INR                            |
| `requirements.localities`  | string[]   | No       | Preferred localities                             |

> **\* Recommended:** Always send `externalId` to enable duplicate detection. If the same `externalId` + `source` combination is sent again, the API will return the existing lead instead of creating a duplicate.

---

## Phone Number Format

Phone numbers **must** be in Indian format with country code:

| Format              | Valid |
|---------------------|-------|
| `+919876543210`     | ✅    |
| `9876543210`        | ❌    |
| `09876543210`       | ❌    |
| `+91-9876543210`    | ❌    |

---

## Response

### Success - New Lead Created (201)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "profileId": "660e8400-e29b-41d4-a716-446655440001",
    "source": "housing.com",
    "externalId": "HOU-12345",
    "status": "new",
    "requirementJson": {
      "bhk": [2, 3],
      "budget_min": 5000000,
      "budget_max": 15000000,
      "localities": ["Whitefield", "Sarjapur Road"]
    },
    "createdAt": "2025-12-23T10:30:00.000Z",
    "profile": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "fullName": "Rahul Sharma",
      "phone": "+919876543210",
      "email": "rahul@example.com"
    },
    "assignedAgent": null
  },
  "message": "Lead created successfully"
}
```

### Success - Duplicate Lead (200)

If a lead with the same `externalId` and `source` already exists:

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "...": "existing lead data"
  },
  "message": "Lead already exists",
  "duplicate": true
}
```

---

## Error Responses

### 401 Unauthorized

Missing or invalid API key.

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

### 400 Validation Error

Invalid request body.

```json
{
  "error": "Validation Error",
  "message": "Invalid request body",
  "details": {
    "fieldErrors": {
      "profile.phone": ["Phone must be a valid Indian number (+91XXXXXXXXXX)"]
    },
    "formErrors": []
  }
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Failed to create lead"
}
```

---

## Example Payloads

### Minimal Payload

```json
{
  "source": "housing.com",
  "profile": {
    "fullName": "Priya Patel",
    "phone": "+919123456789"
  }
}
```

### Full Payload

```json
{
  "source": "magicbricks",
  "externalId": "MB-2025-98765",
  "profile": {
    "fullName": "Amit Kumar",
    "phone": "+918765432109",
    "email": "amit.kumar@gmail.com"
  },
  "requirements": {
    "bhk": [2],
    "budget_min": 8000000,
    "budget_max": 12000000,
    "localities": ["Koramangala", "Indiranagar", "HSR Layout"]
  }
}
```

---

## Integration Platforms

### Make.com / Integromat

1. Add an **HTTP** module (Make a request)
2. Configure:
   - **URL**: `https://your-domain.com/api/v1/leads`
   - **Method**: POST
   - **Headers**:
     - `Content-Type`: `application/json`
     - `x-api-key`: `YOUR_API_KEY`
   - **Body type**: Raw
   - **Content type**: JSON
   - **Request content**: Map your trigger fields to the schema above

### Zapier

1. Add a **Webhooks by Zapier** action (POST)
2. Configure:
   - **URL**: `https://your-domain.com/api/v1/leads`
   - **Payload Type**: JSON
   - **Headers**: `x-api-key: YOUR_API_KEY`
   - **Data**: Map fields from your trigger

---

## Best Practices

1. **Always send `externalId`** - This prevents duplicate leads if your webhook fires multiple times.

2. **Format phone numbers** - Transform phone numbers to `+91XXXXXXXXXX` format before sending.

3. **Handle duplicates gracefully** - Check for `"duplicate": true` in responses; these are not errors.

4. **Retry with backoff** - If you receive a 500 error, retry with exponential backoff (e.g., 1s, 2s, 4s).

5. **Log responses** - Store our `data.id` (UUID) for reference in support requests.

---

## Rate Limits

| Limit Type     | Value          |
|----------------|----------------|
| Requests/min   | 60             |
| Requests/hour  | 1000           |

Exceeding limits returns `429 Too Many Requests`.

---

## Support

For integration support or to request an API key:

- **Email**: support@jumbocrm.com
- **Slack**: #partner-integrations (for approved partners)

---

## Changelog

| Date       | Version | Changes                          |
|------------|---------|----------------------------------|
| 2025-12-23 | 1.0.0   | Initial API release              |

