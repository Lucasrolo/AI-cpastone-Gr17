from fastapi import FastAPI, File, UploadFile
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import os

app = FastAPI(title="Plant Disease API", description="API to predict plant diseases using the trained ResNet18 model")

# Detect hardware acceleration
device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

CLASS_NAMES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy', 
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy', 
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_', 
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot', 
    'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy', 
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy', 
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight', 
    'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy', 
    'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy', 'Tomato___Bacterial_spot', 
    'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 
    'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot', 
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
]

def clean_class_name(raw_name):
    if "___" in raw_name:
        plant, condition = raw_name.split("___", 1)
        return {"plant": plant.replace("_", " "), "condition": condition.replace("_", " ")}
    return {"plant": "Unknown", "condition": raw_name.replace("_", " ")}

# Initialize model architecture to match training script
model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 38)

# Locate the saved model weights relative to the script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "best_plant_disease_model.pth")

try:
    # Use map_location to ensure it loads perfectly on Mac CPU/MPS regardless of where it was trained
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    print(f"✅ Successfully loaded model from {MODEL_PATH}")
except Exception as e:
    print(f"⚠️ Warning: Could not load model from {MODEL_PATH}. Please ensure your model is saved! Error: {e}")

model.to(device)
model.eval()

# Must perfectly match the validation transformations used in training!
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Threshold for "unknown" classification
CONFIDENCE_THRESHOLD = 0.65  # Require at least 65% certainty

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        return {"error": "Invalid image file provided."}

    # Add batch dimension and send to device
    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)

    conf_val = confidence.item()
    idx = predicted_idx.item()

    if conf_val < CONFIDENCE_THRESHOLD:
        return {
            "status": "unknown", 
            "message": "Confidence is too low to predict this image.",
            "confidence": round(conf_val * 100, 2)
        }

    raw_class = CLASS_NAMES[idx]
    clean = clean_class_name(raw_class)

    return {
        "status": "success",
        "plant": clean["plant"],
        "condition": clean["condition"],
        "confidence": round(conf_val * 100, 2),
        "raw_class": raw_class
    }
