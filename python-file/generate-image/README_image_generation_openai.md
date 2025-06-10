# 🎨 OpenAI GPT Image Generation Module

> **Génération et édition d'images avec la nouvelle API OpenAI GPT-Image-1**

Un module Python complet pour intégrer la génération d'images IA dans vos workflows, spécialement optimisé pour le projet YouTube Illustration Finder.

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![OpenAI GPT-Image-1](https://img.shields.io/badge/OpenAI-GPT--Image--1-green.svg)](https://openai.com/)

---

## 📋 Table des matières

- [🚀 Démarrage rapide](#-démarrage-rapide)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎯 Fonctions principales](#-fonctions-principales)
- [💡 Exemples d&#39;utilisation](#-exemples-dutilisation)
- [🔧 Intégration dans votre projet](#-intégration-dans-votre-projet)
- [💰 Coûts et limites](#-coûts-et-limites)
- [❗ Troubleshooting](#-troubleshooting)
- [📚 Référence API](#-référence-api)

---

## 🚀 Démarrage rapide

```python
from src.tools.image_generation_openai import generate_youtube_illustration

# Génération simple d'une illustration
result = generate_youtube_illustration(
    scene_description="A beautiful sunrise over coffee plantations in Ethiopia",
    style="cinematic",
    output_path="my_scene.png"
)

print(f"Image générée : {result}")
```

**Résultat** : Une image cinématographique sauvegardée dans `my_scene.png` 🎬

---

## 📦 Installation

### Prérequis

```bash
Python >= 3.8
```

### Dépendances

```bash
pip install openai>=1.52.0 requests>=2.31.0
```

### Fichier requirements.txt

```txt
openai>=1.52.0
requests>=2.31.0
```

---

## ⚙️ Configuration

### 1. Variables d'environnement

Créez un fichier `.env` :

```bash
# Obligatoire
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx

# Optionnel (pour debug)
OPENAI_ORG_ID=org-xxxxxxxxxx
```

### 2. Vérification de la configuration

```python
import os
from openai import OpenAI

# Test de connexion
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
print("✅ Configuration OpenAI OK")
```

---

## 🎯 Fonctions principales

### 🔥 Fonctions recommandées (High-level)

| Fonction                            | Usage                                     | Retour                     |
| ----------------------------------- | ----------------------------------------- | -------------------------- |
| `generate_youtube_illustration()` | **Génération optimisée YouTube** | `str` (chemin ou base64) |
| `generate_scene_variations()`     | **Variations d'une scène**         | `List[Dict]`             |
| `integrate_with_youtube_finder()` | **Intégration workflow complet**   | `List[Dict]`             |

### ⚙️ Fonctions core (Low-level)

| Fonction                 | Usage                | Retour         |
| ------------------------ | -------------------- | -------------- |
| `generate_image_gpt()` | Génération basique | `List[Dict]` |
| `edit_image_gpt()`     | Édition d'image     | `Dict`       |
| `batch_generate_gpt()` | Génération en lot  | `List[Dict]` |

### 🛠️ Fonctions utilitaires

| Fonction                  | Usage                        | Retour   |
| ------------------------- | ---------------------------- | -------- |
| `save_image_from_b64()` | Sauvegarde base64 → fichier | `bool` |
| `load_image_to_b64()`   | Chargement fichier → base64 | `str`  |

---

## 💡 Exemples d'utilisation

### 🎬 Cas 1 : Génération simple pour YouTube

```python
from src.tools.image_generation_openai import generate_youtube_illustration

# Génération avec sauvegarde automatique
image_path = generate_youtube_illustration(
    scene_description="Close-up of coffee beans being roasted over an open fire",
    style="documentary",  # Options: cinematic, documentary, cartoon, minimalist
    output_path="coffee_roasting.png"
)

if image_path:
    print(f"✅ Image sauvegardée : {image_path}")
else:
    print("❌ Erreur de génération")
```

### 🎭 Cas 2 : Variations multiples d'une scène

```python
from src.tools.image_generation_openai import generate_scene_variations

variations = generate_scene_variations(
    scene_description="Modern coffee shop interior with vintage furniture",
    num_variations=3,
    style="cinematic"
)

# Sauvegarder toutes les variations
for i, variation in enumerate(variations):
    save_image_from_b64(
        variation['b64_json'], 
        f"coffee_shop_variation_{i+1}.png"
    )
    print(f"Style: {variation['variation_type']}")
```

### 📝 Cas 3 : Traitement d'un script complet

```python
from src.tools.image_generation_openai import integrate_with_youtube_finder

# Script YouTube typique
script = [
    {"timestamp": "0:00", "text": "Introduction scene with host in modern studio"},
    {"timestamp": "0:30", "text": "Historical coffee plantation in 19th century Ethiopia"},
    {"timestamp": "1:00", "text": "Modern coffee roasting factory with industrial equipment"}
]

# Génération automatique pour tout le script
enriched_script = integrate_with_youtube_finder(script)

# Accéder aux images générées
for segment in enriched_script:
    timestamp = segment['timestamp']
    image_data = segment['generated_image']['b64_json']
  
    # Sauvegarder
    filename = f"scene_{timestamp.replace(':', '_')}.png"
    save_image_from_b64(image_data, filename)
    print(f"✅ {timestamp}: {filename}")
```

### ✏️ Cas 4 : Édition d'image existante

```python
from src.tools.image_generation_openai import edit_image_gpt, load_image_to_b64

# Charger une image existante
original_b64 = load_image_to_b64("original_scene.png")

# Éditer l'image
edited_result = edit_image_gpt(
    base64_image=original_b64,
    edit_prompt="Add dramatic sunset lighting and remove the clouds"
)

if edited_result:
    # Sauvegarder l'image éditée
    save_image_from_b64(edited_result['b64_json'], "edited_scene.png")
    print("✅ Image éditée avec succès")
```

### 🚀 Cas 5 : Génération en lot (batch)

```python
from src.tools.image_generation_openai import batch_generate_gpt

prompts = [
    "Professional barista making espresso, close-up hands",
    "Coffee beans falling in slow motion, dramatic lighting", 
    "Cozy coffee shop ambiance, warm lighting, customers reading",
    "Coffee plantation workers at sunrise, documentary style"
]

# Génération en batch
results = batch_generate_gpt(prompts, model="gpt-image-1")

# Sauvegarder tous les résultats
for i, result in enumerate(results):
    if result:  # Vérifier que la génération a réussi
        filename = f"batch_image_{i+1}.png"
        save_image_from_b64(result['b64_json'], filename)
        print(f"✅ {filename} généré")
    else:
        print(f"❌ Échec génération {i+1}")
```

---

## 🔧 Intégration dans votre projet

### 📁 Structure de projet recommandée

```
your_project/
├── src/
│   └── tools/
│       └── image_generation_openai.py  # Ce module
├── .env                                # Clés API
├── requirements.txt                    # Dépendances
└── main.py                            # Votre code principal
```

### 🔗 Intégration dans un workflow existant

```python
# Dans votre script principal
from src.tools.image_generation_openai import generate_youtube_illustration

def process_video_script(script_segments, style="cinematic"):
    """Intègre la génération d'images dans votre workflow"""
  
    enhanced_segments = []
  
    for segment in script_segments:
        # Votre logique existante...
        keywords = extract_keywords(segment['text'])
    
        # NOUVEAU: Génération d'image IA
        ai_image_b64 = generate_youtube_illustration(
            scene_description=segment['text'],
            style=style
        )
    
        # Ajouter l'image IA aux résultats
        if ai_image_b64:
            segment['ai_generated_image'] = {
                'data': ai_image_b64,
                'source': 'gpt-image-1',
                'license': 'ai-generated',
                'cost': 0.04,
                'relevance_score': 1.0  # Parfait car sur mesure
            }
    
        enhanced_segments.append(segment)
  
    return enhanced_segments
```

### 🎨 Intégration dans Streamlit

```python
import streamlit as st
from src.tools.image_generation_openai import generate_youtube_illustration

# Dans votre interface Streamlit
if st.button("🎨 Générer image IA"):
    with st.spinner("Génération en cours..."):
        ai_image = generate_youtube_illustration(
            scene_description=user_prompt,
            style=selected_style
        )
    
        if ai_image:
            # Afficher l'image générée
            st.image(f"data:image/png;base64,{ai_image}")
            st.success("✅ Image IA générée!")
        
            # Bouton de téléchargement
            st.download_button(
                label="📥 Télécharger",
                data=base64.b64decode(ai_image),
                file_name="generated_scene.png",
                mime="image/png"
            )
```

---

## 💰 Coûts et limites

### 💸 Tarification OpenAI (estimée)

| Opération                      | Coût estimé | Modèle     |
| ------------------------------- | ------------- | ----------- |
| **Génération standard** | ~$0.02-0.04   | gpt-image-1 |
| **Génération HD**       | ~$0.04-0.08   | gpt-image-1 |
| **Édition d'image**      | ~$0.02-0.04   | gpt-image-1 |

> ⚠️ **Note** : Les prix peuvent varier. Consultez la documentation OpenAI officielle.

### ⏱️ Limites de performance

| Limite                       | Valeur    | Note                    |
| ---------------------------- | --------- | ----------------------- |
| **Taille max image**   | 1536x1536 | Dépend du modèle      |
| **Timeout requête**   | 60s       | Configurable            |
| **Rate limit**         | Variable  | Selon votre plan OpenAI |
| **Formats supportés** | PNG, JPG  | Sortie en PNG base64    |

### 🔧 Optimisations recommandées

```python
# ✅ Bonnes pratiques
def optimized_generation():
    # 1. Utiliser un cache simple
    cache = {}
  
    def cached_generate(prompt, style):
        cache_key = f"{prompt}_{style}"
        if cache_key in cache:
            return cache[cache_key]
    
        result = generate_youtube_illustration(prompt, style)
        cache[cache_key] = result
        return result
  
    # 2. Générer en batch quand possible
    prompts = ["prompt1", "prompt2", "prompt3"]
    results = batch_generate_gpt(prompts)  # Plus efficace
  
    # 3. Gérer les erreurs gracieusement
    try:
        result = generate_youtube_illustration(prompt)
    except Exception as e:
        print(f"Fallback : {e}")
        result = get_fallback_image()  # Votre image par défaut
```

---

## ❗ Troubleshooting

### 🚨 Erreurs courantes

#### 1. **Erreur d'authentification**

```
Error: Invalid API key
```

**Solution** :

```python
# Vérifier la clé API
import os
print(f"API Key présente: {bool(os.getenv('OPENAI_API_KEY'))}")
print(f"API Key valide: {os.getenv('OPENAI_API_KEY', '')[:10]}...")
```

#### 2. **Timeout de requête**

```
Error: Request timeout
```

**Solution** :

```python
# Augmenter le timeout (si nécessaire, modifier le module)
import openai
openai.timeout = 120  # 2 minutes
```

#### 3. **Rate limit atteint**

```
Error: Rate limit exceeded
```

**Solution** :

```python
import time

def generate_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            return generate_youtube_illustration(prompt)
        except Exception as e:
            if "rate limit" in str(e).lower():
                wait_time = 2 ** attempt  # Backoff exponentiel
                print(f"Rate limit atteint. Attente {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise e
    return None
```

#### 4. **Image non générée**

```
Aucune image générée dans la réponse
```

**Solution** :

```python
# Simplifier le prompt
prompt_simple = "A coffee cup on a table"  # Au lieu d'un prompt complexe
result = generate_youtube_illustration(prompt_simple)

# Ou vérifier les logs détaillés
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 🔍 Debug avancé

```python
def debug_generation(prompt):
    """Fonction de debug complète"""
    print(f"🔍 Debug génération pour: {prompt[:50]}...")
  
    # 1. Vérifier la configuration
    api_key = os.getenv('OPENAI_API_KEY')
    print(f"API Key: {'✅' if api_key else '❌'}")
  
    # 2. Test de connexion
    try:
        client = OpenAI(api_key=api_key)
        print("Connexion OpenAI: ✅")
    except Exception as e:
        print(f"Connexion OpenAI: ❌ {e}")
        return
  
    # 3. Génération avec logs détaillés
    try:
        result = generate_youtube_illustration(prompt, style="cinematic")
        if result:
            print(f"Génération: ✅ ({len(result)} caractères)")
            return result
        else:
            print("Génération: ❌ Aucun résultat")
    except Exception as e:
        print(f"Génération: ❌ {e}")
        import traceback
        traceback.print_exc()

# Utilisation
debug_generation("Test prompt")
```

---

## 📚 Référence API

### 🔵 generate_youtube_illustration()

**Fonction principale recommandée pour YouTube Illustration Finder**

```python
def generate_youtube_illustration(
    scene_description: str,
    style: str = "cinematic",
    output_path: str = None
) -> Optional[str]
```

**Paramètres:**

- `scene_description` (str) : Description de la scène vidéo
- `style` (str) : Style visuel - `"cinematic"`, `"documentary"`, `"cartoon"`, `"minimalist"`
- `output_path` (str, optionnel) : Chemin de sauvegarde

**Retour:**

- `str` : Chemin du fichier sauvegardé OU base64 si pas de `output_path`
- `None` : En cas d'erreur

**Exemple:**

```python
# Avec sauvegarde
path = generate_youtube_illustration(
    "Coffee beans roasting", 
    style="documentary",
    output_path="roasting.png"
)

# Sans sauvegarde (retourne base64)
b64_data = generate_youtube_illustration("Coffee plantation sunset")
```

---

### 🔵 generate_scene_variations()

**Génère plusieurs variations stylistiques d'une même scène**

```python
def generate_scene_variations(
    scene_description: str,
    num_variations: int = 3,
    style: str = "cinematic"
) -> List[Dict[str, str]]
```

**Paramètres:**

- `scene_description` (str) : Description de base
- `num_variations` (int) : Nombre de variations (max 5)
- `style` (str) : Style de base

**Retour:**

```python
[
    {
        'b64_json': 'iVBORw0KGgoAAAANSUhEUgAA...',
        'prompt': 'Coffee shop, close-up perspective, cinematic style',
        'variation_type': 'close-up perspective, detailed',
        'style': 'cinematic'
    },
    # ... autres variations
]
```

---

### 🔵 integrate_with_youtube_finder()

**Intégration complète avec le workflow YouTube Illustration Finder**

```python
def integrate_with_youtube_finder(
    script_segments: List[Dict]
) -> List[Dict]
```

**Paramètres:**

```python
script_segments = [
    {"timestamp": "0:00", "text": "Scene description"},
    {"timestamp": "0:15", "text": "Another scene"},
    # ...
]
```

**Retour:**

```python
[
    {
        "timestamp": "0:00",
        "text": "Scene description",
        "generated_image": {
            "b64_json": "iVBORw0KGgoAAAANSUhEUgAA...",
            "source": "gpt-image-1",
            "license": "ai-generated",
            "cost": 0.04,
            "relevance_score": 1.0
        }
    },
    # ... autres segments enrichis
]
```

---

### 🔵 Fonctions utilitaires

#### save_image_from_b64()

```python
success = save_image_from_b64("iVBORw0KGgo...", "output.png")
# Retourne: True si succès, False sinon
```

#### load_image_to_b64()

```python
b64_string = load_image_to_b64("input.png")
# Retourne: string base64 ou None si erreur
```

#### batch_generate_gpt()

```python
prompts = ["prompt1", "prompt2", "prompt3"]
results = batch_generate_gpt(prompts, model="gpt-image-1")
# Retourne: List[Dict] ou List[None] pour les échecs
```

---

## 🏆 Bonnes pratiques

### ✅ Do's (À faire)

1. **Utilisez des prompts descriptifs** :

   ```python
   # ✅ Bon
   "Professional barista in modern coffee shop, preparing espresso with steam, warm lighting, documentary style"

   # ❌ Éviter
   "Coffee"
   ```
2. **Gérez les erreurs gracieusement** :

   ```python
   result = generate_youtube_illustration(prompt)
   if result:
       # Utiliser l'image générée
       process_image(result)
   else:
       # Fallback vers image par défaut
       use_default_image()
   ```
3. **Optimisez les coûts** :

   ```python
   # Cache simple pour éviter la régénération
   image_cache = {}
   cache_key = f"{prompt}_{style}"
   if cache_key not in image_cache:
       image_cache[cache_key] = generate_youtube_illustration(prompt, style)
   ```

### ❌ Don'ts (À éviter)

1. **Ne pas exposer les clés API** :

   ```python
   # ❌ Jamais ça
   api_key = "sk-proj-real-key-here"

   # ✅ Toujours via variables d'environnement
   api_key = os.getenv('OPENAI_API_KEY')
   ```
2. **Ne pas ignorer les timeouts** :

   ```python
   # ❌ Éviter
   result = generate_youtube_illustration(very_complex_prompt)  # Peut timeout

   # ✅ Préférer
   try:
       result = generate_youtube_illustration(simple_prompt)
   except TimeoutError:
       result = get_fallback_image()
   ```
