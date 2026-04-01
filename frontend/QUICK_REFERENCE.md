# Real-Time Disaster Map - Quick Reference & Code Examples

## 🚀 Quick Start

### Enable Live Global Disasters
1. Open your app at http://localhost:3000
2. Navigate to "🗺️ Real-Time Command Map" 
3. Check the "🌍 Live Global Disasters" toggle
4. Wait 2-3 seconds for data to load

### Available Public APIs (No Authentication Required)

```javascript
// USGS Earthquakes (Last Hour)
https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson

// NASA EONET (Active Natural Events)
https://eonet.gsfc.nasa.gov/api/v3/events
```

---

## 💻 Code Examples

### Example 1: Fetch Only Earthquakes
```javascript
import { fetchEarthquakes } from '../services/realTimeDisasters';

const quakes = await fetchEarthquakes();
console.log(`Found ${quakes.length} earthquakes`);
quakes.forEach(quake => {
    console.log(`${quake.title} - Magnitude: ${quake.magnitude}`);
});
```

### Example 2: Get Critical Disasters
```javascript
import { fetchAllDisasters } from '../services/realTimeDisasters';

const allDisasters = await fetchAllDisasters();
const criticalOnly = allDisasters.filter(d => d.severity === 'critical');
console.log(`${criticalOnly.length} critical disasters detected`);
```

### Example 3: Find Nearby Disasters
```javascript
import { getDisastersNearby } from '../services/realTimeDisasters';

const userLat = 28.6139;  // Delhi
const userLon = 77.2090;
const radiusKm = 100;

const nearby = getDisastersNearby(allDisasters, userLat, userLon, radiusKm);
console.log(`${nearby.length} disasters within ${radiusKm}km`);
```

### Example 4: Calculate Distance Between Two Points
```javascript
import { calculateDistance } from '../services/realTimeDisasters';

const distance = calculateDistance(
    28.6139,  // User latitude
    77.2090,  // User longitude
    34.0522,  // Earthquake latitude
    -118.2437 // Earthquake longitude
);
console.log(`Distance: ${distance.toFixed(1)} km`);
```

### Example 5: Remove Duplicate Events
```javascript
import { filterDuplicatesByLocation } from '../services/realTimeDisasters';

const allData = await fetchAllDisasters();
const unique = filterDuplicatesByLocation(allData, 0.5); // 0.5 degree radius
console.log(`Removed ${allData.length - unique.length} duplicates`);
```

---

## 🎨 Customization Examples

### Add New Disaster Category to NATO
```javascript
// In: frontend/src/services/realTimeDisasters.js
// Modify EVENT_CATEGORY_MAP to add category ID 20 -> 'avalanche'

const EVENT_CATEGORY_MAP = {
    8: 'fire',
    10: 'volcano',
    12: 'storm',
    14: 'tsunami',
    15: 'flood',
    17: 'earthquake',
    20: 'avalanche'  // ← ADD THIS
};

// Add category to emojis in MapDashboard.js
const emojis = {
    flood: '🌊',
    fire: '🔥',
    earthquake: '🌍',
    cyclone: '🌀',
    landslide: '⛰️',
    tsunami: '🌊',
    drought: '☀️',
    avalanche: '⛈️',  // ← ADD THIS
    other: '⚠️'
};
```

### Change Update Frequency to 60 Seconds
```javascript
// In: frontend/src/components/MapDashboard.js
// Find this code:

autoRefreshRef.current = setInterval(() => {
    console.log('Auto-refreshing real-time disasters...');
    fetchRealTimeDisasters();
}, 45000);  // ← Change to 60000

// New:
autoRefreshRef.current = setInterval(() => {
    console.log('Auto-refreshing real-time disasters...');
    fetchRealTimeDisasters();
}, 60000);  // 60 seconds
```

### Filter Only Major Earthquakes (Magnitude ≥ 5.0)
```javascript
// In: frontend/src/services/realTimeDisasters.js
// Find this line in fetchEarthquakes():

.filter(eq => eq.magnitude >= 3.0);  // ← Change 3.0 to 5.0

// New:
.filter(eq => eq.magnitude >= 5.0);
```

### Change Severity Threshold for Earthquakes
```javascript
// In: frontend/src/services/realTimeDisasters.js
// Modify getSeverityFromMagnitude function:

const getSeverityFromMagnitude = (magnitude) => {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 6.0) return 'high';
    if (magnitude >= 5.0) return 'medium';
    return 'low';
};

// For example, to lower severity:
const getSeverityFromMagnitude = (magnitude) => {
    if (magnitude >= 6.5) return 'critical';  // ← Changed from 7.0
    if (magnitude >= 5.5) return 'high';      // ← Changed from 6.0
    if (magnitude >= 4.5) return 'medium';    // ← Changed from 5.0
    return 'low';
};
```

### Use Different Map Tile Provider (Satellite View)
```javascript
// In: frontend/src/components/MapDashboard.js
// Find TileLayer component:

<TileLayer
    attribution='...'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

// Change to satellite:
<TileLayer
    attribution='©OpenStreetMap, ©Esri'
    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
/>
```

