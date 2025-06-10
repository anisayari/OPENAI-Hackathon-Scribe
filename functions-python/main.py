"""
Firebase Cloud Functions for Image Generation using OpenAI
==========================================================

This module provides HTTP endpoints for generating images using OpenAI's API.
Adapted from the original image_generation_openai.py for Firebase Functions.
"""

import os
import base64
import json
import functions_framework
from typing import List, Dict, Optional, Union
import requests
from openai import OpenAI
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Initialize OpenAI client (will be created when needed)
openai_client = None

def get_openai_client():
    global openai_client
    if openai_client is None:
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        openai_client = OpenAI(api_key=api_key)
    return openai_client


@functions_framework.http
def generate_image(request):
    """
    HTTP Cloud Function for generating images with DALL-E 3
    
    Expected JSON payload:
    {
        "prompt": "Description of the image",
        "model": "dall-e-3" (optional, default: "dall-e-3"),
        "size": "1024x1024" (optional),
        "quality": "standard" (optional, can be "standard" or "hd"),
        "style": "cinematic" (optional, for YouTube-specific styling),
        "save_to_firestore": true (optional)
    }
    
    Returns:
    {
        "success": true,
        "image": "base64_encoded_image_data",
        "revised_prompt": "The actual prompt used by DALL-E",
        "firestore_id": "document_id" (if saved)
    }
    """
    
    # Handle CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        request_json = request.get_json(silent=True)
        if not request_json or 'prompt' not in request_json:
            return json.dumps({
                'success': False,
                'error': 'Missing required field: prompt'
            }), 400, headers
        
        prompt = request_json['prompt']
        model = request_json.get('model', 'dall-e-3')
        size = request_json.get('size', '1024x1024')
        quality = request_json.get('quality', 'standard')
        style = request_json.get('style', 'cinematic')
        save_to_firestore = request_json.get('save_to_firestore', False)
        
        # Enhance prompt with style if YouTube-specific
        if style:
            style_prompts = {
                "cinematic": "cinematic lighting, professional photography, film-like quality",
                "documentary": "documentary style, realistic, natural lighting, authentic",
                "cartoon": "illustrated style, vibrant colors, cartoon-like, animated",
                "minimalist": "clean, minimal, simple composition, elegant"
            }
            style_modifier = style_prompts.get(style, style_prompts["cinematic"])
            enhanced_prompt = f"{prompt}, {style_modifier}, high quality"
        else:
            enhanced_prompt = prompt
        
        # Generate image using DALL-E 3
        response = get_openai_client().images.generate(
            model=model,
            prompt=enhanced_prompt,
            size=size,
            quality=quality,
            n=1,
            response_format="b64_json"
        )
        
        # Extract image data
        image_data = response.data[0].b64_json
        revised_prompt = response.data[0].revised_prompt
        
        result = {
            'success': True,
            'image': image_data,
            'revised_prompt': revised_prompt,
            'original_prompt': prompt,
            'style': style,
            'size': size,
            'quality': quality
        }
        
        # Save to Firestore if requested
        if save_to_firestore:
            doc_data = {
                'prompt': prompt,
                'enhanced_prompt': enhanced_prompt,
                'revised_prompt': revised_prompt,
                'style': style,
                'size': size,
                'quality': quality,
                'model': model,
                'created_at': datetime.now(),
                'image_b64': image_data[:100] + '...'  # Store truncated for reference
            }
            
            doc_ref = db.collection('generated_images').add(doc_data)
            result['firestore_id'] = doc_ref[1].id
        
        return json.dumps(result), 200, headers
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }
        return json.dumps(error_result), 500, headers


@functions_framework.http
def generate_scene_variations(request):
    """
    HTTP Cloud Function for generating multiple variations of a scene
    
    Expected JSON payload:
    {
        "scene_description": "Description of the scene",
        "num_variations": 3 (optional, max 5),
        "style": "cinematic" (optional)
    }
    
    Returns:
    {
        "success": true,
        "variations": [
            {
                "image": "base64_encoded_image",
                "prompt": "full prompt used",
                "variation_type": "close-up perspective",
                "style": "cinematic"
            },
            ...
        ]
    }
    """
    
    # Handle CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        request_json = request.get_json(silent=True)
        if not request_json or 'scene_description' not in request_json:
            return json.dumps({
                'success': False,
                'error': 'Missing required field: scene_description'
            }), 400, headers
        
        scene_description = request_json['scene_description']
        num_variations = min(request_json.get('num_variations', 3), 5)
        style = request_json.get('style', 'cinematic')
        
        variation_modifiers = [
            "close-up perspective, detailed",
            "wide angle view, environmental context", 
            "medium shot, balanced composition",
            "artistic angle, creative perspective",
            "professional lighting, studio quality"
        ]
        
        variations = []
        
        for i in range(num_variations):
            modifier = variation_modifiers[i]
            full_prompt = f"{scene_description}, {modifier}, {style} style"
            
            try:
                response = get_openai_client().images.generate(
                    model="dall-e-3",
                    prompt=full_prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1,
                    response_format="b64_json"
                )
                
                variations.append({
                    'image': response.data[0].b64_json,
                    'prompt': full_prompt,
                    'variation_type': modifier,
                    'style': style,
                    'revised_prompt': response.data[0].revised_prompt
                })
                
            except Exception as e:
                print(f"Error generating variation {i+1}: {e}")
                continue
        
        result = {
            'success': True,
            'variations': variations,
            'total_generated': len(variations)
        }
        
        return json.dumps(result), 200, headers
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }
        return json.dumps(error_result), 500, headers


