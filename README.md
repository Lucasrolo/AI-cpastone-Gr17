# 🍃 Plant Leaf Disease Identifier (AI-capstone-Gr17)

## 📌 Overview
Plant Leaf Disease Identifier is an AI-powered application designed to help users diagnose the health of their plants. By simply taking a picture of a single leaf, the system uses a machine learning model to detect whether the leaf is healthy or suffering from a specific disease. 

To maintain high accuracy and reliability, the model is trained on a specific set of identifiable plant diseases. If an uploaded image does not resemble a leaf or falls outside the scope of the trained diseases based on a confidence threshold, the system safely returns an **"Unknown"** classification.

## ✨ Features
* **Single Leaf Analysis:** Upload an image of a single plant leaf for instant analysis.
* **Disease Detection:** Identifies 38 common plant conditions across several species (e.g., Apple, Corn, Grape, Tomato, Potato) or confirms if the leaf is healthy.
* **Out-of-Distribution Detection:** Automatically returns "Unknown" if the image is unrecognized (confidence score < 65%), preventing false confidence in predictions.
* **User-friendly Interface:** Simple upload-and-scan workflow built with React and Vite.
* **Fast and Reliable Backend:** Built with FastAPI, securely deploying PyTorch machine learning models.

## 📁 Project Structure

* **`frontend_app/`**: Contains the React + Vite frontend application. It provides the user interface for uploading plant leaf images and viewing the prediction results.
* **`api/`**: Contains the FastAPI backend application. It exposes the `/predict` endpoint which securely processes user uploads and invokes the trained ML model. 
* **`model_training/`**: Contains the Jupyter Notebooks (`plantvillage.ipynb`) and scripts like `update_notebook.py` used to train the PyTorch model, along with the `Saved_model/` directory storing the final output weights (`best_plant_disease_model.pth`).

## 🗄️ Dataset
This project's model is trained using the renowned **PlantVillage dataset**, hosted on Hugging Face (`mohanty/plant_village`).
* The dataset contains thousands of categorized images of healthy and diseased leaves across multiple plant species.
* We utilize the Hugging Face `datasets` library to load, split, and preprocess the images efficiently before training on PyTorch models.

## 🛠️ Tech Stack
* **Machine Learning / AI:** Python, PyTorch (`torch`, `torchvision`). The active model relies on the **ResNet18** architecture with a fully connected layer mapped to 38 output classes.
* **Data Processing:** `Pillow` (PIL) for image handling in API.
* **Backend / API:** FastAPI (`fastapi`, `uvicorn`), `python-multipart` to manage file uploads.
* **Frontend:** React 18, Vite, and `lucide-react` for beautiful iconography.

## 🚀 Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lucasrolo/AI-cpastone-Gr17.git
   cd AI-cpastone-Gr17
   ```

2. **Run the FastAPI Backend:**
   Install backend requirements and run the server. Note that you may want to do this within a localized virtual environment (like the pre-configured `.venv` directory).
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Run the React Frontend:**
   Install Node dependencies and start the Vite development server.
   ```bash
   cd frontend_app
   npm install
   npm run dev
   ```

4. **Start Analyzing:**
   Access the frontend interface via the URL provided by Vite (often `http://localhost:5173`) and upload your first leaf picture!



# Next Step 
- To-do :
    - Add a analisation of the leaves even if it is not some diseese like a leaf with not a lot of water or sun or other things like that. 
    - Add a feature to add new diseases to the model.
    - Add a feature to add new plants to the model.
    - Add a feature to guide the user to take the best picture of their leaf.
    - Add a feature to recommend the products to treat the plant and add the links of some products directly (can be sponsored)   