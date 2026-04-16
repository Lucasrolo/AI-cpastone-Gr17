from fastapi import FastAPI, File, UploadFile, Form
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import os
import csv
import json
import base64
import numpy as np
import cv2
import httpx
import os
from dotenv import load_dotenv
from rembg import remove

# Load environment variables from .env if present
load_dotenv()

# Try to register HEIC support for iPhone photos
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

app = FastAPI(
    title="Plant Disease API",
    description="API to predict plant diseases using per-plant specialized ResNet18 models"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Plant Disease Detection API is running!", "status": "alive"}

# ── Hardware ──────────────────────────────────────────────────────────────────
device = torch.device(
    "cuda" if torch.cuda.is_available()
    else "mps" if torch.backends.mps.is_available()
    else "cpu"
)
print(f"Using device: {device}")

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR            = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API_DIR             = os.path.join(BASE_DIR, "api")
PER_PLANT_MODEL_DIR = os.path.join(API_DIR, "models", "per_plant_models")
GLOBAL_MODEL_PATH   = os.path.join(API_DIR, "models", "best_plant_disease_model.pth")
CSV_PATH            = os.path.join(API_DIR, "data", "CSV_treatment_diseese.csv")
AMAZON_CSV_PATH     = os.path.join(API_DIR, "data", "amazon_links_table.csv")

# ── Global class names (38 classes, original model) ───────────────────────────
GLOBAL_CLASS_NAMES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
    'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
    'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
]

# Plants that have dedicated per-plant models (must match saved file names)
SUPPORTED_PLANTS = [
    "apple", "cherry", "corn", "grape", "peach",
    "pepper", "potato", "strawberry", "tomato"
]

# ── Thresholds ────────────────────────────────────────────────────────────────
# Layer 1: global model confidence must exceed this to be considered a plant leaf.
# With 38 classes, a truly random/non-plant image scores ~3-15%.
# Real plant leaves score 60-99%. 30% is a safe, aggressive cutoff.
PLANT_CONFIDENCE_THRESHOLD = 0.30
# Layer 2: per-plant model must exceed this to accept the specific plant match
PLANT_MATCH_THRESHOLD      = 0.55
# Dropout rate used during v2 model training
DROPOUT = 0.30

# ── Image transform (shared) ──────────────────────────────────────────────────
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# ── Load global model (Layer 1 validator) ────────────────────────────────────
def build_resnet_v1(num_classes: int):
    """Build ResNet-18 for older v1 models (no dropout)."""
    m = models.resnet18(weights=None)
    m.fc = nn.Linear(m.fc.in_features, num_classes)
    return m

def build_resnet_v2(num_classes: int):
    """
    Build ResNet-18 matching the v2 training architecture.
    Uses nn.Sequential(Dropout, Linear) for the fc layer.
    """
    m = models.resnet18(weights=None)
    m.fc = nn.Sequential(
        nn.Dropout(p=DROPOUT),
        nn.Linear(m.fc.in_features, num_classes)
    )
    return m

global_model = build_resnet_v1(len(GLOBAL_CLASS_NAMES))
try:
    global_model.load_state_dict(torch.load(GLOBAL_MODEL_PATH, map_location=device))
    global_model.to(device)
    global_model.eval()
    print(f"✅ Global model loaded from {GLOBAL_MODEL_PATH}")
except Exception as e:
    print(f"⚠️  Could not load global model: {e}")
    global_model = None

# ── Per-plant model cache (lazy-loaded on first use) ─────────────────────────
_plant_model_cache: dict = {}   # plant_key -> nn.Module
_plant_label_cache: dict = {}   # plant_key -> {str(idx): class_name}

def get_plant_model(plant_key: str):
    """Return (model, label_map) for the given plant key, loading on first call."""
    if plant_key not in _plant_model_cache:
        label_path = os.path.join(PER_PLANT_MODEL_DIR, f"{plant_key}_labels.json")
        model_path = os.path.join(PER_PLANT_MODEL_DIR, f"{plant_key}_model.pth")

        if not os.path.exists(label_path) or not os.path.exists(model_path):
            return None, None

        with open(label_path, "r") as f:
            label_map = json.load(f)   # {"0": "Apple___Apple_scab", ...}

        num_classes = len(label_map)
        m = build_resnet_v2(num_classes)
        m.load_state_dict(torch.load(model_path, map_location=device))
        m.to(device)
        m.eval()

        _plant_model_cache[plant_key] = m
        _plant_label_cache[plant_key] = label_map
        print(f"✅ Loaded per-plant model for '{plant_key}' ({num_classes} classes)")

    return _plant_model_cache[plant_key], _plant_label_cache[plant_key]


