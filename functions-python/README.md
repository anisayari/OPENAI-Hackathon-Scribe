# Firebase Python Functions for Image Generation

This directory contains Firebase Cloud Functions written in Python for generating images using OpenAI's DALL-E 3 API.

## 📋 Functions Overview

### 1. `generate_image`
Generates a single image based on a text prompt.

**Endpoint**: `POST /generate_image`

**Request Body**:
```json
{
  "prompt": "A beautiful sunrise over coffee plantations",
  "style": "cinematic",
  "size": "1024x1024",
  "quality": "standard",
  "save_to_firestore": true
}
```

**Response**:
```json
{
  "success": true,
  "image": "base64_encoded_image_data",
  "revised_prompt": "The actual prompt used by DALL-E",
  "firestore_id": "document_id"
}
```

### 2. `generate_scene_variations`
Generates multiple variations of the same scene.

**Endpoint**: `POST /generate_scene_variations`

**Request Body**:
```json
{
  "scene_description": "Modern coffee shop interior",
  "num_variations": 3,
  "style": "cinematic"
}
```

### 3. `process_script_images`
Processes an entire video script and generates images for each segment.

**Endpoint**: `POST /process_script_images`

**Request Body**:
```json
{
  "script_segments": [
    {"timestamp": "0:00", "text": "Opening scene description"},
    {"timestamp": "0:15", "text": "Next scene description"}
  ],
  "style": "documentary",
  "save_to_firestore": true
}
```

### 4. `get_image_status`
Retrieves the status of generated images from Firestore.

**Endpoint**: `GET /get_image_status?collection_id=xxx`

## 🚀 Deployment

### Prerequisites

1. Install Google Cloud SDK:
```bash
# macOS
brew install google-cloud-sdk

# or download from https://cloud.google.com/sdk/docs/install
```

2. Set up authentication:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

3. Enable required APIs:
```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Deploy Functions

1. Set your OpenAI API key:
```bash
export OPENAI_API_KEY="sk-proj-xxxxxxxxxx"
```

2. Deploy all functions:
```bash
./deploy.sh
```

Or deploy individually:
```bash
gcloud functions deploy generate_image \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point generate_image \
  --source . \
  --set-env-vars OPENAI_API_KEY="${OPENAI_API_KEY}"
```

## 🔧 Local Testing

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

3. Run locally with Functions Framework:
```bash
functions-framework --target=generate_image --debug
```

4. Test with curl:
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A coffee cup on a wooden table",
    "style": "minimalist"
  }'
```

## 💰 Cost Estimates

| Function | Estimated Cost per Call |
|----------|------------------------|
| generate_image | ~$0.04 (DALL-E 3) |
| generate_scene_variations | ~$0.12-0.20 (3-5 images) |
| process_script_images | Variable (depends on segments) |

## 🔐 Security

- API keys are stored as environment variables
- Functions use CORS headers for web compatibility
- Consider adding authentication for production use:

```python
# Add to functions for authentication
from firebase_admin import auth

def verify_token(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split('Bearer ')[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except:
        return None
```

## 📊 Monitoring

View function logs:
```bash
gcloud functions logs read generate_image
```

View function metrics in Google Cloud Console:
- Go to Cloud Functions
- Click on function name
- View "Metrics" tab

## 🔄 Integration with Next.js App

Example usage in your Next.js app:

```typescript
// app/api/generate-image/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const response = await fetch('https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/generate_image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: body.prompt,
      style: body.style || 'cinematic',
      save_to_firestore: true
    })
  });
  
  const result = await response.json();
  return NextResponse.json(result);
}
```

## 📝 Notes

- Images are returned as base64 encoded strings
- Maximum timeout is 540 seconds for script processing
- DALL-E 3 supports sizes: 1024x1024, 1024x1792, 1792x1024
- Consider implementing caching to reduce costs
- Monitor usage to avoid unexpected charges