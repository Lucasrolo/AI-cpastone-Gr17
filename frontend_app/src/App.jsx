import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import PredictionResult from './components/PredictionResult';
import HowItWorks from './components/HowItWorks';
import Header from './components/Header';
import RecentScans from './components/RecentScans';
import DiseaseDictionary from './components/DiseaseDictionary';
import { predictDisease } from './api';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDictionary, setShowDictionary] = useState(false);
  const [recentScans, setRecentScans] = useState(() => {
    const saved = localStorage.getItem('plantHealth_scans');
    return saved ? JSON.parse(saved) : [];
  });

  const handleImageSelect = async (file) => {
    if (!file) {
      setPrediction(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Small artificial delay to show off the scanning animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const result = await predictDisease(file);
      
      if (result.error) {
        setError(result.error);
      } else {
        setPrediction(result);
        const newScan = {
          ...result,
          timestamp: new Date().toISOString()
        };
        setRecentScans(prev => {
          const updated = [newScan, ...prev];
          localStorage.setItem('plantHealth_scans', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
       setError("Failed to connect to the prediction API. Ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <button 
            onClick={() => setShowDictionary(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 2rem', borderRadius: '9999px',
              fontWeight: '700', fontSize: '1.1rem',
              background: 'white', color: 'var(--primary)',
              border: '2px solid var(--primary)',
              cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(46,125,50,0.15)' }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)' }}
          >
            <BookOpen size={22} />
            <span>Open Disease Library</span>
          </button>
        </div>

        <section className="upload-section">
          {error && <div className="error-message">{error}</div>}
          <ImageUploader onImageSelect={handleImageSelect} isLoading={isLoading} />
        </section>
        
        {prediction && (
          <section className="result-section animate-fade-in">
            <PredictionResult result={prediction} />
          </section>
        )}
        
        <RecentScans scans={recentScans} onClear={() => {
           setRecentScans([]);
           localStorage.removeItem('plantHealth_scans');
        }} />
        
        <HowItWorks />
      </main>

      <footer className="app-footer">
        <p>Built for healthy plants worldwide • AI Capstone Project</p>
      </footer>

      {showDictionary && <DiseaseDictionary onClose={() => setShowDictionary(false)} />}
    </div>
  );
}

export default App;
