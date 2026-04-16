import React, { useRef, useState } from 'react';
import { Camera, UploadCloud, Image as ImageIcon, Leaf, ChevronDown } from 'lucide-react';
import CameraModal from './CameraModal';
import './ImageUploader.css';

// Plants supported by per-plant models — must match API SUPPORTED_PLANTS list
const PLANT_OPTIONS = [
  { key: 'apple',      label: '🍎 Apple' },
  { key: 'cherry',     label: '🍒 Cherry' },
  { key: 'corn',       label: '🌽 Corn (Maize)' },
  { key: 'grape',      label: '🍇 Grape' },
  { key: 'peach',      label: '🍑 Peach' },
  { key: 'pepper',     label: '🫑 Pepper (Bell)' },
  { key: 'potato',     label: '🥔 Potato' },
  { key: 'strawberry', label: '🍓 Strawberry' },
  { key: 'tomato',     label: '🍅 Tomato' },
];

const ImageUploader = ({ onImageSelect, onPlantSelect, selectedPlant, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const fileInputRef = useRef(null);


  const handlePlantChange = (e) => {
    const plant = e.target.value;
    // Reset image when plant changes
    setPreviewUrl(null);
    onImageSelect(null);
    onPlantSelect(plant || null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
    onImageSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const resetImage = () => {
    setPreviewUrl(null);
    onImageSelect(null);
  };

  const selectedPlantLabel = PLANT_OPTIONS.find(p => p.key === selectedPlant)?.label;

  return (
    <div className="uploader-container animate-fade-in">

      {/* ── Step 1: Plant selector ───────────────────────────────────────── */}
      <div className="plant-selector-wrapper">
        <div className="plant-selector-label">
          <Leaf size={18} />
          <span>Step 1 — Select your plant</span>
        </div>
        <div className="plant-selector-select-wrapper">
          <select
            className={`plant-selector-select ${selectedPlant ? 'selected' : ''}`}
            value={selectedPlant || ''}
            onChange={handlePlantChange}
            disabled={isLoading}
          >
            <option value="">— Choose a plant —</option>
            {PLANT_OPTIONS.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <ChevronDown size={18} className="plant-selector-chevron" />
        </div>
      </div>

      {/* ── Step 2: Upload area (only shown once a plant is selected) ────── */}
      {selectedPlant && (
        <div className="upload-step-wrapper">
          <div className="plant-selector-label">
            <UploadCloud size={18} />
            <span>Step 2 — Upload a <strong>{selectedPlantLabel}</strong> leaf photo</span>
          </div>

          {!previewUrl ? (
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="upload-content">
                <UploadCloud size={80} className="upload-icon" />
                <h3>Upload or capture a leaf</h3>
                <p className="upload-hint" style={{ marginBottom: '0.25rem' }}>Drag and drop, or choose an option below</p>
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  For better results, take a picture of one single leaf.
                </p>

                <div className="upload-actions">
                  <button
                    className="btn-primary"
                    onClick={() => setShowCamera(true)}
                    disabled={isLoading}
                  >
                    <Camera size={20} />
                    <span>Take a Picture</span>
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={() => fileInputRef.current.click()}
                    disabled={isLoading}
                  >
                    <ImageIcon size={20} />
                    <span>Browse Files</span>
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  type="file" accept="image/*"
                  ref={fileInputRef} style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          ) : (
            <div className="preview-area">
              <div className="image-preview-wrapper">
                <img src={previewUrl} alt="Leaf preview" className="image-preview" />
                {isLoading && (
                  <div className="loading-overlay">
                    <div className="scanner"></div>
                    <p>Analyzing leaf...</p>
                  </div>
                )}
              </div>
              {!isLoading && (
                <button className="btn-text reset-btn" onClick={resetImage}>
                  Choose another image
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt shown when no plant is selected yet */}
      {!selectedPlant && (
        <div className="no-plant-hint">
          <Leaf size={40} className="no-plant-icon" />
          <p>Select a plant above to start the analysis</p>
        </div>
      )}

      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(file) => handleFile(file)}
      />
    </div>
  );
};

export default ImageUploader;
