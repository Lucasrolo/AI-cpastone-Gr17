# AI-cpastone-Gr17

# 🍃 Plant Leaf Disease Identifier

## 📌 Overview
Plant Leaf Disease Identifier is an AI-powered application designed to help users diagnose the health of their plants. By simply taking a picture of a single leaf, the system uses a machine learning model to detect whether the leaf is healthy or suffering from a specific disease. 

To maintain high accuracy and reliability, the model is trained on a specific set of identifiable plant diseases. If an uploaded image does not resemble a leaf or falls outside the scope of the trained diseases, the system will safely return an **"Unknown"** classification.

## ✨ Features
* **Single Leaf Analysis:** Upload an image of a single plant leaf for instant analysis.
* **Disease Detection:** Identifies several common plant diseases (e.g., Bacterial Spot, Late Blight, Apple Scab) or confirms if the leaf is healthy.
* **Out-of-Distribution Detection:** Automatically returns "Unknown" if the image is unrecognized, preventing false confidence in predictions.
* **User-friendly Interface:** Simple upload-and-scan workflow.

## 🗄️ Dataset
This project is built using the renowned **PlantVillage dataset**, hosted on Hugging Face (`mohanty/plant_village`).
* The dataset contains thousands of categorized images of healthy and diseased leaves.
* We utilize the Hugging Face `datasets` library to load, split, and preprocess the images efficiently for training.

## 🛠️ Tech Stack (Example)
* **Machine Learning / AI:** Python, PyTorch / TensorFlow, Hugging Face `transformers` (Vision Transformer or CNN architectures like ResNet).
* **Data Processing:** `Pillow` (PIL), `torchvision`, `numpy`.
* **Backend / API:** FastAPI (to serve the AI model).
* **Frontend:** Streamlit or a lightweight React app for user interactions.

## 🚀 Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Lucasrolo/AI-cpastone-Gr17.git](https://github.com/Lucasrolo/AI-cpastone-Gr17.git)
   cd leaf-disease-identifier
