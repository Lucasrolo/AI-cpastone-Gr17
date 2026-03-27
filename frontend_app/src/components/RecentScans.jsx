import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import './RecentScans.css';

const RecentScans = ({ scans, onClear }) => {
  if (!scans || scans.length === 0) return null;

  return (
    <div className="recent-scans-container glass-panel animate-fade-in">
      <div className="recent-scans-header">
        <div className="header-title">
          <Clock size={20} className="history-icon" />
          <h3>Recent Diagnostics</h3>
        </div>
        <button className="btn-text-sm" onClick={onClear}>Clear History</button>
      </div>
      
      <div className="scans-list">
        {scans.slice(0, 5).map((scan, index) => (
          <div key={index} className="scan-card">
            <div className="scan-icon">
              {scan.status === 'success' ? (
                <CheckCircle size={24} className="success-icon" />
              ) : (
                <AlertCircle size={24} className="warning-icon" />
              )}
            </div>
            <div className="scan-details">
              {scan.status === 'success' ? (
                <>
                  <h4 className="scan-plant">{scan.plant}</h4>
                  <p className="scan-condition">
                    {scan.condition.includes('healthy') ? 'Healthy' : scan.condition.replace(/_/g, ' ')}
                  </p>
                </>
              ) : (
                <>
                  <h4 className="scan-plant">Unknown Plant</h4>
                  <p className="scan-condition">Uncertain Diagnosis</p>
                </>
              )}
            </div>
            {scan.status === 'success' && (
              <div className="scan-confidence">
                <span className="conf-value">{scan.confidence}%</span>
                <span className="conf-label">Match</span>
              </div>
            )}
            <div className="scan-time">
              {new Date(scan.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentScans;
