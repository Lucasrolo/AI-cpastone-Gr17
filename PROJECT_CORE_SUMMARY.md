# 🌿 PlantHealth AI: Technical Core Summary

This document summarizes the backend and machine learning architecture powering the Plant Disease Detection system.

## 1. Machine Learning Architecture
The project uses a **Two-Layer ResNet-18 Convolutional Neural Network (CNN)** architecture to ensure high accuracy and prevent "false positive" diagnoses on non-leaf images.

### Layer 1: The Global Validator
*   **Model**: ResNet-18 (trained on the full PlantVillage dataset).
*   **Purpose**: Acts as a "Gatekeeper." It verifies if the uploaded image is actually a plant leaf from the 38 classes it knows.
*   **Threshold**: Uses a `PLANT_CONFIDENCE_THRESHOLD` (0.30) to reject random objects or non-plant images.

### Layer 2: Specialized Per-Plant Models
*   **Models**: 9 individual ResNet-18 models, each specialized for one plant (Apple, Cherry, Corn, Grape, Peach, Pepper, Potato, Strawberry, Tomato).
*   **Purpose**: Once a plant is identified by the user or Layer 1, the specialized model is lazy-loaded (to save RAM) to perform the final disease diagnosis.
*   **Confidence**: Uses a `PLANT_MATCH_THRESHOLD` (0.55) to ensure the diagnosis is reliable.

## 2. Image Pre-processing
To improve model accuracy in real-world conditions (like messy backgrounds in a garden), the backend implements:
*   **Background Removal**: Uses the `rembg` library (based on U<sup>2</sup>-Net) to strip away the background and focus solely on the leaf structure.
*   **Normalisation**: Standardizes images to 224x224 pixels with mean/std normalization matching ImageNet weights.

## 3. External API Integration
### Pl@ntNet API
*   **Usage**: Powering the "I don't know my plant" feature.
*   **Logic**: 
    1. Uploads the image to Pl@ntNet's global species identification servers.
    2. Receives a scientific name (e.g., *Solanum lycopersicum*).
    3. **Mapping**: The backend contains a normalization layer that maps scientific names back to our supported models (e.g., mapping *Zea mays* to "Corn").

## 4. Hardware & Infrastructure
*   **Server**: FastAPI (Python) running with Gunicorn for production stability.
*   **Acceleration**: 
    *   **MPS (Metal Performance Shaders)**: Utilized for high-speed inference on Apple Silicon (M1/M2/M3 chips).
    *   **CUDA**: Support included for NVIDIA GPUs.
    *   **CPU**: Fallback for standard environments.
*   **Exposure**: Cloudflare Tunnels (via HTTP/2) allow the local server to be securely accessible by mobile devices over the public internet.

## 5. Data Mapping & Knowledge Base
*   **Treatment DB**: A CSV-based mapper that connects model output classes (e.g., "Apple___Black_rot") to specific organic and chemical treatment advice.
*   **Amazon E-commerce Integration**: Dynamic mapping of treatment types to Amazon product search links for immediate user action.
