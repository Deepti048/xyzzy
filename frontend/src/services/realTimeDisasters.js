/**
 * Real-Time Disaster API Service
 * Fetches live disaster data from public APIs:
 * - USGS Earthquake API
 * - NASA EONET API (Earth Observatory Natural Event Tracking)
 */

// USGS Earthquake API configuration (recent earthquakes)
const USGS_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

// NASA EONET API configuration
const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200';

const EARTHQUAKE_MAX_AGE_HOURS = 24;
const EONET_MAX_AGE_DAYS = 7;

/**
 * Map between NASA EONET category IDs and our disaster types
 */
const EVENT_CATEGORY_MAP = {
    8: 'fire',
    12: 'storm',
    15: 'flood',
    10: 'volcano',
    14: 'tsunami',
    17: 'earthquake',
};
export const fetchEarthquakes = async () => {
    try {
        const response = await fetch(USGS_API);
        if (!response.ok) throw new Error('USGS API failed');
        
        const data = await response.json();
        
        const nowMs = Date.now();
        const maxAgeMs = EARTHQUAKE_MAX_AGE_HOURS * 60 * 60 * 1000;

        // Parse earthquake features and convert to our format
        return data.features
            .map(feature => ({
                id: `usgs_${feature.id}`,
                source: 'usgs',
                category: 'earthquake',
                title: feature.properties.title,
                description: `Magnitude ${feature.properties.mag}`,
                location_name: feature.properties.place || 'Unknown location',
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
                severity: getSeverityFromMagnitude(feature.properties.mag),
                magnitude: feature.properties.mag,
                depth: feature.geometry.coordinates[2],
                timestamp: new Date(feature.properties.time),
                status: 'active',
                url: feature.properties.url
            }))
            .filter(eq => Number.isFinite(eq.magnitude) && eq.magnitude >= 3.0) // Filter out minor earthquakes
            .filter(eq => nowMs - eq.timestamp.getTime() <= maxAgeMs); // Keep only very recent events
    } catch (error) {
        console.error('Error fetching earthquakes:', error);
        return [];
    }
};

/**
 * Fetch and parse disaster data from NASA EONET API
 * @returns {Promise<Array>} Array of natural events
 */
export const fetchNasaEvents = async () => {
    try {
        const response = await fetch(EONET_API);
        if (!response.ok) throw new Error('NASA EONET API failed');
        
        const data = await response.json();
        
        const nowMs = Date.now();
        const maxAgeMs = EONET_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

        // Parse events and convert to our format
        return data.events
            .filter(event => event.geometries && event.geometries.length > 0)
            .map(event => {
                const geometry = event.geometries[event.geometries.length - 1]; // Latest geometry point
                const categoryId = event.categories[0]?.id;
                const category = EVENT_CATEGORY_MAP[categoryId] || 'other';
                const timestamp = new Date(geometry.date || event.updated);
                
                return {
                    id: `eonet_${event.id}`,
                    source: 'nasa',
                    category: category,
                    title: event.title,
                    description: event.description || `${category.toUpperCase()} event`,
                    location_name: event.title,
                    latitude: geometry.coordinates[1],
                    longitude: geometry.coordinates[0],
                    severity: 'medium', // NASA doesn't provide severity
                    timestamp,
                    status: 'active',
                    url: event.link || ''
                };
            })
            .filter(event => !Number.isNaN(event.timestamp.getTime()))
            .filter(event => nowMs - event.timestamp.getTime() <= maxAgeMs);
    } catch (error) {
        console.error('Error fetching NASA events:', error);
        return [];
    }
};

/**
 * Determine severity level from earthquake magnitude
 * @param {number} magnitude - Earthquake magnitude
 * @returns {string} Severity level
 */
const getSeverityFromMagnitude = (magnitude) => {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 6.0) return 'high';
    if (magnitude >= 5.0) return 'medium';
    return 'low';
};

/**
 * Fetch all real-time disaster data from multiple sources
 * @returns {Promise<Array>} Combined array of all disasters
 */
export const fetchAllDisasters = async () => {
    try {
        const [earthquakes, nasaEvents] = await Promise.all([
            fetchEarthquakes(),
            fetchNasaEvents()
        ]);
        
        // Combine and remove duplicates
        const allDisasters = [...earthquakes, ...nasaEvents];
        
        // Sort by timestamp (newest first)
        allDisasters.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`Fetched ${allDisasters.length} real-time disasters:`, {
            earthquakes: earthquakes.length,
            nasaEvents: nasaEvents.length
        });
        
        return allDisasters;
    } catch (error) {
        console.error('Error fetching all disasters:', error);
        return [];
    }
};

/**
 * Get unique disasters by location (prevents duplicate markers for same event)
 * @param {Array} disasters - Array of disasters
 * @param {number} radius - Radius in degrees to consider as same location
 * @returns {Array} Filtered disasters
 */
export const filterDuplicatesByLocation = (disasters, radius = 0.5) => {
    const filtered = [];
    const processed = new Set();
    
    for (const disaster of disasters) {
        let isDuplicate = false;
        
        for (const processed_id of processed) {
            const other = disasters.find(d => d.id === processed_id);
            if (other) {
                const latDiff = Math.abs(disaster.latitude - other.latitude);
                const lngDiff = Math.abs(disaster.longitude - other.longitude);
                
                if (latDiff < radius && lngDiff < radius) {
                    isDuplicate = true;
                    break;
                }
            }
        }
        
        if (!isDuplicate) {
            filtered.push(disaster);
            processed.add(disaster.id);
        }
    }
    
    return filtered;
};

/**
 * Calculate distance between two coordinates (in km)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Filter disasters within a certain distance from a point
 * @param {Array} disasters - Array of disasters
 * @param {number} userLat - User latitude
 * @param {number} userLon - User longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered disasters
 */
export const getDisastersNearby = (disasters, userLat, userLon, radiusKm = 50) => {
    return disasters.filter(disaster => {
        const distance = calculateDistance(userLat, userLon, disaster.latitude, disaster.longitude);
        return distance <= radiusKm;
    });
};

const realTimeDisastersService = {
    fetchEarthquakes,
    fetchNasaEvents,
    fetchAllDisasters,
    filterDuplicatesByLocation,
    calculateDistance,
    getDisastersNearby
};

export default realTimeDisastersService;
