# 🔥 Blaze Intelligence API Documentation

## Overview
Blaze Intelligence provides real-time sports analytics data through REST APIs and static JSON endpoints.

---

## 🏆 **Public Endpoints**

### **1. Cardinals Readiness Data**
Get real-time St. Louis Cardinals performance metrics.

**Endpoint**: `https://blaze-intelligence.pages.dev/src/data/enhanced-readiness.json`  
**Method**: GET  
**Auth**: None required

**Response Example**:
```json
{
  "timestamp": "2025-08-21T09:11:30.539Z",
  "overall": 86,
  "leverage": 1.9,
  "winProbability": 0.590,
  "readiness": {
    "overall": 86,
    "offense": {
      "batting": 86,
      "onBase": 79,
      "clutch": 89
    },
    "defense": {
      "fielding": 86,
      "positioning": 88
    }
  },
  "insights": [
    {
      "title": "Optimize Early Counts",
      "category": "Offense",
      "priority": "high"
    }
  ]
}
```

### **2. Lead Capture API**
Submit lead information for follow-up.

**Endpoint**: `https://blaze-lead-capture.humphrey-austin20.workers.dev`  
**Method**: POST  
**Auth**: None required  
**Content-Type**: application/json

**Request Body**:
```json
{
  "firstName": "John",           // Required
  "lastName": "Doe",             // Required
  "email": "john@example.com",   // Required
  "organization": "Team Name",   // Required
  "message": "Interested in...", // Required
  "phone": "210-555-0001",       // Optional
  "sport": "baseball",           // Optional: baseball, football, basketball, golf
  "level": "professional",       // Optional: youth, highschool, college, professional
  "marketing": "true",           // Optional: marketing consent
  "page": "/contact"             // Optional: source page
}
```

**Success Response** (200):
```json
{
  "success": true,
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Lead captured successfully",
  "timestamp": "2025-08-21T09:15:00Z"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Missing required fields: email, organization"
}
```

### **3. Health Check**
Monitor system status.

**Endpoint**: `https://blaze-sports-data.humphrey-austin20.workers.dev/health`  
**Method**: GET  
**Auth**: None required

**Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2025-08-21T09:15:00Z",
  "services": {
    "api": "operational",
    "data": "operational",
    "worker": "operational"
  }
}
```

---

## 💼 **Enterprise API** (Coming Soon)

### **Authentication**
Enterprise endpoints require API key authentication.

**Header**: `X-API-Key: YOUR_API_KEY`

### **Rate Limits**
- Public endpoints: 100 requests/minute
- Enterprise endpoints: 1000 requests/minute

### **Planned Endpoints**

#### **Player Analytics**
`GET /api/v1/players/{playerId}/analytics`
- Real-time performance metrics
- Historical trends
- Predictive modeling

#### **Team Dashboard**
`GET /api/v1/teams/{teamId}/dashboard`
- Aggregate team metrics
- Readiness scores
- Game-day recommendations

#### **NIL Valuations**
`GET /api/v1/nil/{athleteId}`
- AI-powered NIL estimates
- Market comparisons
- Trend analysis

#### **Custom Reports**
`POST /api/v1/reports/generate`
- Custom date ranges
- Multiple data sources
- Export formats (JSON, CSV, PDF)

---

## 🔧 **Integration Examples**

### **JavaScript/Fetch**
```javascript
// Get Cardinals readiness
fetch('https://blaze-intelligence.pages.dev/src/data/enhanced-readiness.json')
  .then(response => response.json())
  .then(data => {
    console.log(`Cardinals Readiness: ${data.overall}%`);
    console.log(`Win Probability: ${(data.winProbability * 100).toFixed(1)}%`);
  });

// Submit lead
fetch('https://blaze-lead-capture.humphrey-austin20.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Coach',
    lastName: 'Smith',
    email: 'coach@team.com',
    organization: 'Elite Baseball Academy',
    message: 'Interested in team analytics package'
  })
})
.then(response => response.json())
.then(data => console.log('Lead submitted:', data.leadId));
```

### **Python**
```python
import requests

# Get Cardinals data
response = requests.get('https://blaze-intelligence.pages.dev/src/data/enhanced-readiness.json')
data = response.json()
print(f"Cardinals Readiness: {data['overall']}%")

# Submit lead
lead_data = {
    'firstName': 'Coach',
    'lastName': 'Smith',
    'email': 'coach@team.com',
    'organization': 'Elite Baseball Academy',
    'message': 'Interested in analytics'
}
response = requests.post('https://blaze-lead-capture.humphrey-austin20.workers.dev', json=lead_data)
print(f"Lead ID: {response.json()['leadId']}")
```

### **cURL**
```bash
# Get Cardinals readiness
curl https://blaze-intelligence.pages.dev/src/data/enhanced-readiness.json | jq '.overall'

# Submit lead
curl -X POST https://blaze-lead-capture.humphrey-austin20.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Coach",
    "lastName": "Smith",
    "email": "coach@team.com",
    "organization": "Elite Baseball Academy",
    "message": "Interested in analytics"
  }'
```

---

## 📊 **Webhooks** (Enterprise)

Configure webhooks to receive real-time updates.

### **Event Types**
- `readiness.updated` - When readiness scores change
- `alert.triggered` - When performance alerts fire
- `lead.received` - When new lead submitted

### **Webhook Payload**
```json
{
  "event": "readiness.updated",
  "timestamp": "2025-08-21T09:15:00Z",
  "data": {
    "team": "Cardinals",
    "overall": 86,
    "change": 2,
    "direction": "up"
  }
}
```

---

## 🆘 **Support**

**Technical Support**: ahump20@outlook.com  
**API Status**: https://blaze-intelligence.pages.dev/health  
**Documentation**: https://blaze-intelligence.pages.dev/api-docs  

---

## 📈 **Roadmap**

**Q3 2025**:
- WebSocket support for real-time streaming
- GraphQL endpoint
- Batch operations

**Q4 2025**:
- AI-powered predictions API
- Custom ML model deployment
- White-label API options

---

*Version 1.0.0 | Last Updated: 2025-08-21*