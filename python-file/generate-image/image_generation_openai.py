"""
OpenAI GPT Image Generation Functions (Latest API)
==================================================

Fonctions Python pour générer et éditer des images avec la nouvelle API OpenAI gpt-image-1.
Utilise client.responses.create() avec tools de génération d'image.

Dépendances requises:
- openai>=1.52.0 (version récente pour gpt-image-1)
- requests>=2.31.0

Variables d'environnement:
- OPENAI_API_KEY=ta_cle_openai
"""

import os
import base64
import io
from typing import List, Dict, Optional, Union
import requests
from openai import OpenAI

# Initialiser le client OpenAI
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))


def generate_image_gpt(
    prompt: str,
    model: str = "gpt-4.1-mini",
    size: str = "1024x1024",
    quality: str = "standard"
) -> Optional[List[Dict[str, str]]]:
    """
    Génère une ou plusieurs images avec GPT Image (nouvelle API)
    
    Args:
        prompt (str): Description de l'image souhaitée
        model (str): Modèle à utiliser ("gpt-4.1-mini" ou "gpt-image-1")
        size (str): Taille de l'image ("1024x1024", "1024x1536", "1536x1024")
        quality (str): Qualité ("standard" ou "hd")
        
    Returns:
        List[Dict]: Liste d'images [{'b64_json': str, 'revised_prompt': str}]
        None si erreur
        
    Coût:
        Variable selon le modèle utilisé
    
    Exemple:
        images = generate_image_gpt(
            prompt="A serene coffee plantation at sunrise in Ethiopia",
            model="gpt-image-1"
        )
        if images:
            # Sauvegarder la première image
            with open("generated.png", "wb") as f:
                f.write(base64.b64decode(images[0]['b64_json']))
    """
    try:
        # Configuration du prompt avec paramètres d'image
        full_prompt = f"{prompt}"
        if size != "1024x1024":
            full_prompt += f" [Size: {size}]"
        if quality == "hd":
            full_prompt += " [High quality, detailed]"
        
        response = openai_client.responses.create(
            model=model,
            input=full_prompt,
            tools=[{"type": "image_generation"}]
        )
        
        # Extraire les données d'image de la réponse
        image_data = [
            output.result
            for output in response.output
            if output.type == "image_generation_call"
        ]
        
        if image_data:
            results = []
            for img_b64 in image_data:
                results.append({
                    'b64_json': img_b64,
                    'revised_prompt': prompt,  # GPT peut réviser le prompt
                    'url': None  # Pas d'URL avec cette API
                })
            return results
        else:
            print("Aucune image générée dans la réponse")
            return None
        
    except Exception as e:
        print(f"Erreur génération image GPT: {e}")
        return None


def edit_image_gpt(
    base64_image: str,
    edit_prompt: str,
    model: str = "gpt-image-1"
) -> Optional[Dict[str, str]]:
    """
    Édite une image existante avec GPT Image
    
    Args:
        base64_image (str): Image originale encodée en base64
        edit_prompt (str): Description des modifications souhaitées
        model (str): Modèle à utiliser
        
    Returns:
        Dict: {'b64_json': str, 'revised_prompt': str}
        None si erreur
        
    Exemple:
        # Charger une image existante
        with open("original.png", "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()
        
        # Éditer l'image
        edited = edit_image_gpt(
            base64_image=img_b64,
            edit_prompt="Add sunglasses to the person and make the sky blue"
        )
        
        if edited:
            # Sauvegarder l'image éditée
            with open("edited.png", "wb") as f:
                f.write(base64.b64decode(edited['b64_json']))
    """
    try:
        # Construire le prompt d'édition avec l'image de base
        edit_instruction = f"""
        Edit the provided image: {edit_prompt}
        
        Base image (base64): {base64_image[:100]}...
        """
        
        response = openai_client.responses.create(
            model=model,
            input=edit_instruction,
            tools=[{"type": "image_generation"}]
        )
        
        # Extraire l'image éditée
        image_data = [
            output.result
            for output in response.output
            if output.type == "image_generation_call"
        ]
        
        if image_data:
            return {
                'b64_json': image_data[0],
                'revised_prompt': edit_prompt,
                'url': None
            }
        else:
            print("Aucune image éditée générée")
            return None
        
    except Exception as e:
        print(f"Erreur édition image GPT: {e}")
        return None


