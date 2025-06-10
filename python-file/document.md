# 📋 DOCUMENTATION TECHNIQUE - image_search.py

## 🎯 OBJECTIF DU MODULE

Ce module fournit une interface unifiée pour rechercher des images sur plusieurs sources (Pexels, DataForSEO, Everypixel) et générer des images avec DALL-E 3.

---

## 🔧 DÉPENDANCES REQUISES

### Python packages (requirements.txt) :

openai
openai-agents
pydantic
aiohttp
tenacity

requests

### Variables d'environnement (.env) :

# # Image API Keys

PEXELS_API_KEY="iA7W6ny7SrUYFSM1BwCnWUpeJ2lbuc3I6OxhOeyovgIbTknoQIjKSKma"

EVERYPIXEL_API_KEY="d1iUKlwmg1VXAGheWkN0yBOqNIIlXCMDhf3eCToBUNnQf6Pm"

DATAFORSEO_LOGIN="alexandre@selas.studio"

DATAFORSEO_PASSWORD="45019da11ac6e04e"

# Configuration

DEFAULT_STYLE=cinematic

DEFAULT_BUDGET=mixed

MAX_IMAGES_PER_SCENE=5

ENABLE_TRACING=true

## 📊 MODÈLES DE DONNÉES (Pydantic)

### ImageResult - Format standardisé des résultats :

class ImageResult(BaseModel):
    url: str                    # URL image haute résolution
    preview_url: str           # URL thumbnail/preview
    source: str                # 'pexels', 'dataforseo', 'everypixel', 'dalle-3'
    license: str               # 'CC0', 'likely free', 'premium/paid', etc.
    cost: float                # Coût estimé (0.0 = gratuit)
    width: int                 # Largeur en pixels
    height: int                # Hauteur en pixels
    title: str                 # Titre/description
    relevance_score: float     # Score 0.0-1.0
    photographer: str          # Nom photographe (si dispo)
    source_website: str        # Site source d'origine

### SearchFilters - Filtres de recherche :

class SearchFilters(BaseModel):
    orientation: str = "all"   # "landscape", "portrait", "square", "all"
    color: str = "all"         # couleur spécifique ou "all"
    category: str = "all"      # "nature", "people", "technology", etc.

---

## 🔍 CLASSES PRINCIPALES

### DataForSEOImageSearch - Client pour Google Images via DataForSEO

#### Initialisation :

client = DataForSEOImageSearch()

#### Méthode principale :

results = client.search_images(query="sunset", depth=20)

# Retourne: List[Dict[str, Any]]

#### Format de retour DataForSEO :

{
    'url': 'https://...',              # URL image originale
    'preview_url': 'https://...',      # URL encoded pour preview
    'title': 'Beautiful sunset',       # Titre/alt text
    'source': 'dataforseo',           # Identifiant source
    'source_website': 'unsplash.com', # Site d'origine
    'license': 'unknown',             # À classifier par la suite
    'cost': 0.0,
    'relevance_score': 0.8,
    'width': 0, 'height': 0           # Pas fourni par DataForSEO
}

## 🎨 FONCTIONS DE RECHERCHE

### 1. search_free_images() - Avec décorateur @function_tool

@function_tool
def search_free_images(query: str, count: int = 10) -> List[ImageResult]:
    """Recherche uniquement sources gratuites (Pexels + DataForSEO filtré)"""

# Usage dans système d'agents OpenAI:

results = search_free_images("coffee", count=5)

# Retourne: List[ImageResult] (Pydantic models)

---

**# Usage dans système d'agents OpenAI:**

**results **=** **search_free_images**(**"coffee"**,** **count**=**5**)

**# Retourne: List[ImageResult] (Pydantic models)**

### 2. search_all_images() - Sans décorateur, retour Dict

def search_everypixel(query: str, license: str = 'all', count: int = 20) -> List[Dict[str, Any]]:
    """Meta-search via Everypixel (Shutterstock, Getty, etc.)"""

results = search_everypixel("coffee", license='free', count=10)

---

**# Usage direct:**

**results **=** **search_all_images**(**"coffee"**)**

**# Retourne: List[Dict[str, Any]] (format raw)**

### 3. search_everypixel() - Meta-search

python

Apply to image_search...

**def** **search_everypixel**(**query**: **str**, **license**: **str** **=** **'all'**, **count**: **int** **=** **20**)** -> List**[**Dict**[**str**,** Any**]**]**:

**    **"""Meta-search via Everypixel (Shutterstock, Getty**, etc.)"""**

---

**# Options license: 'free', 'paid', 'all'**

