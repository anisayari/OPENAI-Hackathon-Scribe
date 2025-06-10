"""
Image Search Tools - Search various image APIs
"""

import os
import json
import asyncio
import base64
from typing import List, Dict, Optional, Any
import requests
import aiohttp
from pydantic import BaseModel
from agents import function_tool
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential


class ImageResult(BaseModel):
    """Model for image search results"""
    url: str
    preview_url: str
    source: str
    license: str
    cost: float
    width: int
    height: int
    title: str = ""
    relevance_score: float = 0.8
    photographer: str = ""
    source_website: str = ""


class SearchFilters(BaseModel):
    """Model for search filters"""
    orientation: str = "all"  # landscape, portrait, square, all
    color: str = "all"       # specific color or all
    category: str = "all"    # nature, people, technology, etc.


class DataForSEOImageSearch:
    """DataForSEO Image Search client"""
    
    def __init__(self):
        self.login = os.getenv('DATAFORSEO_LOGIN')
        self.password = os.getenv('DATAFORSEO_PASSWORD')
        self.base_url = "https://api.dataforseo.com/v3"
        
        if not self.login or not self.password:
            raise ValueError("DataForSEO credentials not found. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env")
        
        # Create auth header
        credentials = f"{self.login}:{self.password}"
        self.auth_header = f"Basic {base64.b64encode(credentials.encode()).decode('utf-8')}"
    
    def search_images(self, query: str, depth: int = 100) -> List[Dict[str, Any]]:
        """Search images using DataForSEO Google Images API"""
        headers = {
            'Authorization': self.auth_header,
            'Content-Type': 'application/json'
        }
        
        payload = [{
            "keyword": query,
            "location_code": 2840,  # United States
            "language_code": "en",
            "device": "desktop",
            "os": "windows",
            "depth": depth
        }]
        
        try:
            response = requests.post(
                f"{self.base_url}/serp/google/images/live/advanced",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_dataforseo_results(data)
            else:
                print(f"DataForSEO error: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"DataForSEO search error: {e}")
            return []
    
    def _parse_dataforseo_results(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse DataForSEO image search results"""
        results = []
        
        if data.get('tasks') and len(data['tasks']) > 0:
            task = data['tasks'][0]
            if task.get('result') and len(task['result']) > 0:
                result_data = task['result'][0]
                
                # Extract image items
                items = result_data.get('items', [])
                for item in items:
                    if item.get('type') == 'images_search':
                        results.append({
                            'url': item.get('source_url', ''),
                            'preview_url': item.get('encoded_url', ''),
                            'title': item.get('title', ''),
                            'alt': item.get('alt', ''),
                            'source': 'dataforseo',
                            'source_website': item.get('subtitle', ''),
                            'original_url': item.get('url', ''),
                            'width': 0,  # DataForSEO doesn't provide dimensions directly
                            'height': 0,
                            'license': 'unknown',  # Need to check source
                            'cost': 0.0,
                            'relevance_score': 0.8
                        })
        
        return results


@function_tool
def search_free_images(query: str, count: int = 10) -> List[ImageResult]:
    """
    Search free image sources (Pexels, DataForSEO)
    
    Args:
        query: Search query
        count: Number of results to return
        
    Returns:
        List of image results
    """
    results = []
    
    # Search Pexels
    pexels_results = _search_pexels(query, count)
    for img in pexels_results:
        results.append(ImageResult(**img))
    
    # If we need more results, use DataForSEO
    if len(results) < count and os.getenv('DATAFORSEO_LOGIN'):
        try:
            dataforseo_client = DataForSEOImageSearch()
            dataforseo_results = dataforseo_client.search_images(query, depth=count)
            
            # Filter for free sources
            for img in dataforseo_results:
                source = img.get('source_website', '').lower()
                # Check if from known free sources
                free_sources = ['wikimedia', 'commons', 'flickr', 'unsplash', 'pexels', 'pixabay']
                if any(src in source for src in free_sources):
                    img['license'] = 'likely free'
                    # Ensure all required fields are present
                    img_data = {
                        'url': img.get('url', ''),
                        'preview_url': img.get('preview_url', img.get('url', '')),
                        'source': img.get('source', 'dataforseo'),
                        'license': img.get('license', 'unknown'),
                        'cost': img.get('cost', 0.0),
                        'width': img.get('width', 0),
                        'height': img.get('height', 0),
                        'title': img.get('title', ''),
                        'relevance_score': img.get('relevance_score', 0.8),
                        'photographer': img.get('photographer', ''),
                        'source_website': img.get('source_website', '')
                    }
                    results.append(ImageResult(**img_data))
                    
                if len(results) >= count:
                    break
        except Exception as e:
            print(f"DataForSEO search failed: {e}")
    
    return results[:count]


def search_all_images(query: str, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Search all available image sources including DataForSEO
    
    Args:
        query: Search query
        filters: Additional filters (orientation, color, etc.)
        
    Returns:
        List of all image results
    """
    if not filters:
        filters = {}
    
    results = []
    
    # Use DataForSEO for comprehensive search
    if os.getenv('DATAFORSEO_LOGIN'):
        try:
            dataforseo_client = DataForSEOImageSearch()
            dataforseo_results = dataforseo_client.search_images(query, depth=100)
            results.extend(dataforseo_results)
        except Exception as e:
            print(f"DataForSEO search failed: {e}")
    
    # Add Pexels results
    pexels_results = _search_pexels(query, 20)
    results.extend(pexels_results)
    
    # Add Everypixel results if available
    everypixel_results = search_everypixel(query, license='all', count=20)
    results.extend(everypixel_results)
    
    # Remove duplicates based on URL
    seen_urls = set()
    unique_results = []
    for img in results:
        url = img.get('url', '')
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_results.append(img)
    
    return unique_results


def search_premium_images(query: str, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Search premium image sources (Shutterstock, Getty via Everypixel)
    
    Args:
        query: Search query
        filters: Additional filters (orientation, color, etc.)
        
    Returns:
        List of premium image results
    """
    if not filters:
        filters = {}
    
    results = []
    
    # Use Everypixel to search across premium sources
    everypixel_key = os.getenv('EVERYPIXEL_API_KEY')
    if everypixel_key:
        results = _search_everypixel(query, license='paid', filters=filters)
    
    # Direct Shutterstock search if available
    shutterstock_key = os.getenv('SHUTTERSTOCK_API_KEY')
    if shutterstock_key and len(results) < 10:
        shutterstock_results = _search_shutterstock(query, filters)
        results.extend(shutterstock_results)
    
    return results


def search_everypixel(query: str, license: str = 'all', count: int = 20) -> List[Dict[str, Any]]:
    """
    Search using Everypixel meta-search API
    
    Args:
        query: Search query
        license: 'free', 'paid', or 'all'
        count: Number of results
        
    Returns:
        List of images from multiple sources
    """
    api_key = os.getenv('EVERYPIXEL_API_KEY')
    if not api_key:
        return []
    
    headers = {'Authorization': f'Bearer {api_key}'}
    params = {
        'q': query,
        'license': license,
        'per_page': count
    }
    
    try:
        response = requests.get(
            'https://api.everypixel.com/v1/search',
            headers=headers,
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            results = []
            
            for item in data.get('data', []):
                results.append({
                    'url': item['url'],
                    'preview_url': item.get('preview', item['url']),
                    'source': item.get('source', 'everypixel'),
                    'license': 'commercial' if license == 'paid' else 'free',
                    'cost': item.get('price', 0.0),
                    'width': item.get('width', 0),
                    'height': item.get('height', 0),
                    'title': item.get('title', ''),
                    'relevance_score': item.get('score', 0.5)
                })
            
            return results
    except Exception as e:
        print(f"Everypixel search error: {e}")
    
    return []



def generate_ai_image(prompt: str, style: str = "cinematic", size: str = "1024x1024") -> ImageResult:
    """
    Generate image using DALL-E 3
    
    Args:
        prompt: Image generation prompt
        style: Style modifier
        size: Image size
        
    Returns:
        Generated image result
    """
    try:
        client = OpenAI()
        
        # Enhance prompt with style
        enhanced_prompt = f"{prompt}, {style} style, high quality, professional photography"
        
        response = client.images.generate(
            model="dall-e-3",
            prompt=enhanced_prompt,
            size=size,
            quality="hd",
            n=1
        )
        
        return ImageResult(
            url=response.data[0].url,
            preview_url=response.data[0].url,
            source='dalle-3',
            license='ai-generated',
            cost=0.04,  # DALL-E 3 HD pricing
            width=int(size.split('x')[0]),
            height=int(size.split('x')[1]),
            title=f"AI Generated: {prompt[:50]}...",
            relevance_score=1.0  # Perfect relevance since custom generated
        )
    except Exception as e:
        print(f"DALL-E generation error: {e}")
        # Return empty result in case of error
        return ImageResult(
            url="",
            preview_url="",
            source="dalle-3",
            license="error",
            cost=0.0,
            width=0,
            height=0,
            title="Generation failed",
            relevance_score=0.0
        )


async def search_multiple_sources(queries: List[str], sources: List[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Search multiple sources in parallel
    
    Args:
        queries: List of search queries
        sources: List of sources to search
        
    Returns:
        Dictionary mapping queries to results
    """
    if not sources:
        sources = ['pexels', 'dataforseo']
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for query in queries:
            for source in sources:
                if source == 'pexels':
                    tasks.append(_async_search_pexels(session, query))
                elif source == 'dataforseo':
                    tasks.append(_async_search_dataforseo(session, query))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Organize results by query
    organized = {}
    for i, query in enumerate(queries):
        organized[query] = []
        for j, source in enumerate(sources):
            result_index = i * len(sources) + j
            if result_index < len(results) and not isinstance(results[result_index], Exception):
                organized[query].extend(results[result_index])
    
    return organized


# Private helper functions

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def _search_pexels(query: str, count: int = 10) -> List[Dict[str, Any]]:
    """Search Pexels API"""
    api_key = os.getenv('PEXELS_API_KEY')
    if not api_key:
        return []
    
    headers = {'Authorization': api_key}
    params = {'query': query, 'per_page': count}
    
    try:
        response = requests.get(
            'https://api.pexels.com/v1/search',
            headers=headers,
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            results = []
            
            for photo in data.get('photos', []):
                results.append({
                    'url': photo['src']['original'],
                    'preview_url': photo['src']['medium'],
                    'source': 'pexels',
                    'license': 'CC0',
                    'cost': 0.0,
                    'width': photo['width'],
                    'height': photo['height'],
                    'photographer': photo['photographer'],
                    'photographer_url': photo.get('photographer_url', ''),
                    'title': photo.get('alt', ''),
                    'relevance_score': 0.8,
                    'source_website': 'pexels.com'
                })
            
            return results
    except Exception as e:
        print(f"Pexels search error: {e}")
    
    return []


def _search_everypixel(query: str, license: str = 'all', filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Search Everypixel API with filters"""
    return search_everypixel(query, license, count=20)



# Async versions for parallel search
async def _async_search_pexels(session: aiohttp.ClientSession, query: str) -> List[Dict[str, Any]]:
    """Async Pexels search"""
    api_key = os.getenv('PEXELS_API_KEY')
    if not api_key:
        return []
    
    headers = {'Authorization': api_key}
    params = {'query': query, 'per_page': 10}
    
    try:
        async with session.get(
            'https://api.pexels.com/v1/search',
            headers=headers,
            params=params
        ) as response:
            if response.status == 200:
                data = await response.json()
                return _process_pexels_results(data)
    except Exception as e:
        print(f"Async Pexels error: {e}")
    
    return []


async def _async_search_dataforseo(session: aiohttp.ClientSession, query: str) -> List[Dict[str, Any]]:
    """Async DataForSEO search"""
    try:
        client = DataForSEOImageSearch()
        # For now, use sync version - would need to implement async properly
        return client.search_images(query)
    except Exception as e:
        print(f"Async DataForSEO error: {e}")
        return []


def _process_pexels_results(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Process Pexels API results"""
    results = []
    for photo in data.get('photos', []):
        results.append({
            'url': photo['src']['original'],
            'preview_url': photo['src']['medium'],
            'source': 'pexels',
            'license': 'CC0',
            'cost': 0.0,
            'width': photo['width'],
            'height': photo['height'],
            'photographer': photo['photographer'],
            'relevance_score': 0.8
        })
    return results