# ── String Normalizer ─────────────────────────────────────────────────────────
import string

def normalize_text(text: str) -> str:
    """Lowercase text and remove all punctuation and excess whitespace to ensure stable matching."""
    if not text: return ""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    return " ".join(text.split())


# ── Load Amazon Links ─────────────────────────────────────────────────────────
amazon_links_db: dict = {}
try:
    with open(AMAZON_CSV_PATH, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            treatment_type = row.get('Types of chemical treatment', '').strip()
            if not treatment_type: continue
            
            norm_key = normalize_text(treatment_type)
            
            links = []
            for col in ['Amazon links', 'Column1', 'Column2', 'Column3', 'Column4']:
                val = row.get(col, '').strip()
                if val and getattr(val, 'lower', lambda: '')() != 'none':
                    # Fix missing https scheme
                    if val.startswith('amazon.com') or val.startswith('www.'):
                        if not val.startswith('http'):
                            val = 'https://' + val
                            
                    # Add simple validation
                    if val.startswith('http'):
                        links.append(val)
                    
            if links:
                amazon_links_db[norm_key] = links
                
    print(f"✅ Amazon links CSV loaded ({len(amazon_links_db)} treatments mapped)")
except Exception as e:
    print(f"⚠️  Could not load amazon links CSV: {e}")


# ── CSV treatments DB ─────────────────────────────────────────────────────────
treatments_db: dict = {}
try:
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            chem = row['Chemical_Treatment'].strip()
            norm_chem = normalize_text(chem)
            
            treatments_db[row['Class_Name']] = {
                "organic":        row['Organic_Treatment'].strip(),
                "chemical":       chem,
                "chemical_links": amazon_links_db.get(norm_chem, []),
                "preventative":   row['Preventative_Measure'].strip()
            }
    print(f"✅ Treatments CSV loaded ({len(treatments_db)} entries)")
except Exception as e:
    print(f"⚠️  Could not load treatments CSV: {e}")

# ── Helpers ───────────────────────────────────────────────────────────────────
def clean_class_name(raw_name: str) -> dict:
    if "___" in raw_name:
        plant, condition = raw_name.split("___", 1)
        return {
            "plant":     plant.replace("_", " "),
            "condition": condition.replace("_", " ")
        }
    return {"plant": "Unknown", "condition": raw_name.replace("_", " ")}

def extract_primary_leaf(image: Image.Image) -> tuple[Image.Image, str]:
    """
    Strips background, finds the largest leaf using OpenCV contours,
    crops to it, and pastes it on a black background.
    Returns: (cleaned_image, base64_thumbnail)
    """
    # 1. Remove background with rembg
    no_bg = remove(image)
    
    # 2. Convert to numpy to find contours on the alpha channel
    np_img = np.array(no_bg)
    alpha = np_img[:, :, 3]

    # Find contours
    contours, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        # Fallback if rembg removes everything
        return image, ""

    # Find the largest contour (primary leaf)
    largest_contour = max(contours, key=cv2.contourArea)
    
    # 3. Create a mask for ONLY the largest contour
    primary_mask = np.zeros_like(alpha)
    cv2.drawContours(primary_mask, [largest_contour], -1, 255, thickness=cv2.FILLED)
    
    # Apply primary mask to the RGBA image
    np_img[:, :, 3] = cv2.bitwise_and(alpha, primary_mask)
    isolated = Image.fromarray(np_img)

    # 4. Crop to the exact bounding box of the largest contour
    x, y, w, h = cv2.boundingRect(largest_contour)
    cropped_isolated = isolated.crop((x, y, x + w, y + h))

    # 5. Paste onto a pure black background
    final_img = Image.new("RGB", cropped_isolated.size, (0, 0, 0))
    final_img.paste(cropped_isolated, mask=cropped_isolated.split()[3])

    # Generate a thumbnail base64 representation to send to the frontend
    thumb = final_img.copy()
    thumb.thumbnail((150, 150)) # resize for bandwidth efficiency
    buffered = io.BytesIO()
    thumb.save(buffered, format="JPEG", quality=85)
    b64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return final_img, f"data:image/jpeg;base64,{b64_str}"

def run_inference(model, image_tensor):
    """Returns (predicted_index, confidence_float, probabilities_tensor)."""
    with torch.no_grad():
        outputs = model(image_tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)[0]
        conf, idx = torch.max(probs, 0)
    return idx.item(), conf.item(), probs


# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/predict")
async def predict_image(
    file: UploadFile = File(...),
    plant: str = Form(...)          # e.g. "tomato"
):
    """
    Two-stage prediction:
      1. Global model checks whether the image looks like a plant leaf at all.
      2. Per-plant model identifies the specific disease for the declared plant.
    """
    plant_key = plant.strip().lower()

    # Validate plant name
    if plant_key not in SUPPORTED_PLANTS:
        return {
            "status": "unsupported_plant",
            "message": f"'{plant}' is not a supported plant. Supported plants: {SUPPORTED_PLANTS}"
        }

    # Read & decode image
    contents = await file.read()
    try:
        # Use OpenCV for robust decoding (supports WEBP, AVIF out of the box)
        nparr = np.frombuffer(contents, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_cv is not None:
            img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(img_rgb)
        else:
            # Fallback to Pillow
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            
        processed_img, processed_b64 = extract_primary_leaf(image)
    except Exception as e:
        return {"status": "error", "message": f"Image processing failed: {str(e)}"}

    img_tensor = transform(processed_img).unsqueeze(0).to(device)

    # ── LAYER 1: Is this a plant leaf? ────────────────────────────────────────
    if global_model is None:
        return {"status": "error", "message": "Global validation model not available."}

    _, global_conf, _ = run_inference(global_model, img_tensor)

    if global_conf < PLANT_CONFIDENCE_THRESHOLD:
        return {
            "status": "not_a_plant",
            "message": "The uploaded image does not appear to be a plant leaf. Please upload a clear photo of a leaf.",
            "confidence": round(global_conf * 100, 2),
            "processed_image_b64": processed_b64
        }

    # ── LAYER 2: Is this the right plant? ────────────────────────────────────
    plant_model, label_map = get_plant_model(plant_key)

    if plant_model is None:
        return {
            "status": "model_not_found",
            "message": f"No trained model found for '{plant}'. Please ensure the model files are installed."
        }

    pred_idx, plant_conf, probs = run_inference(plant_model, img_tensor)

    # Check if the model itself predicted "Other_Plant"
    raw_class  = label_map[str(pred_idx)]
    if "Other_Plant" in raw_class or raw_class.lower() == "other_plant":
        return {
            "status": "wrong_plant",
            "message": f"The leaf does not look like a {plant.capitalize()} leaf. The model recognised it as another plant type.",
            "confidence": round(plant_conf * 100, 2),
            "selected_plant": plant.capitalize(),
            "processed_image_b64": processed_b64
        }

    if plant_conf < PLANT_MATCH_THRESHOLD:
        return {
            "status": "wrong_plant",
            "message": f"The image does not look like a {plant.capitalize()} leaf. Please check that you selected the correct plant.",
            "confidence": round(plant_conf * 100, 2),
            "selected_plant": plant.capitalize(),
            "processed_image_b64": processed_b64
        }

    # ── SUCCESS ───────────────────────────────────────────────────────────────
    # Override low-confidence disease predictions to "healthy" (75% threshold)
    if "healthy" not in raw_class.lower() and "other_plant" not in raw_class.lower() and plant_conf < 0.75:
        for idx_str, class_name in label_map.items():
            if "healthy" in class_name.lower():
                raw_class = class_name
                # We also recalculate the confidence so it isn't confusingly low for healthy
                plant_conf = 0.75 
                break

    clean      = clean_class_name(raw_class)
    treatments = treatments_db.get(raw_class, None)

    # Top-3 predictions for extra context
    top3_vals, top3_idxs = torch.topk(probs, min(3, len(label_map)))
    top3 = [
        {
            "class": clean_class_name(label_map[str(i.item())])["condition"],
            "confidence": round(v.item() * 100, 2)
        }
        for v, i in zip(top3_vals, top3_idxs)
    ]

    return {
        "status": "success",
        "plant":      clean["plant"],
        "condition":  clean["condition"],
        "confidence": round(plant_conf * 100, 2),
        "raw_class":  raw_class,
        "treatments": treatments,
        "top3":       top3,
        "processed_image_b64": processed_b64
    }


@app.get("/diseases")
async def get_diseases():
    """Returns a list of all supported diseases and their treatment information."""
    diseases = []
    for raw_class in GLOBAL_CLASS_NAMES:
        clean = clean_class_name(raw_class)
        diseases.append({
            "plant":      clean["plant"],
            "condition":  clean["condition"],
            "raw_class":  raw_class,
            "treatments": treatments_db.get(raw_class, None)
        })
    return {"status": "success", "data": diseases}


@app.get("/plants")
async def get_supported_plants():
    """Returns the list of plants that have dedicated per-plant models."""
    return {"status": "success", "plants": SUPPORTED_PLANTS}


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "global_model_loaded": global_model is not None,
        "device": str(device),
        "supported_plants": SUPPORTED_PLANTS
    }

# ── PlantNet Mapping DB ───────────────────────────────────────────────────────
PLANTNET_SPECIES_MAP = {
    "malus domestica": "apple",
    "prunus avium": "cherry",
    "prunus cerasus": "cherry",
    "zea mays": "corn",
    "vitis vinifera": "grape",
    "prunus persica": "peach",
    "capsicum annuum": "pepper",
    "solanum tuberosum": "potato",
    "fragaria": "strawberry",
    "solanum lycopersicum": "tomato"
}

@app.post("/identify")
async def identify_plant(file: UploadFile = File(...)):
    """
    Identifies the plant using the Pl@ntNet API and checks if it matches one of our
    supported models.
    """
    api_key = os.getenv("PLANTNET_API_KEY")
    if not api_key:
        return {"status": "error", "message": "PLANTNET_API_KEY is not configured in the backend (.env file)."}

    contents = await file.read()
    plantnet_url = f"https://my-api.plantnet.org/v2/identify/all?api-key={api_key}"
    
    async with httpx.AsyncClient() as client:
        try:
            files = {'images': (file.filename, contents, file.content_type or 'image/jpeg')}
            data = {'organs': ['leaf']}
            resp = await client.post(plantnet_url, files=files, data=data, timeout=15.0)
            
            if resp.status_code != 200:
                if resp.status_code == 404:
                    return {"status": "error", "message": "Pl@ntNet could not identify any plant in this image."}
                return {"status": "error", "message": f"Pl@ntNet API returned status {resp.status_code}"}
                
            result = resp.json()
        except Exception as exc:
            return {"status": "error", "message": f"Failed to reach Pl@ntNet API: {str(exc)}"}

    if not result.get("results"):
        return {"status": "error", "message": "No plant species could be identified."}

    top_match = result["results"][0]
    scientific_name = top_match.get("species", {}).get("scientificNameWithoutAuthor", "").lower()
    common_names = top_match.get("species", {}).get("commonNames", [])
    score = top_match.get("score", 0.0)

    identified_standard = None
    
    # 1. Exact map
    if scientific_name in PLANTNET_SPECIES_MAP:
        identified_standard = PLANTNET_SPECIES_MAP[scientific_name]
    else:
        # 2. Substring map
        for key in PLANTNET_SPECIES_MAP:
            if key in scientific_name:
                identified_standard = PLANTNET_SPECIES_MAP[key]
                break
        
        # 3. Common names fallback
        if not identified_standard:
            for c_name in common_names:
                c_lower = c_name.lower()
                for supported in SUPPORTED_PLANTS:
                    # e.g. "corn (maize)" maps to "corn"
                    if supported in c_lower or (supported == 'corn' and 'maize' in c_lower):
                        identified_standard = supported
                        break
                if identified_standard:
                    break

    return {
        "status": "success",
        "identified_plant": identified_standard,
        "plantnet_result": {
            "scientific_name": top_match.get("species", {}).get("scientificNameWithoutAuthor", "Unknown"),
            "common_names": common_names,
            "score": score
        }
    }