---

## 🔧 Performance Optimization

### Reduce Memory Usage
```javascript
// Limit number of displayed markers
const filtered = combined.slice(0, 100); // Show only top 100

// Or filter by severity
const filtered = combined.filter(d => 
    d.severity === 'critical' || d.severity === 'high'
);
```

### Increase Update Interval (Less Network Traffic)
```javascript
// Change from 45 seconds to 5 minutes
autoRefreshRef.current = setInterval(() => {
    fetchRealTimeDisasters();
}, 300000);  // 5 minutes
```

### Cache Data Locally
```javascript
// Save to localStorage
const saveToLocalStorage = (disasters) => {
    localStorage.setItem('realTimeDisasters', JSON.stringify({
        data: disasters,
        timestamp: new Date()
    }));
};

// Load from localStorage
const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('realTimeDisasters');
    return stored ? JSON.parse(stored).data : null;
};
```

---

## 🧪 Testing Examples

### Test Real-Time Updates
```javascript
// Add to browser console to log updates
const observer = setInterval(() => {
    const disasters = document.querySelectorAll('.leaflet-marker-icon');
    console.log(`Current markers on map: ${disasters.length}`);
}, 5000);

// Stop observer
clearInterval(observer);
```

### Simulate API Failure
```javascript
// Temporarily disable APIs in realTimeDisasters.js
export const fetchEarthquakes = async () => {
    throw new Error('Simulated API failure');  // ← Add this
};
```

### Test with Mock Data
```javascript
// Create mock disasters
const mockDisasters = [
    {
        id: 'mock_1',
        category: 'earthquake',
        title: 'Test Earthquake',
        latitude: 28.6139,
        longitude: 77.2090,
        severity: 'high',
        magnitude: 5.2,
        status: 'responding'
    }
];

// Use in state
setRealTimeDisasters(mockDisasters);
```

---

## 📊 API Response Examples

### USGS API Response Structure
```json
{
    "features": [
        {
            "id": "us7000a5u2",
            "properties": {
                "mag": 5.2,
                "place": "10 km NE of Sendai, Japan",
                "time": 1700000000000,
                "updated": 1700010000000,
                "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000a5u2/executive"
            },
            "geometry": {
                "coordinates": [142.3386, 38.3250, 10.5]
            }
        }
    ]
}
```

### NASA EONET Response Structure
```json
{
    "events": [
        {
            "id": "EONET_4440",
            "title": "Aqaba Fire",
            "description": "A wildfire was detected near Aqaba, Jordan",
            "categories": [{"id": 8, "title": "Wildfires"}],
            "geometries": [
                {
                    "date": "2023-12-01T00:00:00Z",
                    "type": "Point",
                    "coordinates": [34.95, 29.52]
                }
            ],
            "link": "https://example.com"
        }
    ]
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Marker does not appear on map"
**Solution**: Check if coordinates are valid (lat: -90 to 90, lon: -180 to 180)
```javascript
const isValidCoordinates = (lat, lon) => {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};
```

### Issue: "API timeout"
**Solution**: Increase timeout or use AbortController
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeoutId);
```

### Issue: "Too many markers/performance slow"
**Solution**: Implement marker clustering
```javascript
// Will need to install: npm install react-leaflet-markercluster
// Then use in MapContainer to automatically cluster nearby markers
```

---

## 📚 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── MapDashboard.js          ← Main component
│   │   └── ... (other components)
│   ├── services/
│   │   ├── realTimeDisasters.js     ← API integration
│   │   ├── api.js
│   │   └── socket.js
│   └── styles/
│       ├── MapDashboard.css          ← Styling
│       └── ... (other styles)
└── REALTIME_DISASTERS_GUIDE.md      ← This file!
```

---

## 🔗 Useful Links

- **USGS API Docs**: https://earthquake.usgs.gov/fdsnws/event/1/
- **NASA EONET Docs**: https://eonet.gsfc.nasa.gov/api/
- **Leaflet API**: https://leafletjs.com/reference/
- **MDN Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---

## 💡 Tips & Tricks

1. **Multi-source filtering**
   ```javascript
   const onlyEarthquakes = combined.filter(d => d.source === 'usgs');
   const onlyNasaEvents = combined.filter(d => d.source === 'nasa');
   ```

2. **Sort by most recent**
   ```javascript
   combined.sort((a, b) => b.timestamp - a.timestamp);
   ```

3. **Group by category**
   ```javascript
   const grouped = combined.reduce((acc, disaster) => {
       if (!acc[disaster.category]) acc[disaster.category] = [];
       acc[disaster.category].push(disaster);
       return acc;
   }, {});
   ```

4. **Export data as CSV**
   ```javascript
   const csv = combined.map(d => 
       `${d.title},${d.latitude},${d.longitude},${d.severity}`
   ).join('\n');
   ```

---

**Happy mapping! 🗺️**
