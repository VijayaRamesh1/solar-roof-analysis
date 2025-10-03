import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchBar.css';

const SearchBar = ({ onResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search function
  const searchAddresses = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      searchAddresses(value);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  // Handle result selection
  const handleResultClick = async (result) => {
    setQuery(result.address);
    setIsOpen(false);
    
    // Fetch detailed building data
    try {
      const response = await fetch(`http://localhost:5001/api/buildings/${result.id}`);
      if (response.ok) {
        const buildingData = await response.json();
        onResult(buildingData);
      }
    } catch (error) {
      console.error('Error fetching building details:', error);
    }
  };

  // Handle clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle key navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <motion.div 
      className="search-bar" 
      ref={searchRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="search-input-container"
        whileFocus={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <motion.div
          animate={{ rotate: query ? 360 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Search className="search-icon" />
        </motion.div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for an address..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="search-input"
          aria-label="Search for an address"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="search-results"
          role="combobox"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear search"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>
        {loading && (
          <motion.div 
            className="loading-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-spinner" />
          </motion.div>
        )}
      </motion.div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (results.length > 0 || loading) && (
          <motion.div 
            className="search-results" 
            role="listbox" 
            id="search-results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <motion.div 
                className="search-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="loading-spinner" />
                <span>Searching...</span>
              </motion.div>
            ) : results.length > 0 ? (
              results.map((result, index) => (
                <motion.button
                  key={result.id}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                  role="option"
                  aria-selected="false"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <MapPin className="result-icon" />
                  </motion.div>
                  <div className="result-content">
                    <div className="result-address">{result.address}</div>
                    <div className="result-score">
                      Solar Score: {result.solar_score}/100
                    </div>
                  </div>
                  <motion.div 
                    className="result-score-badge"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {getScoreColor(result.solar_score)}
                  </motion.div>
                </motion.button>
              ))
            ) : (
              <motion.div 
                className="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <MapPin className="no-results-icon" />
                <span>No addresses found</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Helper function to get score color
const getScoreColor = (score) => {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
};

export default SearchBar;
