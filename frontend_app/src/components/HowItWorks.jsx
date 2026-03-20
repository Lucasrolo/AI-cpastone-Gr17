import React from 'react';
import { BrainCircuit, Sprout, Network } from 'lucide-react';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <section className="how-it-works-container glass-panel">
      <div className="header-section">
        <h2>How does the AI work?</h2>
        <p>Understanding the technology behind your plant diagnoses</p>
      </div>
      
      <div className="features-grid">
        <div className="feature-card">
          <div className="icon-wrapper">
            <Sprout size={32} />
          </div>
          <h3>1. Image Capture</h3>
          <p>You upload a photo of a leaf, ideally showing clear signs of potential diseases or the overall healthy structure.</p>
        </div>
        
        <div className="feature-card">
          <div className="icon-wrapper">
            <Network size={32} />
          </div>
          <h3>2. Deep Learning</h3>
          <p>Our ResNet-18 neural network, trained on the extensive PlantVillage dataset, processes the image by scanning its visual features.</p>
        </div>
        
        <div className="feature-card">
          <div className="icon-wrapper">
            <BrainCircuit size={32} />
          </div>
          <h3>3. Classification</h3>
          <p>The AI compares thousands of complex patterns to classify the leaf into one of 38 categories across 14 crops, providing a confidence metric.</p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
