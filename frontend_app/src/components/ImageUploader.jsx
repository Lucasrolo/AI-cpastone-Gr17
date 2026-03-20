import React, { useRef, useState } from 'react';
import { Camera, UploadCloud, Image as ImageIcon } from 'lucide-react';
import './ImageUploader.css';

const ImageUploader = ({ onImageSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Pass to parent
    onImageSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
  }

  return (
    <div className="uploader-container animate-fade-in">
      {!previewUrl ? (
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <UploadCloud size={48} className="upload-icon" />
            <h3>Upload or capture a leaf</h3>
            <p className="upload-hint">Drag and drop, or choose an option below</p>
            
            <div className="upload-actions">
              <button 
                className="btn-primary" 
                onClick={() => cameraInputRef.current.click()}
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
            
            {/* Hidden inputs */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              style={{display: 'none'}} 
              onChange={handleFileChange} 
            />
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{display: 'none'}} 
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
  );
};

export default ImageUploader;
