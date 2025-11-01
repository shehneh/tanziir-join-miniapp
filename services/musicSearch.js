const axios = require('axios');
const config = require('../config');

/**
 * Search music using iTunes API
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of music results
 */
async function searchItunes(query) {
  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit: config.maxSearchResults
      },
      timeout: config.searchTimeout
    });
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results.map(item => ({
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        previewUrl: item.previewUrl,
        artworkUrl: item.artworkUrl100,
        duration: item.trackTimeMillis,
        releaseDate: item.releaseDate,
        source: 'iTunes'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching iTunes:', error.message);
    return [];
  }
}

/**
 * Main search function that tries multiple sources
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of music results
 */
async function searchMusic(query) {
  // Try iTunes first (free API, no authentication)
  const itunesResults = await searchItunes(query);
  
  if (itunesResults.length > 0) {
    return itunesResults;
  }
  
  // Could add more sources here:
  // - Deezer API
  // - Spotify API (requires authentication)
  // - YouTube Data API (requires API key)
  // - SoundCloud API
  
  return [];
}

/**
 * Download audio from URL
 * @param {string} url - Audio URL
 * @returns {Promise<Stream>} - Audio stream
 */
async function downloadAudio(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: config.downloadTimeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error downloading audio:', error.message);
    throw error;
  }
}

module.exports = {
  searchMusic,
  searchItunes,
  downloadAudio
};
