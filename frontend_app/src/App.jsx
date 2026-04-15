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
        <div className="top-nav-buttons">
          <button
            id="open-disease-library"
            className="top-nav-btn top-nav-btn--outline"
            onClick={() => setShowDictionary(true)}
          >
            <BookOpen size={20} />
            <span>Open Disease Library</span>
          </button>

          <a
            href="#plant-identifier"
            className="top-nav-btn top-nav-btn--solid"
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
