import React from 'react';
import { CheckCircle, AlertTriangle, Info, Ban, Leaf } from 'lucide-react';
import './PredictionResult.css';

const PredictionResult = ({ result }) => {
  if (!result) return null;

  const { status, plant, condition, confidence, message, treatments, selected_plant, top3, processed_image_b64 } = result;
  const isHealthy  = condition?.toLowerCase() === 'healthy';
  const isUnknown  = status === 'unknown';
  const isNotPlant = status === 'not_a_plant';
  const isWrongPlant = status === 'wrong_plant';

  // ── Out-of-scope: not a plant at all ────────────────────────────────────────
  if (isNotPlant) {
    return (
      <div className="result-container animate-fade-in glass-panel">
        <h2 className="result-title">Analysis Result</h2>
        <div className="result-card out-of-scope">
          <Ban size={52} className="status-icon oos-icon" />
          <div className="result-details">
            <h3>Image Not Recognised</h3>
            <p className="oos-description">
              The uploaded image does not appear to be a plant leaf. Please upload a clear, close-up photo of a leaf.
            </p>
            {confidence !== undefined && (
              <div className="confidence-section">
                <div className="confidence-level">
                  <span>Detection Confidence:</span>
                  <strong>{confidence}%</strong>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill low" style={{ width: `${confidence}%` }}></div>
                </div>
              </div>
            )}
            <div className="oos-tips">
              <strong>Tips for a good photo:</strong>
              <ul>
                <li>Fill the frame with a single leaf</li>
                <li>Use natural light, avoid heavy shadows</li>
                <li>Make sure the leaf is in focus</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Out-of-scope: wrong plant type ──────────────────────────────────────────
  if (isWrongPlant) {
    return (
      <div className="result-container animate-fade-in glass-panel">
        <h2 className="result-title">Analysis Result</h2>
        <div className="result-card wrong-plant">
          <Leaf size={52} className="status-icon wrong-icon" />
          <div className="result-details">
            <h3>Wrong Plant Type</h3>
            <p className="oos-description">
              This leaf does not match a <strong>{selected_plant || plant}</strong> leaf.
              Please check that you selected the correct plant, or try a different photo.
            </p>
            {confidence !== undefined && (
              <div className="confidence-section">
                <div className="confidence-level">
                  <span>Plant Match Confidence:</span>
                  <strong>{confidence}%</strong>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill low" style={{ width: `${confidence}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Low-confidence unknown ───────────────────────────────────────────────────
  if (isUnknown) {
    return (
      <div className="result-container animate-fade-in glass-panel">
        <h2 className="result-title">Analysis Complete</h2>
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
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  return (
    <div className="result-container animate-fade-in glass-panel">
      <h2 className="result-title">Analysis Complete</h2>

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

          {/* Top-3 predictions */}
          {top3 && top3.length > 1 && (
            <div className="top3-section">
              <p className="top3-label">Other possibilities:</p>
              {top3.slice(1).map((item, i) => (
                <div key={i} className="top3-item">
                  <span className="top3-class">{item.class}</span>
                  <span className="top3-conf">{item.confidence}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {processed_image_b64 && (
        <div className="processed-image-container glass-panel">
          <h4><Info size={16} /> What the AI Analysed</h4>
          <div className="processed-content">
            <img src={processed_image_b64} alt="Pre-processed leaf" className="processed-image" />
            <p className="processed-text">
              Background and noise were automatically removed to isolate the primary leaf for maximum accuracy.
            </p>
          </div>
        </div>
      )}

      {!isUnknown && treatments && (
        <div className="treatment-advice">
          <h4><Info size={16} /> Treatment &amp; Prevention</h4>
          {isHealthy ? (
            <div className="healthy-message">
              <p>{treatments.preventative}</p>
            </div>
          ) : (
            <div className="treatment-details">
              <p className="treatment-intro">
                Consider isolating this plant to prevent spread. Here are the recommended measures for <strong>{condition}</strong>:
              </p>
              <div style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', borderLeft: '4px solid var(--warning)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                💡 <strong>Tip:</strong> For more accuracy, analyse other pictures of the plant from different angles.
              </div>
              {treatments.organic && treatments.organic !== 'None' && treatments.organic !== 'None.' && (
                <div className="treatment-item organic">
                  <strong>Organic Treatment:</strong>
                  <p>{treatments.organic}</p>
                </div>
              )}
              {treatments.chemical && treatments.chemical !== 'None' && treatments.chemical !== 'None.' && (
                <div className="treatment-item chemical">
                  <strong>Chemical Treatment:</strong>
                  <p>{treatments.chemical}</p>
                  {treatments.chemical_links && treatments.chemical_links.length > 0 && (
                    <div className="amazon-links-container">
                      {treatments.chemical_links.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="amazon-link-button"
                        >
                          🛒 Buy Product {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {treatments.preventative && treatments.preventative !== 'None' && treatments.preventative !== 'None.' && (
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
            Consider isolating this plant to prevent spread. We recommend consulting local agricultural guidelines
            or a specialist for specific treatment regarding <strong>{condition}</strong> on <strong>{plant}</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictionResult;