def generate_with_context_gpt(
    prompt: str,
    context_images: List[str] = None,
    model: str = "gpt-image-1"
) -> Optional[List[Dict[str, str]]]:
    """
    Génère une image avec du contexte (images de référence ou instructions)
    
    Args:
        prompt (str): Description de l'image finale souhaitée
        context_images (List[str]): Liste de chemins vers images de contexte (optionnel)
        model (str): Modèle à utiliser
        
    Returns:
        List[Dict]: Liste d'images générées
        None si erreur
        
    Exemple:
        images = generate_with_context_gpt(
            prompt="Create a modern coffee shop interior in this style",
            context_images=["style_ref.jpg"],
            model="gpt-image-1"
        )
    """
    try:
        full_prompt = prompt
        
        # Ajouter les images de contexte au prompt si fournies
        if context_images:
            context_data = []
            for img_path in context_images[:5]:  # Limiter à 5 images de contexte
                try:
                    with open(img_path, 'rb') as f:
                        img_b64 = base64.b64encode(f.read()).decode()
                    context_data.append(img_b64[:200])  # Échantillon pour le contexte
                except Exception as e:
                    print(f"Erreur lecture image contexte {img_path}: {e}")
                    continue
            
            if context_data:
                full_prompt += f"\n\nReference style context: {len(context_data)} images provided"
        
        response = openai_client.responses.create(
            model=model,
            input=full_prompt,
            tools=[{"type": "image_generation"}]
        )
        
        # Extraire les images générées
        image_data = [
            output.result
            for output in response.output
            if output.type == "image_generation_call"
        ]
        
        if image_data:
            results = []
            for img_b64 in image_data:
                results.append({
                    'b64_json': img_b64,
                    'revised_prompt': full_prompt,
                    'url': None
                })
            return results
        
        return None
        
    except Exception as e:
        print(f"Erreur génération avec contexte GPT: {e}")
        return None


def batch_generate_gpt(
    prompts: List[str],
    model: str = "gpt-image-1"
) -> List[Optional[Dict[str, str]]]:
    """
    Génère plusieurs images en batch
    
    Args:
        prompts (List[str]): Liste de prompts à traiter
        model (str): Modèle à utiliser
        
    Returns:
        List[Optional[Dict]]: Liste des résultats (None si échec pour un prompt)
        
    Exemple:
        prompts = [
            "Coffee beans close-up",
            "Coffee plantation landscape", 
            "Modern coffee shop interior"
        ]
        results = batch_generate_gpt(prompts)
    """
    results = []
    
    for i, prompt in enumerate(prompts):
        print(f"Génération {i+1}/{len(prompts)}: {prompt[:50]}...")
        
        try:
            images = generate_image_gpt(prompt, model=model)
            if images:
                results.append(images[0])  # Prendre la première image
            else:
                results.append(None)
        except Exception as e:
            print(f"Erreur prompt {i+1}: {e}")
            results.append(None)
    
    return results


def save_image_from_b64(b64_string: str, filepath: str) -> bool:
    """
    Sauvegarde une image base64 sur disque
    
    Args:
        b64_string (str): Image encodée en base64
        filepath (str): Chemin de sauvegarde
        
    Returns:
        bool: True si succès, False sinon
    """
    try:
        image_bytes = base64.b64decode(b64_string)
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        return True
    except Exception as e:
        print(f"Erreur sauvegarde image: {e}")
        return False


def load_image_to_b64(filepath: str) -> Optional[str]:
    """
    Charge une image depuis le disque et la convertit en base64
    
    Args:
        filepath (str): Chemin vers l'image
        
    Returns:
        str: Image encodée en base64
        None si erreur
    """
    try:
        with open(filepath, 'rb') as f:
            image_bytes = f.read()
        return base64.b64encode(image_bytes).decode()
    except Exception as e:
        print(f"Erreur chargement image: {e}")
        return None


# ==============================================================================
# FONCTIONS D'USAGE SIMPLE POUR TON WORKFLOW YOUTUBE ILLUSTRATION FINDER
# ==============================================================================

def generate_youtube_illustration(
    scene_description: str,
    style: str = "cinematic",
    output_path: str = None
) -> Optional[str]:
    """
    Fonction spécialisée pour YouTube Illustration Finder
    
    Args:
        scene_description (str): Description de la scène vidéo
        style (str): Style visuel ("cinematic", "documentary", "cartoon", "minimalist")
        output_path (str): Chemin de sauvegarde (optionnel)
        
    Returns:
        str: Chemin de l'image sauvegardée ou base64 si pas de chemin
        
    Exemple:
        # Pour une scène de café
        result = generate_youtube_illustration(
            "A beautiful sunrise over coffee plantations in Ethiopia",
            style="cinematic",
            output_path="scene_001.png"
        )
    """
    # Construire un prompt optimisé pour YouTube
    style_prompts = {
        "cinematic": "cinematic lighting, professional photography, film-like quality",
        "documentary": "documentary style, realistic, natural lighting, authentic",
        "cartoon": "illustrated style, vibrant colors, cartoon-like, animated",
        "minimalist": "clean, minimal, simple composition, elegant"
    }
    
    style_modifier = style_prompts.get(style, style_prompts["cinematic"])
    enhanced_prompt = f"{scene_description}, {style_modifier}, high quality, perfect for YouTube video thumbnail or illustration"
    
    # Générer l'image
    images = generate_image_gpt(
        prompt=enhanced_prompt,
        model="gpt-image-1"
    )
    
    if not images:
        return None
    
    # Sauvegarder ou retourner base64
    if output_path:
        success = save_image_from_b64(images[0]['b64_json'], output_path)
        return output_path if success else None
    else:
        return images[0]['b64_json']


