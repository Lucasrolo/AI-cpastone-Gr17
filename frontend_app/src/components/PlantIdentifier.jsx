import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Search, Leaf, CheckCircle, XCircle } from 'lucide-react';
import { identifyPlantType } from '../api';
import './PlantIdentifier.css';

const PlantIdentifier = () => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    // Call API
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await identifyPlantType(file);

      if (data.status === 'success') {
        setResult(data);
      } else {
        setError(data.message || 'Could not identify the plant.');
      }
    } catch (err) {
      setError('Failed to connect to the identification API. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const sciName = result?.plantnet_result?.scientific_name || 'Unknown';
  const commonNames = result?.plantnet_result?.common_names || [];
  const score = result?.plantnet_result?.score || 0;
  const isSupported = result?.identified_plant != null;

  return (
    <section className="plant-identifier-section" id="plant-identifier">
      <div className="plant-identifier-header">
        <Search size={28} />
        <h2>Plant Identifier</h2>
        <p className="plant-identifier-subtitle">
          Not sure what plant you have? Upload a photo of a leaf and we'll identify it for you.
        </p>
      </div>

      <div className="plant-identifier-body">
        {/* Upload Area */}
        {!previewUrl ? (
          <div className="identifier-upload-area">
            <Leaf size={60} className="identifier-upload-icon" />
            <h3>Upload a leaf photo</h3>
            <p>Take a picture or browse your files</p>

            <div className="identifier-upload-actions">
              <button className="btn-primary" onClick={() => cameraInputRef.current.click()}>
                <Camera size={18} />
                <span>Take a Picture</span>
              </button>
              <button className="btn-secondary" onClick={() => fileInputRef.current.click()}>
                <ImageIcon size={18} />
                <span>Browse Files</span>
              </button>
            </div>

            <input
              type="file" accept="image/*" capture="camera"
              ref={cameraInputRef} style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <input
              type="file" accept="image/*"
              ref={fileInputRef} style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="identifier-preview-area">
            <div className="identifier-preview-wrapper">
              <img src={previewUrl} alt="Plant preview" className="identifier-preview-img" />
              {isLoading && (
                <div className="identifier-loading-overlay">
                  <div className="identifier-spinner"></div>
                  <p>Identifying plant with Pl@ntNet...</p>
                </div>
              )}
            </div>

            {/* Result Card */}
            {result && !isLoading && (
              <div className={`identifier-result-card ${isSupported ? 'supported' : 'unsupported'}`}>
                {isSupported ? (
                  <CheckCircle size={28} className="result-icon success" />
                ) : (
                  <XCircle size={28} className="result-icon warning" />
                )}

                <div className="result-text">
                  <h4>
                    {isSupported
                      ? `Your plant seems to be: ${result.identified_plant.charAt(0).toUpperCase() + result.identified_plant.slice(1)}`
                      : 'Plant identified, but not supported by our models'}
                  </h4>
                  <p className="result-scientific">
                    <em>{sciName}</em>
                    {commonNames.length > 0 && (
                      <span> — {commonNames.slice(0, 3).join(', ')}</span>
                    )}
                  </p>
                  <p className="result-confidence">
                    Confidence: <strong>{Math.round(score * 100)}%</strong>
                  </p>

                  {isSupported && (
                    <p className="result-tip">
                      👆 Now go back up and select <strong>{result.identified_plant.charAt(0).toUpperCase() + result.identified_plant.slice(1)}</strong> in the plant dropdown to scan for diseases!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="identifier-error">
                <XCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {!isLoading && (
              <button className="btn-text identifier-reset-btn" onClick={reset}>
                Try another image
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PlantIdentifier;