@functions_framework.http
def process_script_images(request):
    """
    HTTP Cloud Function for processing an entire video script with image generation
    
    Expected JSON payload:
    {
        "script_segments": [
            {"timestamp": "0:00", "text": "Scene description"},
            {"timestamp": "0:15", "text": "Another scene"},
            ...
        ],
        "style": "cinematic" (optional),
        "save_to_firestore": true (optional),
        "script_id": "optional_script_id" (optional)
    }
    
    Returns:
    {
        "success": true,
        "enriched_segments": [
            {
                "timestamp": "0:00",
                "text": "Scene description",
                "generated_image": {
                    "image": "base64_data",
                    "source": "dall-e-3",
                    "revised_prompt": "actual prompt used"
                }
            },
            ...
        ],
        "firestore_collection_id": "collection_id" (if saved)
    }
    """
    
    # Handle CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        request_json = request.get_json(silent=True)
        if not request_json or 'script_segments' not in request_json:
            return json.dumps({
                'success': False,
                'error': 'Missing required field: script_segments'
            }), 400, headers
        
        script_segments = request_json['script_segments']
        style = request_json.get('style', 'cinematic')
        save_to_firestore = request_json.get('save_to_firestore', False)
        script_id = request_json.get('script_id', None)
        
        enriched_segments = []
        
        # Process each segment
        for segment in script_segments:
            timestamp = segment.get('timestamp', '0:00')
            text = segment.get('text', '')
            
            if not text:
                continue
            
            try:
                # Enhance prompt with style
                style_modifier = {
                    "cinematic": "cinematic lighting, professional photography",
                    "documentary": "documentary style, realistic, natural lighting",
                    "cartoon": "illustrated style, vibrant colors",
                    "minimalist": "clean, minimal, simple composition"
                }.get(style, "high quality")
                
                enhanced_prompt = f"{text}, {style_modifier}"
                
                # Generate image
                response = get_openai_client().images.generate(
                    model="dall-e-3",
                    prompt=enhanced_prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1,
                    response_format="b64_json"
                )
                
                # Create enriched segment
                enriched_segment = segment.copy()
                enriched_segment['generated_image'] = {
                    'image': response.data[0].b64_json,
                    'source': 'dall-e-3',
                    'revised_prompt': response.data[0].revised_prompt,
                    'style': style,
                    'cost_estimate': 0.04  # Approximate cost for DALL-E 3
                }
                
                enriched_segments.append(enriched_segment)
                
            except Exception as e:
                print(f"Error processing segment at {timestamp}: {e}")
                # Add segment without image on error
                enriched_segment = segment.copy()
                enriched_segment['generation_error'] = str(e)
                enriched_segments.append(enriched_segment)
        
        result = {
            'success': True,
            'enriched_segments': enriched_segments,
            'total_processed': len(enriched_segments),
            'total_images_generated': len([s for s in enriched_segments if 'generated_image' in s])
        }
        
        # Save to Firestore if requested
        if save_to_firestore and enriched_segments:
            collection_data = {
                'script_id': script_id or f"script_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                'style': style,
                'created_at': datetime.now(),
                'total_segments': len(enriched_segments),
                'segments': []
            }
            
            # Save segment references (not full images to save space)
            for seg in enriched_segments:
                seg_data = {
                    'timestamp': seg.get('timestamp'),
                    'text': seg.get('text'),
                    'has_image': 'generated_image' in seg,
                    'revised_prompt': seg.get('generated_image', {}).get('revised_prompt', '')
                }
                collection_data['segments'].append(seg_data)
            
            doc_ref = db.collection('script_images').add(collection_data)
            result['firestore_collection_id'] = doc_ref[1].id
        
        return json.dumps(result), 200, headers
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }
        return json.dumps(error_result), 500, headers


@functions_framework.http
def get_image_status(request):
    """
    HTTP Cloud Function to check the status of generated images in Firestore
    
    Expected query parameters:
    - collection_id: The Firestore collection ID
    
    Returns:
    {
        "success": true,
        "data": {
            "script_id": "script_20240115_123456",
            "created_at": "2024-01-15T12:34:56",
            "total_segments": 5,
            "segments_with_images": 4
        }
    }
    """
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        collection_id = request.args.get('collection_id')
        if not collection_id:
            return json.dumps({
                'success': False,
                'error': 'Missing required parameter: collection_id'
            }), 400, headers
        
        # Get document from Firestore
        doc_ref = db.collection('script_images').document(collection_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return json.dumps({
                'success': False,
                'error': 'Collection not found'
            }), 404, headers
        
        data = doc.to_dict()
        
        # Count segments with images
        segments_with_images = len([s for s in data.get('segments', []) if s.get('has_image')])
        
        result = {
            'success': True,
            'data': {
                'script_id': data.get('script_id'),
                'created_at': data.get('created_at').isoformat() if data.get('created_at') else None,
                'total_segments': data.get('total_segments', 0),
                'segments_with_images': segments_with_images,
                'style': data.get('style')
            }
        }
        
        return json.dumps(result), 200, headers
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }
        return json.dumps(error_result), 500, headers