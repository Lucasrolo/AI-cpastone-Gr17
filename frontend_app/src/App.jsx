import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import PredictionResult from './components/PredictionResult';
import HowItWorks from './components/HowItWorks';
import Header from './components/Header';
import { predictDisease } from './api';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
        <section className="upload-section">
          {error && <div className="error-message">{error}</div>}
          <ImageUploader onImageSelect={handleImageSelect} isLoading={isLoading} />
        </section>
        
        {prediction && (
          <section className="result-section animate-fade-in">
            <PredictionResult result={prediction} />
          </section>
        )}
        
        <HowItWorks />
      </main>

      <footer className="app-footer">
        <p>Built for healthy plants worldwide • AI Capstone Project</p>
      </footer>
    </div>
  );
}

export default App;
