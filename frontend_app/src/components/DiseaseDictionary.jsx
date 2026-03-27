import React, { useState, useEffect } from 'react';
import { BookOpen, Search, X, Droplets, Shield, Sprout } from 'lucide-react';
import { fetchDiseases } from '../api';
import './DiseaseDictionary.css';

const DiseaseDictionary = ({ onClose }) => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchDiseases();
        if (response.status === 'success') {
          setDiseases(response.data);
        }
      } catch (error) {
        console.error("Failed to load diseases", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredDiseases = diseases.filter(d => 
    d.plant.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dictionary-overlay animate-fade-in">
      <div className="dictionary-modal">
        <div className="dictionary-header">
          <div className="header-title">
            <BookOpen size={24} className="dictionary-icon" />
            <h2>Plant Disease Library</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="dictionary-search">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for a plant or disease..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="dictionary-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading database...</p>
            </div>
          ) : (
            <div className="diseases-grid">
              {filteredDiseases.map((d, index) => (
                <div key={index} className={`disease-card ${d.condition.includes('healthy') ? 'healthy-card' : ''}`}>
                  <div className="card-header">
                    <h4>{d.plant}</h4>
                    <span className="condition-badge">{d.condition.replace(/_/g, ' ')}</span>
                  </div>
                  
                  {d.treatments && Object.values(d.treatments).some(val => val && val.toLowerCase() !== 'n/a') ? (
                    <div className="treatment-list">
                      {d.treatments.organic && d.treatments.organic.toLowerCase() !== 'n/a' && (
                        <div className="treatment-item">
                          <Droplets size={16} className="organic-icon" />
                          <div>
                            <strong>Organic:</strong> {d.treatments.organic}
                          </div>
                        </div>
                      )}
                      {d.treatments.chemical && d.treatments.chemical.toLowerCase() !== 'n/a' && (
                        <div className="treatment-item">
                          <Shield size={16} className="chemical-icon" />
                          <div>
                            <strong>Chemical:</strong> {d.treatments.chemical}
                          </div>
                        </div>
                      )}
                      {d.treatments.preventative && d.treatments.preventative.toLowerCase() !== 'n/a' && (
                        <div className="treatment-item">
                          <Sprout size={16} className="preventative-icon" />
                          <div>
                            <strong>Prevention:</strong> {d.treatments.preventative}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="treatment-empty">
                      <p>No specific treatment data available in database.</p>
                    </div>
                  )}
                </div>
              ))}
              
              {filteredDiseases.length === 0 && (
                <div className="no-results">
                  <p>No diseases found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDictionary;
