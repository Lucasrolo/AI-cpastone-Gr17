import React from 'react';
import { Leaf, ShieldCheck, Zap, Activity } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="hero-header glass-panel animate-fade-in">
      <div className="hero-content">
        <div className="logo-wrapper">
          <div className="logo-cube">
            <Leaf size={48} className="logo-icon-primary" />
          </div>
        </div>
        
        <h1 className="hero-title">
          <span className="gradient-text">Longevity</span>
        </h1>
        
        <p className="hero-subtitle">
          Next-Generation Crop Diagnostic Intelligence
        </p>

        <p className="hero-description">
          Protect your crops with state-of-the-art computer vision. Upload a leaf image to instantly detect early signs of diseases, identify pests, and receive expert treatment plans to ensure a healthy yield.
        </p>

        <div className="features-badges">
          <div className="badge">
            <Zap size={16} />
            <span>Instant Analysis</span>
          </div>
          <div className="badge">
            <ShieldCheck size={16} />
            <span>High Accuracy</span>
          </div>
          <div className="badge">
            <Activity size={16} />
            <span>Actionable Care</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
