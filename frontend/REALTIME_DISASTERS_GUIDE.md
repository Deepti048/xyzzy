# Real-Time Global Disaster Map Implementation Guide

## 📋 Overview

Your application now displays real-time disasters from multiple public APIs on an interactive Leaflet.js map. The system automatically fetches and displays:

- **Earthquakes** from USGS Earthquake API
- **Wildfires, Storms, Floods, Volcanoes, Tsunamis** from NASA EONET API

## 🎯 Features Implemented

### 1. **Real-Time Data Fetching**
- USGS Earthquake API (magnitude ≥ 3.0)
- NASA EONET (Earth Observable Natural Event Tracking)
- Auto-refresh every 45 seconds
- Manual refresh button available
- Error handling for API failures

### 2. **Map Display**
- World map using Leaflet.js
- Custom emoji markers for different disaster types
- Color-coded severity levels (Critical, High, Medium, Low)
- Popup information on marker click
- User location tracking with 50 km proximity radius

### 3. **User Interface**
- Toggle to enable/disable live global disasters
- Real-time update indicator with timestamp
- API error notifications
- Count of active global disasters
- Category filter buttons
- Weather information for user's location

### 4. **Error Handling**
- Graceful failure if APIs are unavailable
- Error badges showing which APIs failed
- Fallback to local database disasters
- Network error management

## 🔧 Technical Architecture

### Service File: `realTimeDisasters.js`

```javascript
// Import the service
import { fetchAllDisasters } from '../services/realTimeDisasters';

// Functions available:
fetchEarthquakes()           // Fetch USGS earthquakes
fetchNasaEvents()            // Fetch NASA EONET events
fetchAllDisasters()          // Combined data from all sources
filterDuplicatesByLocation() // Remove location-based duplicates
calculateDistance()          // Haversine distance calculation
getDisastersNearby()         // Filter disasters by radius
```

### Data Structure

Each disaster object contains:
```javascript
{
    id: 'usgs_123' OR 'eonet_456',
    source: 'usgs' OR 'nasa',
    category: 'earthquake' | 'fire' | 'flood' | 'storm' | 'volcano' | 'tsunami',
    title: 'Earthquake in Japan',
    description: 'Magnitude 5.2',
    location_name: 'Near Sendai',
    latitude: 38.3250,
    longitude: 142.3386,
    severity: 'critical' | 'high' | 'medium' | 'low',
    timestamp: Date object,
    status: 'responding',
    magnitude: 5.2 (earthquakes only),
    depth: 10.5 (earthquakes only in km)
}
```

## 📍 API Integrations

### USGS Earthquake API
- **URL**: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson`
- **Updates**: Last hour of earthquakes
- **Magnitude Filter**: ≥ 3.0 (to avoid clutter)
- **Severity Auto-Calculation**:
  - Magnitude ≥ 7.0 → Critical
  - Magnitude ≥ 6.0 → High
  - Magnitude ≥ 5.0 → Medium
  - Magnitude < 5.0 → Low

### NASA EONET API
- **URL**: `https://eonet.gsfc.nasa.gov/api/v3/events`
- **Categories Supported**:
  - 8: Wildfires
  - 10: Volcanoes
  - 12: Storms
  - 14: Tsunamis
  - 15: Floods
  - 17: Earthquakes

## 🚀 How to Use

### 1. Enable Global Disasters View
```
Click the ✅ checkbox: "🌍 Live Global Disasters"
```

### 2. View Real-Time Updates
- Green indicator shows "🟢 Live" when data is current
- Timestamp shows last update time
- Click "🔄 Refresh Now" to manually update

### 3. Category Filtering
```
Click category buttons: All | 🌊 Flood | 🔥 Fire | 🌍 Earthquake | etc.
```

### 4. Interact with Markers
- Click any marker to see details
- "Navigate Here" button shows route from your location (if enabled)

### 5. View Nearby Disasters
```
Enable the 50 km Radius checkbox to see proximity circle
```

## ⚙️ Configuration & Customization

### Change Auto-Refresh Rate
In `MapDashboard.js`, find:
```javascript
autoRefreshRef.current = setInterval(() => {
    fetchRealTimeDisasters();
}, 45000); // Change this value (in milliseconds)
```

### Filter Earthquake Magnitude
In `realTimeDisasters.js`, find:
```javascript
.filter(eq => eq.magnitude >= 3.0); // Adjust minimum magnitude
```