**results **=** **search_everypixel**(**"coffee"**,** **license**=**'free'**,** **count**=**10**)**

## ⚡ FONCTIONS HELPER IMPORTANTES

### _search_pexels() - Accès direct Pexels

python

Apply to image_search...

**def** **_search_pexels**(**query**: **str**, **count**: **int** **=** **10**)** -> List**[**Dict**[**str**,** Any**]**]**:

**    **"""Recherche Pexels avec retry automatique"""

---

**# Retourne format standardisé:**

**{**

**    **'url'**: **'https://images.pexels.com/...'**,**

**    **'preview_url'**: **'https://images.pexels.com/.../medium'**,**

**    **'source'**: **'pexels'**,**

**    **'license'**: **'CC0'**,**               **# Toujours gratuit**

**    **'cost'**: **0.0**,**

**    **'photographer'**: **'John Doe'**,**

**    **'source_website'**: **'pexels.com'

**}**

---

## 🚀 EXEMPLES D'INTÉGRATION

### Exemple 1 - Recherche simple :


from src.tools.image_search import DataForSEOImageSearch, _search_pexels

# Recherche gratuite Pexels

pexels_results = _search_pexels("coffee", count=10)
print(f"Trouvé {len(pexels_results)} images Pexels")

# Recherche étendue DataForSEO

client = DataForSEOImageSearch()
dataforseo_results = client.search_images("coffee", depth=20)
print(f"Trouvé {len(dataforseo_results)} images DataForSEO")

### Exemple 2 - Workflow complet :


def search_images_workflow(query: str, budget: str = "mixed"):
    """Workflow adapté à ton use case"""
    results = []

    # 1. Toujours commencer par Pexels (gratuit)
    pexels_images = _search_pexels(query, 15)
    results.extend(pexels_images)

    # 2. Ajouter DataForSEO si budget le permet
    if budget in ["mixed", "unlimited"]:
        client = DataForSEOImageSearch()
        dataforseo_images = client.search_images(query, depth=20)

    # 3. Classifier les licences DataForSEO
        for img in dataforseo_images:
            source_site = img.get('source_website', '').lower()
            if any(free_src in source_site for free_src in ['pexels', 'unsplash', 'pixabay']):
                img['license'] = 'likely free'
            elif any(paid_src in source_site for paid_src in ['shutterstock', 'getty']):
                img['license'] = 'premium/paid'
            else:
                img['license'] = 'verify required'

    results.extend(dataforseo_images)

    # 4. Dédoublonnage par URL
    seen_urls = set()
    unique_results = []
    for img in results:
        if img['url'] not in seen_urls:
            seen_urls.add(img['url'])
            unique_results.append(img)

    return unique_results

### Exemple 3 - Avec gestion d'erreurs :


def safe_image_search(query: str, fallback_to_ai: bool = False):
    """Recherche avec fallbacks"""
    try:
        # Tentative recherche normale
        results = search_images_workflow(query)

    if len(results) < 3 and fallback_to_ai:
            # Fallback vers IA si peu de résultats
            ai_image = generate_ai_image(query)
            if ai_image.url:  # Vérifier que génération a réussi
                results.append(ai_image.dict())

    return results

    except Exception as e:
        print(f"Erreur recherche images: {e}")
        return []

## 💰 COÛTS ET LIMITES

| Service    | Coût            | Limite             | Notes                |
| ---------- | ---------------- | ------------------ | -------------------- |
| Pexels     | Gratuit          | 200/h, 20k/mois    | Toujours CC0         |
| DataForSEO | $0.0016/requête | Pas de limite      | depth=20 recommandé |
| Everypixel | Variable         | Selon plan         | Meta-search premium  |
| DALL-E 3   | $0.04/image      | Selon quota OpenAI | 1024x1024 HD         |

---

## ⚠️ POINTS ATTENTION

1. Décorateurs @function_tool : Seulement pour système d'agents OpenAI
2. Gestion erreurs : Toutes fonctions retournent liste vide en cas d'erreur
3. Licences DataForSEO : Toujours classifier manuellement selon source_website
4. Retry automatique : Pexels a retry intégré, pas les autres
5. Timeouts : 10s pour Pexels/Everypixel, 30s pour DataForSEO

---

## 🔌 INTÉGRATION DANS TON WORKFLOW

Ton pote peut utiliser directement :* DataForSEOImageSearch.search_images() pour recherche étendue

* _search_pexels() pour images gratuites fiables
* search_images_workflow() (exemple 2) comme point d'entrée principal

Le module est prêt à l'emploi avec gestion complète des erreurs et formats standardisés ! 🚀
