import React from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import './PredictionResult.css';

const PredictionResult = ({ result }) => {
  if (!result) return null;

  const { status, plant, condition, confidence, message, treatments } = result;
  const isHealthy = condition?.toLowerCase() === 'healthy';
  const isUnknown = status === 'unknown';

  return (
    <div className="result-container animate-fade-in glass-panel">
      <h2 className="result-title">Analysis Complete</h2>
      
      {isUnknown ? (
        <div className="result-card unknown">
          <Info size={40} className="status-icon" />
          <div className="result-details">
            <h3>Uncertain Result</h3>
            <p>{message}</p>
            <div className="confidence-bar-container">
              <div className="confidence-level">
                <span>Confidence:</span>
                <span>{confidence}%</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill low" style={{ width: `${confidence}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`result-card ${isHealthy ? 'healthy' : 'diseased'}`}>
          {isHealthy ? (
            <CheckCircle size={48} className="status-icon success" />
          ) : (
            <AlertTriangle size={48} className="status-icon warning" />
          )}
          
          <div className="result-details">
            <h3>{plant}</h3>
            <div className="condition-badge">
              {condition}
            </div>
            
            <div className="confidence-section">
              <div className="confidence-level">
                <span>AI Confidence:</span>
                <strong>{confidence}%</strong>
              </div>
              <div className="progress-bg">
                <div 
                  className={`progress-fill ${confidence > 85 ? 'high' : confidence > 65 ? 'medium' : 'low'}`} 
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isUnknown && treatments && (
        <div className="treatment-advice">
          <h4><Info size={16} /> Treatment & Prevention</h4>
          {isHealthy ? (
            <div className="healthy-message">
              <p>{treatments.preventative}</p>
            </div>
          ) : (
            <div className="treatment-details">
              <p className="treatment-intro">
                Consider isolating this plant to prevent spread. Here are the recommended measures for <strong>{condition}</strong>:
              </p>
              {treatments.organic && treatments.organic !== "None" && treatments.organic !== "None." && (
                <div className="treatment-item organic">
                  <strong>Organic Treatment:</strong>
                  <p>{treatments.organic}</p>
                </div>
              )}
              {treatments.chemical && treatments.chemical !== "None" && treatments.chemical !== "None." && (
                <div className="treatment-item chemical">
                  <strong>Chemical Treatment:</strong>
                  <p>{treatments.chemical}</p>
                </div>
              )}
              {treatments.preventative && treatments.preventative !== "None" && treatments.preventative !== "None." && (
                <div className="treatment-item preventative">
                  <strong>Preventative Measures:</strong>
                  <p>{treatments.preventative}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!isUnknown && !treatments && !isHealthy && (
        <div className="treatment-advice">
          <h4><Info size={16} /> What to do next?</h4>
          <p>
            Consider isolating this plant to prevent spread. We recommend consulting local agricultural guidelines or a specialist for specific treatment regarding <strong>{condition}</strong> on <strong>{plant}</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictionResult;
