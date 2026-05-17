'use client';
// src/VideoEmbed.jsx
import React, { useState } from 'react';
import '../styles/VideoEmbed.css';

const VideoEmbed = ({ videoId, title }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // YouTube thumbnail URL
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  // YouTube embed URL with autoplay, modest branding, and controls
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`;

  const handlePlayClick = () => {
    setIsLoaded(true); // When clicked, set state to true to load the iframe
  };

  return (
    <div className="video-embed-wrapper"> {/* Renamed from video-embed-container to avoid conflict */}
      {!isLoaded ? (
        // Display thumbnail and play button if not loaded
        <div className="video-thumbnail-container" onClick={handlePlayClick} tabIndex="0" role="button" aria-label={`Play video: ${title}`}>
          <img src={thumbnailUrl} alt={title} className="video-thumbnail" />
          <div className="play-button">
            <i className="fa-solid fa-play"></i> {/* Font Awesome play icon */}
          </div>
        </div>
      ) : (
        // Display actual iframe if loaded
        <iframe
          width="100%"
          height="100%" // Height is controlled by CSS padding-bottom of parent
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};

export default VideoEmbed;