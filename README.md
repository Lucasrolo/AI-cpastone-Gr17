# 🍃 LONGEVITY - AI Plant Diagnostic Tool (AI-capstone-Gr17)

## Overview
**LONGEVITY** is an AI-powered agricultural application designed to help users instantly diagnose the health of their plants. By taking a picture of a single leaf, the platform uses a sophisticated machine learning pipeline to isolate the leaf, classify it, and determine whether it is healthy or suffering from a specific disease.

Beyond diagnosis, LONGEVITY provides users with actionable treatments (organic, chemical, and preventative) and direct Amazon affiliate links to purchase the necessary healing remedies.

## Features
* **Two-Layer Inference:** 
  * *Layer 1 (The Gatekeeper):* Validates the image looks like a plant leaf and rejects irrelevant noise.
  * *Layer 2 (The Specialist):* Deeply analyzes the specific plant species using localized models to diagnose diseases accurately.
* **Background Isolation:** Automatically removes background noise using `rembg` and OpenCV masking to ensure the neural network focuses purely on leaf pathology.
* **Treatment Dictionary:** A hand-curated dataset maps specific diseases to organic and chemical solutions.
* **Integrated E-Commerce:** Recommends real products via Amazon Affiliate links to treat the identified plant.
* **Pl@ntNet Fallback:** An `/identify` integration to automatically identify plant species if the user is completely unsure of what they are growing.

## Project Structure

* **`api/`**: The FastAPI backend application. It exposes the `/predict` endpoint, houses the treatment datasets inside `api/data/`, and statically serves the deployed PyTorch `.pth` model parameters from `api/models/`.
* **`frontend_app/`**: A modern React + Vite frontend application. It provides the user interface with Camera capture capabilities, image upload, and rich result rendering.
* **`model_training/`**: Fully decoupled directory containing Jupyter Notebooks (`Final_train_model.ipynb` & `V1_train_model.ipynb`) used exclusively for building and training the PyTorch models. Only the `Final_train_model.ipynb` is currently in use.

## Dataset & Machine Learning
This project's models are trained using the renowned **PlantVillage dataset**, hosted on Hugging Face (`mohanty/plant_village`), representing over 150,000 categorized images across 38 distinct plant/disease combinations.
* To avoid extreme variance issues from a global classifier, we developed a **Specialized Per-Plant Architecture** using **ResNet-18** architectures coupled with dropout layers.

## Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lucasrolo/AI-cpastone-Gr17.git
   cd AI-cpastone-Gr17
   ```

2. **Activate Virtual Environment:**
   Run the following from the root directory to active the python environment.
   ```bash
   source .venv/bin/activate
   ```

3. **Run the FastAPI Backend:**
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Run the React Frontend:**
   Open a new terminal session, install Node dependencies, and start Vite.
   ```bash
   cd frontend_app
   npm install
   npm run dev
   ```

5. **Start Analyzing:**
   Access the frontend interface via `http://localhost:5173` and upload a leaf picture!

## Roadmap / Next Steps
- Add an analysis logic to identify natural abiotic issues (e.g. over-watering, sunburn, lack of nutrients) which aren't necessarily bacterial diseases.
- Scale the backend to allow dynamic database updating for new diseases via an Admin panel.