### 📊 Project ML Summary

**Core Frameworks**
*   **Language**: Python 3.12+
*   **Deep Learning**: **PyTorch** & **Torchvision**
*   **Computer Vision**: OpenCV & PIL (Pillow)
*   **Pre-processing**: **rembg** (U2-Net) for automatic background removal.

**Model Architecture**
*   **Base Model**: **ResNet-18** (Residual Networks)
*   **Technique**: **Transfer Learning** (Pre-trained on ImageNet, fine-tuned on PlantVillage).
*   **Optimization**: Custom **Dropout layers** (0.3) added to prevent overfitting.

**The "Two-Layer" Strategy**
1.  **Layer 1 (The Global Guard)**: Validates if the image is a leaf and identifies the plant type.
2.  **Layer 2 (The Specialist)**: 9 specialized models for high-precision disease diagnosis.

**Hardware Performance**
*   **Acceleration**: Runs on **MPS (Metal)** for Mac or **CUDA** for NVIDIA, ensuring <100ms analysis times.