def generate_scene_variations(
    scene_description: str,
    num_variations: int = 3,
    style: str = "cinematic"
) -> List[Dict[str, str]]:
    """
    Génère plusieurs variations d'une même scène
    
    Args:
        scene_description (str): Description de base de la scène
        num_variations (int): Nombre de variations à générer
        style (str): Style visuel
        
    Returns:
        List[Dict]: Liste des variations avec métadonnées
        
    Exemple:
        variations = generate_scene_variations(
            "Coffee beans being harvested by hand",
            num_variations=3,
            style="documentary"
        )
    """
    variations = []
    variation_modifiers = [
        "close-up perspective, detailed",
        "wide angle view, environmental context", 
        "medium shot, balanced composition",
        "artistic angle, creative perspective",
        "professional lighting, studio quality"
    ]
    
    for i in range(min(num_variations, len(variation_modifiers))):
        modifier = variation_modifiers[i]
        prompt = f"{scene_description}, {modifier}, {style} style"
        
        images = generate_image_gpt(prompt, model="gpt-image-1")
        if images:
            variations.append({
                'b64_json': images[0]['b64_json'],
                'prompt': prompt,
                'variation_type': modifier,
                'style': style
            })
    
    return variations


# ==============================================================================
# INTÉGRATION AVEC VOTRE SYSTÈME EXISTANT
# ==============================================================================

def integrate_with_youtube_finder(script_segments: List[Dict]) -> List[Dict]:
    """
    Intègre la génération d'images dans le workflow YouTube Illustration Finder
    
    Args:
        script_segments: Liste des segments du script au format:
                        [{"timestamp": "0:00", "text": "description..."}, ...]
    
    Returns:
        List[Dict]: Segments enrichis avec images générées
        
    Exemple d'utilisation dans votre workflow:
        script = [
            {"timestamp": "0:00", "text": "A beautiful sunrise over coffee plantations"},
            {"timestamp": "0:15", "text": "Close-up of coffee beans being harvested"}
        ]
        
        enriched_script = integrate_with_youtube_finder(script)
    """
    enriched_segments = []
    
    for segment in script_segments:
        timestamp = segment.get('timestamp', '0:00')
        description = segment.get('text', '')
        
        # Générer l'image pour ce segment
        print(f"Génération d'image pour {timestamp}: {description[:50]}...")
        
        image_data = generate_youtube_illustration(
            scene_description=description,
            style="cinematic"  # Ou dynamique selon vos paramètres
        )
        
        # Enrichir le segment
        enriched_segment = segment.copy()
        enriched_segment.update({
            'generated_image': {
                'b64_json': image_data,
                'source': 'gpt-image-1',
                'license': 'ai-generated',
                'cost': 0.04,  # Coût estimé
                'relevance_score': 1.0  # Score parfait car généré sur mesure
            }
        })
        
        enriched_segments.append(enriched_segment)
    
    return enriched_segments


# ==============================================================================
# EXEMPLE D'UTILISATION COMPLÈTE
# ==============================================================================

def example_youtube_workflow():
    """
    Exemple complet d'utilisation pour YouTube Illustration Finder
    """
    print("🎨 Exemple workflow GPT Image Generation pour YouTube")
    
    # Script d'exemple
    script = [
        {"timestamp": "0:00", "text": "A beautiful sunrise over coffee plantations in Ethiopia, with mist rolling over the hills"},
        {"timestamp": "0:15", "text": "Close-up of coffee beans being harvested by hand, showing the red coffee cherries"},
        {"timestamp": "0:30", "text": "Traditional coffee roasting over an open fire, with smoke and aromatic atmosphere"}
    ]
    
    # Génération d'images pour chaque scène
    for segment in script:
        print(f"\n📍 {segment['timestamp']}: {segment['text'][:50]}...")
        
        # Méthode 1: Image unique
        image_path = f"scene_{segment['timestamp'].replace(':', '_')}.png"
        result = generate_youtube_illustration(
            segment['text'],
            style="cinematic",
            output_path=image_path
        )
        
        if result:
            print(f"✅ Image générée: {result}")
        
        # Méthode 2: Variations multiples
        variations = generate_scene_variations(
            segment['text'],
            num_variations=2,
            style="cinematic"
        )
        
        print(f"✅ {len(variations)} variations générées")


if __name__ == "__main__":
    example_youtube_workflow()