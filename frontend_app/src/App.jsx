import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import PredictionResult from './components/PredictionResult';
import HowItWorks from './components/HowItWorks';
import Header from './components/Header';
import RecentScans from './components/RecentScans';
import DiseaseDictionary from './components/DiseaseDictionary';
import PlantIdentifier from './components/PlantIdentifier';
import { predictDisease } from './api';

function App() {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDictionary, setShowDictionary] = useState(false);
  const [recentScans, setRecentScans] = useState(() => {
    const saved = localStorage.getItem('plantHealth_scans');
    return saved ? JSON.parse(saved) : [];
  });

  const handlePlantSelect = (plant) => {
    setSelectedPlant(plant);
    // Reset results whenever the plant changes
    setPrediction(null);
    setError(null);
  };

  const handleImageSelect = async (file) => {
    if (!file) {
      setPrediction(null);
      setError(null);
      return;
    }

    if (!selectedPlant) {
      setError('Please select a plant type before uploading an image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Small artificial delay to show off the scanning animation
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = await predictDisease(file, selectedPlant);

      // Out-of-scope cases: show as prominent result cards (not invisible error text)
      if (result.status === 'not_a_plant' || result.status === 'wrong_plant') {
        setPrediction(result);
      } else if (result.status === 'model_not_found') {
        setError(`⚠️ ${result.message}`);
      } else if (result.status === 'error' || result.error) {
        setError(result.message || result.error);
      } else if (result.status === 'success') {
        setPrediction(result);
        const newScan = {
          ...result,
          selectedPlant,
          timestamp: new Date().toISOString()
        };
        setRecentScans(prev => {
          const updated = [newScan, ...prev].slice(0, 20);
          localStorage.setItem('plantHealth_scans', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      setError('Failed to connect to the prediction API. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDictionary(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
              fontWeight: '600', fontSize: '1rem',
              background: 'white', color: 'var(--primary)',
              border: '2px solid var(--primary)',
              cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <BookOpen size={20} />
            <span>Open Disease Library</span>
          </button>

          <a
            href="#plant-identifier"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
              fontWeight: '600', fontSize: '1rem',
              background: 'var(--primary)', color: 'white',
              border: '2px solid var(--primary)', textDecoration: 'none',
              cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span>Don't know the type of plant you have? <strong>Click Here</strong></span>
          </a>
        </div>

        <section className="upload-section">
          {error && <div className="error-message">{error}</div>}
          <ImageUploader
            onImageSelect={handleImageSelect}
            onPlantSelect={handlePlantSelect}
            selectedPlant={selectedPlant}
            isLoading={isLoading}
          />
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

        <PlantIdentifier />
      </main>

      <footer className="app-footer">
        <p>Built for healthy plants worldwide • AI Capstone Project</p>
      </footer>

      {showDictionary && <DiseaseDictionary onClose={() => setShowDictionary(false)} />}
    </div>
  );
}

export default App;
