#!/bin/bash

# Deploy script for Firebase Python Functions
# Make sure to set OPENAI_API_KEY in Google Cloud Secret Manager or as environment variable

echo "🚀 Deploying Python Firebase Functions for Image Generation..."

# Function 1: Generate single image
gcloud functions deploy generate_image \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point generate_image \
  --source . \
  --set-env-vars OPENAI_API_KEY="${OPENAI_API_KEY}" \
  --memory 512MB \
  --timeout 60s

# Function 2: Generate scene variations
gcloud functions deploy generate_scene_variations \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point generate_scene_variations \
  --source . \
  --set-env-vars OPENAI_API_KEY="${OPENAI_API_KEY}" \
  --memory 512MB \
  --timeout 120s

# Function 3: Process entire script
gcloud functions deploy process_script_images \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point process_script_images \
  --source . \
  --set-env-vars OPENAI_API_KEY="${OPENAI_API_KEY}" \
  --memory 1GB \
  --timeout 540s

# Function 4: Get image status
gcloud functions deploy get_image_status \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point get_image_status \
  --source . \
  --memory 256MB \
  --timeout 30s

echo "✅ Deployment complete!"
echo ""
echo "📍 Function URLs:"
echo "  - generate_image: https://REGION-PROJECT_ID.cloudfunctions.net/generate_image"
echo "  - generate_scene_variations: https://REGION-PROJECT_ID.cloudfunctions.net/generate_scene_variations"
echo "  - process_script_images: https://REGION-PROJECT_ID.cloudfunctions.net/process_script_images"
echo "  - get_image_status: https://REGION-PROJECT_ID.cloudfunctions.net/get_image_status"