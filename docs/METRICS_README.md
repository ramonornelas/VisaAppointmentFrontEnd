# FastVisa - Metrics System

This module implements a comprehensive system for tracking and storing FastVisa application usage metrics.

## 📋 Components

### 1. Infrastructure (CloudFormation)
- **File**: `cloudformation/FastVisaCreateMetrics.yaml`
- **Created Resources**:
  - DynamoDB table `fastVisa_metrics` for storing events
  - Lambda function `FastVisaRecordMetric` for processing metrics
  - API Gateway endpoint `POST /metrics`
  - Necessary IAM policies
  - CORS support for requests from the frontend

### 2. Backend (Lambda)
- **File**: `lambda/FastVisaRecordMetric.py`
- **Functionality**: Receives and stores metric events in DynamoDB

### 3. Frontend (JavaScript)
- **File**: `VisaAppointmentConsole/FastVisaMetrics.js`
- **Functionality**: JavaScript client for sending metrics from the browser

### 4. Tests
- **File**: `lambda/test_FastVisaRecordMetric.py`
- **Functionality**: Unit tests to validate functionality

## 🚀 Deployment

### Step 1: Deploy infrastructure with CloudFormation

```bash
# Navigate to CloudFormation directory
cd cloudformation

# Deploy the stack
aws cloudformation create-stack \
  --stack-name FastVisaMetrics \
  --template-body file://FastVisaCreateMetrics.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-1
```

### Step 2: Verify the deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name FastVisaMetrics \
  --region us-west-1 \
  --query 'Stacks[0].StackStatus'

# Get information about created resources
aws cloudformation describe-stack-resources \
  --stack-name FastVisaMetrics \
  --region us-west-1
```

### Step 3: Test the Lambda locally

```bash
cd lambda
python test_FastVisaRecordMetric.py
```

## 📊 DynamoDB Table Structure

### Table: `fastVisa_metrics`

**Keys:**
- **Partition Key**: `id` (String) - Unique UUID for each metric
- **Sort Key**: `timestamp` (Number) - Timestamp in milliseconds

**Global Secondary Index:**
- **GSI**: `eventType-timestamp-index`
  - Partition Key: `eventType`
  - Sort Key: `timestamp`

**Attributes:**
```json
{
  "id": "uuid-string",
  "timestamp": 1699999999999,
  "eventType": "page_view",
  "pageUrl": "/",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "sessionId": "session-uuid",
  "userId": "user-uuid",
  "clientIp": "192.168.1.1",
  "metadata": {
    "screenWidth": 1920,
    "screenHeight": 1080,
    "language": "es-MX"
  }
}
```

## 🔌 API Endpoint

### POST /metrics

**URL**: `https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/metrics`

**Request Body:**
```json
{
  "eventType": "page_view",
  "pageUrl": "/",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id",
  "metadata": {
    "screenWidth": 1920,
    "screenHeight": 1080,
    "language": "es-MX"
  }
}
```

**Response:**
```json
{
  "message": "Metric recorded successfully",
  "metricId": "generated-uuid",
  "timestamp": 1699999999999
}
```

## 💻 Frontend Integration

### Basic Installation

1. Include the script in your HTML:
```html
<script src="FastVisaMetrics.js"></script>
```

2. Initialize in your application:
```javascript
// Create tracker instance
const metrics = new FastVisaMetrics();

// Enable automatic page tracking
metrics.initAutoTracking();
```

### Usage Examples

#### 1. Track main page visits
```javascript
// Automatic tracking already captures this, but you can do it manually:
metrics.trackPageView();
```

#### 2. Track button clicks
```javascript
document.getElementById('schedule-btn').addEventListener('click', () => {
    metrics.trackButtonClick('schedule-btn', 'Schedule Appointment');
});
```

#### 3. Track form submissions
```javascript
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Your form submission logic
        await submitForm();
        
        // Record success metric
        await metrics.trackFormSubmit('contact-form', true);
    } catch (error) {
        // Record failure metric
        await metrics.trackFormSubmit('contact-form', false);
    }
});
```

#### 4. Track authenticated users
```javascript
// When user logs in
function onUserLogin(userId) {
    metrics.setUserId(userId);
    metrics.trackCustomEvent('user_login', {
        loginMethod: 'email',
        timestamp: new Date().toISOString()
    });
}

// When user logs out
function onUserLogout() {
    metrics.trackCustomEvent('user_logout');
    metrics.clearUserId();
}
```

#### 5. Custom events
```javascript
// Track video playback
metrics.trackCustomEvent('video_played', {
    videoId: 'intro-video',
    duration: 120,
    position: 'hero'
});

// Track document downloads
metrics.trackCustomEvent('document_downloaded', {
    documentName: 'visa-requirements.pdf',
    documentType: 'pdf',
    size: 2048
});
```

## 🧪 Common Event Types

- `page_view` - Page view
- `button_click` - Button click
- `form_submit` - Form submission
- `user_login` - User login
- `user_logout` - User logout
- `document_downloaded` - Document download
- `video_played` - Video played
- `search_performed` - Search performed
- `error_encountered` - Error encountered

## 📈 Querying Metrics

### Using AWS CLI

```bash
# Get all metrics of a specific type
aws dynamodb query \
  --table-name fastVisa_metrics \
  --index-name eventType-timestamp-index \
  --key-condition-expression "eventType = :type" \
  --expression-attribute-values '{":type":{"S":"page_view"}}' \
  --region us-west-1

# Scan recent metrics
aws dynamodb scan \
  --table-name fastVisa_metrics \
  --limit 10 \
  --region us-west-1
```

### Using boto3 (Python)

```python
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
table = dynamodb.Table('fastVisa_metrics')

# Query by event type
response = table.query(
    IndexName='eventType-timestamp-index',
    KeyConditionExpression=Key('eventType').eq('page_view')
)

print(f"Total page views: {response['Count']}")
```

## 🔒 Security

- ✅ CORS configured to allow requests from the frontend
- ✅ IAM roles with minimum necessary permissions
- ✅ CloudWatch logs enabled
- ✅ No sensitive data stored in metrics
- ✅ Client IP recorded for traffic analysis

## 📝 Future Improvements

1. **Analytics Dashboard**: Create an interface to visualize metrics
2. **Alerts**: Configure CloudWatch alarms for unusual patterns
3. **Data Retention**: Implement TTL in DynamoDB for old data
4. **Aggregations**: Lambda to process metrics and create daily reports
5. **A/B Testing**: Use metrics for user experiments
6. **Privacy Filters**: Option for users to disable tracking

## 🆘 Troubleshooting

### Endpoint not responding
```bash
# Verify stack is deployed
aws cloudformation describe-stacks --stack-name FastVisaMetrics

# Check Lambda logs
aws logs tail /aws/lambda/FastVisaRecordMetric --follow
```

### CORS errors in browser
- Verify endpoint has `Access-Control-Allow-Origin: *` configured
- Ensure OPTIONS request is working

### Metrics not being saved
```bash
# Check CloudWatch logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/FastVisaRecordMetric \
  --start-time $(date -u -d '10 minutes ago' +%s)000
```

## 📞 Support

For questions or issues, contact the FastVisa development team.

---

**Last Updated**: November 2025
**Version**: 1.0.0