### Add More Disaster Categories
1. Update `EVENT_CATEGORY_MAP` in `realTimeDisasters.js`
2. Add emoji mapping in `MapDashboard.js` `getCategoryIcon()`
3. Update CSS color schemes in `MapDashboard.css`

### Change Update Frequency
Modify the interval (in milliseconds):
```javascript
// From 45000 milliseconds (45 seconds)
// To your desired interval
```

## 🎨 UI Customization

### Marker Colors & Severities
Located in `getCategoryIcon()` function:
```javascript
const colors = {
    critical: '#e74c3c',  // Red
    high: '#e67e22',      // Orange
    medium: '#f1c40f',    // Yellow
    low: '#3498db'        // Blue
};
```

### Change Map Provider
In MapContainer component:
```javascript
// Current: OpenStreetMap
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

// Other options:
// Satellite: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
// Dark: https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png
```

## 📊 Performance Considerations

1. **Auto-Cleanup**: Old disaster markers are automatically removed
2. **Efficient Rendering**: Only visible markers are rendered
3. **Duplicate Prevention**: Location-based deduplication (0.5° radius)
4. **Network Optimization**: Single parallel fetch for multiple APIs
5. **Caching**: Updates cached in component state

## 🔍 Data Quality Notes

- **USGS Data**: Real earthquakes, scientifically verified
- **NASA Data**: Tracked natural events with satellite imagery
- **Magnitude Filter**: Set to ≥ 3.0 to avoid overwhelming the map
- **Update Lag**: Real data has 15-30 second publication delay
- **Accuracy**: Coordinates accurate to ±5 km for earthquakes

## ⚠️ Error Handling Examples

```javascript
// API unavailable
// → Gray error badge appears
// → Still shows local database disasters
// → "⚠️ USGS Earthquakes unavailable"

// Network timeout
// → Automatic retry in next 45-second cycle
// → Error logged to console

// Invalid coordinates
// → Automatically filtered out
// → Not displayed on map
```

## 🧪 Testing the Implementation

1. **Enable Live Global Disasters**
   - Check the toggle on map page
   - Wait for data to load (~2-3 seconds)
   - You should see global earthquake/disaster markers

2. **Test Auto-Refresh**
   - Note the timestamp
   - Wait 45 seconds
   - Check if timestamp updates automatically

3. **Test Manual Refresh**
   - Click "🔄 Refresh Now" button
   - Verify data updates immediately

4. **Test Error Handling**
   - Simulate offline mode (DevTools → Offline)
   - Error badges should appear
   - Local data should still display

5. **Test Filtering**
   - Click different category buttons
   - Only those disaster types should show

## 🔗 API Status Links

- **USGS Earthquake API Status**: https://earthquakes.usgs.gov/
- **NASA EONET Status**: https://eonet.gsfc.nasa.gov/

## 📱 Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 13+)
- Internet Explorer: ❌ Not supported (uses fetch API)

## 🚀 Future Enhancements

Potential features to add:
1. **Clustering** - Group nearby markers at low zoom levels
2. **Heat Maps** - Show disaster intensity gradients
3. **Historical Data** - Timeline view of past disasters
4. **Notifications** - Browser alerts for nearby disasters
5. **Export** - Download data as CSV/JSON
6. **Advanced Filtering** - Filter by magnitude, date range, severity

## 📝 Code Comments

All code is thoroughly commented with:
- Function descriptions and parameters
- Return value documentation
- Usage examples
- Edge case handling

## 🆘 Troubleshooting

### No data showing
1. Ensure "Live Global Disasters" toggle is ON
2. Check browser console for errors (F12)
3. Check network tab (DevTools → Network)
4. Verify APIs are accessible

### Map not loading
1. Ensure Leaflet CSS is imported in index.html
2. Check MapContainer height in CSS (should be > 0)
3. Clear browser cache (Ctrl+Shift+Del)

### Markers not updating
1. Check auto-refresh interval (should be > 30 seconds)
2. Verify no JavaScript errors in console
3. Check API responses in Network tab

### Performance issues
1. Reduce auto-refresh frequency
2. Increase minimum earthquake magnitude filter
3. Clear browser cache
4. Close unused browser tabs

---

## 📚 Additional Resources

- Leaflet.js Docs: https://leafletjs.com/
- USGS Earthquake API: https://earthquake.usgs.gov/fdsnws/event/1/
- NASA EONET API: https://eonet.gsfc.nasa.gov/api/

---

**Version**: 1.0  
**Last Updated**: April 1, 2026  
**Maintained By**: Your Team
