import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import './CameraModal.css';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  const startCamera = useCallback(async (facing) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsReady(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access your camera. Please check your browser permissions.');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode, startCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        onCapture(file);
        handleClose();
      }
    }, 'image/jpeg', 0.92);
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsReady(false);
    setError(null);
    onClose();
  };

  const toggleFacing = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-backdrop" onClick={handleClose}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>

        <button className="camera-modal-close" onClick={handleClose}>
          <X size={22} />
        </button>

        <div className="camera-viewport">
          {error ? (
            <div className="camera-error">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
              {!isReady && (
                <div className="camera-loading">
                  <p>Starting camera...</p>
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="camera-controls">
          <button className="camera-flip-btn" onClick={toggleFacing} title="Flip camera">
            <RefreshCw size={20} />
          </button>
          <button
            className="camera-shutter-btn"
            onClick={handleCapture}
            disabled={!isReady || !!error}
            title="Take photo"
          >
            <Camera size={28} />
          </button>
          <div style={{ width: 44 }} /> {/* Spacer for centering */}
        </div>

      </div>
    </div>
  );
};

export default CameraModal;
