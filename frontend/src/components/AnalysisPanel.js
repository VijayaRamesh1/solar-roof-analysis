import React, { useState, useEffect } from 'react';
import { X, Sun, Zap, DollarSign, Leaf, TrendingUp, Info, Sparkles } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './AnalysisPanel.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalysisPanel = ({ building, onClose }) => {
  const [buildingData, setBuildingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (building) {
      setLoading(true);
      // If building is already detailed data, use it directly
      if (building.properties) {
        setBuildingData(building.properties);
        setLoading(false);
      } else {
        // Otherwise fetch detailed data
        fetchBuildingDetails(building.id);
      }
    }
  }, [building]);

  const fetchBuildingDetails = async (buildingId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/buildings/${buildingId}`);
      if (response.ok) {
        const data = await response.json();
        setBuildingData(data);
      }
    } catch (error) {
      console.error('Error fetching building details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    if (score >= 20) return 'poor';
    return 'very-poor';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Very Poor';
  };

  const getScoreDescription = (score) => {
    if (score >= 80) return 'Ideal conditions for solar installation';
    if (score >= 60) return 'Good potential with minor considerations';
    if (score >= 40) return 'Moderate potential, some limitations';
    if (score >= 20) return 'Limited potential, significant challenges';
    return 'Very limited potential, not recommended';
  };

  const getMonthlyChartData = () => {
    if (!buildingData?.monthly_production) return null;

    return {
      labels: buildingData.monthly_production.map(item => item.month),
      datasets: [
        {
          label: 'Monthly Production (kWh)',
          data: buildingData.monthly_production.map(item => item.kwh),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#10b981',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: '#64748b'
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: '#64748b'
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: '#10b981'
      }
    }
  };

  if (loading) {
    return (
      <div className="analysis-panel open">
        <div className="panel-header">
          <h2>Loading Analysis...</h2>
          <button onClick={onClose} className="close-button" aria-label="Close panel">
            <X size={20} />
          </button>
        </div>
        <div className="panel-content">
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p>Analyzing solar potential...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!buildingData) {
    return (
      <div className="analysis-panel open">
        <div className="panel-header">
          <h2>Analysis Error</h2>
          <button onClick={onClose} className="close-button" aria-label="Close panel">
            <X size={20} />
          </button>
        </div>
        <div className="panel-content">
          <p>Unable to load building analysis.</p>
        </div>
      </div>
    );
  }

  const scoreClass = getScoreColor(buildingData.solar_score);
  const scoreLabel = getScoreLabel(buildingData.solar_score);
  const scoreDescription = getScoreDescription(buildingData.solar_score);

  return (
    <AnimatePresence>
      <motion.div 
        className="analysis-panel open"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <motion.div 
          className="panel-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="header-content">
            <Sparkles className="header-icon" />
            <h2>Solar Analysis</h2>
          </div>
          <motion.button 
            onClick={onClose} 
            className="close-button" 
            aria-label="Close panel"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
        </motion.div>

        <motion.div 
          className="panel-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
        {/* Address */}
        <motion.div 
          className="address-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>{buildingData.address || 'Building Analysis'}</h3>
          <motion.div 
            className="building-type"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            {buildingData.building_type?.charAt(0).toUpperCase() + buildingData.building_type?.slice(1)}
          </motion.div>
        </motion.div>

        {/* Solar Score */}
        <motion.div 
          className="score-section"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <div className="score-header">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sun className="score-icon" />
            </motion.div>
            <h3>Solar Potential Score</h3>
            <div className="info-tooltip">
              <Info size={16} />
              <span className="tooltip-text">
                Based on roof area, orientation, shading, and local solar conditions
              </span>
            </div>
          </div>
          <motion.div 
            className={`score-display ${scoreClass}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <motion.div 
              className="score-number"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {buildingData.solar_score}
            </motion.div>
            <motion.div 
              className="score-label"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {scoreLabel}
            </motion.div>
          </motion.div>
          <motion.p 
            className="score-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {scoreDescription}
          </motion.p>
        </motion.div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <Zap className="metric-icon" />
            <div className="metric-content">
              <div className="metric-value">{buildingData.annual_kwh?.toLocaleString()}</div>
              <div className="metric-label">Annual kWh</div>
            </div>
          </div>
          <div className="metric-card">
            <DollarSign className="metric-icon" />
            <div className="metric-content">
              <div className="metric-value">{buildingData.payback_years}</div>
              <div className="metric-label">Payback Years</div>
            </div>
          </div>
          <div className="metric-card">
            <Leaf className="metric-icon" />
            <div className="metric-content">
              <div className="metric-value">{buildingData.co2_savings?.toLocaleString()}</div>
              <div className="metric-label">kg CO₂ Saved/Year</div>
            </div>
          </div>
        </div>

        {/* Monthly Production Chart */}
        {buildingData.monthly_production && (
          <div className="chart-section">
            <h3>Monthly Production Forecast</h3>
            <div className="chart-container">
              <Line data={getMonthlyChartData()} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Contributing Factors */}
        <div className="factors-section">
          <h3>Contributing Factors</h3>
          <div className="factors-grid">
            <div className="factor-item">
              <div className="factor-label">Roof Area</div>
              <div className="factor-value">{buildingData.roof_area?.toFixed(0)} m²</div>
            </div>
            <div className="factor-item">
              <div className="factor-label">Orientation</div>
              <div className="factor-value">{buildingData.azimuth?.toFixed(0)}°</div>
            </div>
            <div className="factor-item">
              <div className="factor-label">Shading</div>
              <div className="factor-value">{buildingData.shading?.toFixed(0)}%</div>
            </div>
            <div className="factor-item">
              <div className="factor-label">Building Height</div>
              <div className="factor-value">{buildingData.height?.toFixed(1)} m</div>
            </div>
          </div>
        </div>

        {/* Environmental Impact */}
        <div className="environmental-section">
          <h3>Environmental Impact</h3>
          <div className="environmental-metrics">
            <div className="env-metric">
              <Leaf className="env-icon" />
              <div className="env-content">
                <div className="env-value">{buildingData.trees_equivalent}</div>
                <div className="env-label">Trees Equivalent</div>
              </div>
            </div>
            <div className="env-metric">
              <TrendingUp className="env-icon" />
              <div className="env-content">
                <div className="env-value">25+</div>
                <div className="env-label">Years of Clean Energy</div>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnalysisPanel;
