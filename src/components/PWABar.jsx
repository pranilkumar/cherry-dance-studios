import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaDownload } from 'react-icons/fa';
import { usePWAInstall } from '../hooks/usePWA';
import '../styles/PWABar.css';

const PWABar = () => {
  const { showInstallPrompt, isInstalled, installApp } = usePWAInstall();

  return (
    <>
      {/* PWA Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <motion.div
          className="pwa-install-prompt"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="prompt-content">
            <div className="prompt-icon">
              <FaDownload />
            </div>
            <div className="prompt-text">
              <h5>Install Cherry Dance</h5>
              <p>Get instant access with our app</p>
            </div>
            <div className="prompt-actions">
              <button className="install-btn" onClick={installApp}>
                Install
              </button>
              <button className="dismiss-btn" onClick={() => setShowInstallPrompt(false)}>
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default PWABar;
