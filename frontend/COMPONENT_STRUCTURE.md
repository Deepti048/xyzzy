# MapDashboard Component Structure

This document explains how the MapDashboard component has been refactored into smaller, more manageable pieces for better code clarity.

## Overview

The original MapDashboard component (400+ lines) was split into modular sub-components and helper utilities.

## Component Architecture

### 1. **MapDashboard.js** (Main Component)
**Location**: `src/components/MapDashboard.js`  
**Lines**: ~200 (reduced from 400+)  
**Purpose**: Main container component that manages state and orchestrates data

#### Responsibilities:
- Manages local database disasters (state)
- Manages real-time API disasters (state)
- Handles user location and routing
- Fetches data from APIs and database
- Coordinates between child components

#### Key Sections:
```javascript
// Data fetching
- fetchDisasters()       // Get local disasters from DB
- fetchStats()          // Get disaster statistics
- fetchRealTimeDisasters() // Get live USGS/NASA data

// Event handlers
- handleNavigate(lat, lng)  // Initiate routing

// Socket.io listeners
- onDisasterCreated()
- onDisasterUpdated()
- onDisasterDeleted()
```

#### State Variables:
```javascript
// Local disasters
[disasters, setDisasters]
[selectedCategory, setSelectedCategory]
[stats, setStats]

// User location
[userLocation, setUserLocation]
[routeTo, setRouteTo]

// Real-time data
[realTimeDisasters, setRealTimeDisasters]
[showRealTime, setShowRealTime]
[realTimeLoading, setRealTimeLoading]
[lastUpdateTime, setLastUpdateTime]
[apiErrors, setApiErrors]

// Other
[weatherData, setWeatherData]
[showProximityRadius, setShowProximityRadius]
```

---

### 2. **RealTimeControls.js** (Sub-Component)
**Location**: `src/components/RealTimeControls.js`  
**Purpose**: Controls for real-time global disaster data  
**Props**:
```javascript
{
  showRealTime: boolean          // Toggle live data on/off
  onToggleRealTime: function     // Callback when toggled
  realTimeLoading: boolean       // Show loading state
  lastUpdateTime: Date           // Display last update
  onRefresh: function            // Manual refresh callback
  realTimeDisastersCount: number // Show count of disasters
  apiErrors: {usgs, eonet}       // Display API failures
}
```

#### Features:
- Toggle button to enable/disable real-time data
- Live status indicator (🟢 Live / ⏳ Updating)
- Last update timestamp
- Manual refresh button
- API error indicators (USGS/NASA unavailable)
- Global disaster count

---

### 3. **CategoryFilter.js** (Sub-Component)
**Location**: `src/components/CategoryFilter.js`  
**Purpose**: Filter disasters by type  
**Props**:
```javascript
{
  selectedCategory: string       // Currently selected category
  onCategoryChange: function     // Callback when category selected
  showRealTime: boolean          // (Optional) Show context
}
```

#### Categories:
- 📍 All (show all active disasters)
- 🌊 Floods
- 🔥 Wildfires
- 🌍 Earthquakes
- ⛈️ Storms
- 🌋 Volcanoes
- 🌊 Tsunamis
- ⛰️ Landslides

---

### 4. **MapLegend.js** (Sub-Component)
**Location**: `src/components/MapLegend.js`  
**Purpose**: Display map color/emoji meanings  
**Props**:
```javascript
{
  showRealTime: boolean  // Show real-time data sources
}
```

#### Displays:
- **Severity Levels**: Critical (red), High (orange), Medium (yellow), Low (blue)
- **Disaster Types**: Icons and emojis from DISASTER_EMOJIS
- **Data Sources**: Database disasters, USGS earthquakes, NASA events

---

### 5. **RoutingDisplay.js** (Sub-Component within MapDashboard)
**Location**: Inline in `src/components/MapDashboard.js`  
**Purpose**: Displays route from user location to disaster site  
**Uses**: OpenStreetMap Routing Service (OSRM)

#### Process:
1. Fetches route from OSRM API
2. Draws polyline on map
3. Displays distance and ETA in popup
4. Fits map bounds to route

---

### 6. **mapHelpers.js** (Utility Module)
**Location**: `src/components/mapHelpers.js`  
**Purpose**: Shared helper functions and constants

#### Exported Constants:
```javascript
// Emoji mappings
export const DISASTER_EMOJIS = {
  flood: '🌊',
  fire: '🔥',
  earthquake: '🌍',
  cyclone: '🌀',
  landslide: '⛰️',
  tsunami: '🌊',
  drought: '☀️',
  other: '⚠️'
}

// Color mappings by severity
export const SEVERITY_COLORS = {
  critical: '#e74c3c',  // Red
  high: '#e67e22',      // Orange
  medium: '#f1c40f',    // Yellow
  low: '#3498db'        // Blue
}
```

#### Exported Functions:

**createMarkerIcon(category, severity)**
```javascript
// Creates a Leaflet marker icon with emoji
// Category: disaster type (e.g., 'flood')
// Severity: disaster severity level (e.g., 'critical')
// Returns: L.divIcon for Leaflet map
```

**createUserLocationIcon()**
```javascript
// Creates blue marker for user's current location
// Returns: L.divIcon with pulsing effect
```

**filterDisasters(disasters, selectedCategory)**
```javascript
// Filters disasters array by category
// Shows only non-resolved disasters
// Category 'all' shows all active disasters
// Returns: filtered array
```

**combinedisasters(local, realTime, showRealTime)**
```javascript
// Merges local database disasters with real-time API data
// showRealTime: boolean to include real-time data
// Returns: combined array
```

**calculateRouteInfo(distance, duration)**
```javascript
// Formats route info from OSRM API
// Returns: { distanceKm: string, durationMinutes: number }
```

---

## Data Flow

### Initial Setup (useEffect)
```
MapDashboard mounts
  ↓
Fetch local disasters → setDisasters
  ↓
Fetch statistics → setStats
  ↓
Fetch real-time data → setRealTimeDisasters
  ↓
Setup auto-refresh (every 45 seconds)
  ↓
Get user location → setUserLocation
  ↓
Listen to Socket.io for updates
```

### Real-Time Updates
```
Every 45 seconds (or manual refresh):
  ↓
fetchRealTimeDisasters()
  ↓
Fetch from USGS & NASA APIs
  ↓
setRealTimeDisasters(newData)
  ↓
Update map markers
```

### Socket.io Updates
```
Server emits 'disaster:created'
  ↓
MapDashboard listens
  ↓
Add to disasters array
  ↓
Recompute filtered disasters
  ↓
Map markers update automatically
```

---

## Rendering Flow

```
<MapDashboard>
  ├─ Header with statistics
  ├─ <RealTimeControls /> — live data toggle & refresh
  ├─ Weather bar (if available)
  ├─ <CategoryFilter /> — category buttons
  ├─ Route banner (if active)
  ├─ <MapContainer> (Leaflet map)
  │  ├─ TileLayer (OSM base)
  │  ├─ User location marker
  │  ├─ Proximity circle (50km)
  │  ├─ Disaster markers (filtered)
  │  └─ <RoutingDisplay /> (polyline)
  └─ <MapLegend /> — color/emoji meanings
```

---

## Component Communication

### Parent → Child (Props)
```
MapDashboard 
  → RealTimeControls: showRealTime, realTimeLoading, onToggleRealTime, etc.
  → CategoryFilter: selectedCategory, onCategoryChange
  → MapLegend: showRealTime
```

### Child → Parent (Callbacks)
```
RealTimeControls
  → onToggleRealTime() — user toggled live data
  → onRefresh() — user clicked refresh

CategoryFilter
  → onCategoryChange() — user selected category
```

### External Communication
```
MapDashboard
  → API calls: disastersAPI, intelligenceAPI
  → Socket.io: socketService for real-time updates
  → Real-time service: fetchAllDisasters() from USGS/NASA
  → Browser APIs: navigator.geolocation for user location
```

---

## Benefits of This Structure

✅ **Separation of Concerns**
- Each component has a single responsibility
- Logic is modularized and testable

✅ **Reusability**
- Helper functions can be used in other components
- RealTimeControls, CategoryFilter, MapLegend standalone

✅ **Readability**
- MapDashboard reduced from 400+ to ~200 lines
- Code flows logically from top to bottom
- Comments explain each section

✅ **Maintainability**
- Bug fixes in specific components don't affect others
- Changes to filters don't impact real-time logic
- Easy to update individual components

✅ **Performance**
- Sub-components only re-render when their props change
- Filtering and calculations happen once per update
- No duplicate code

---

## File Sizes

| File | Lines | Purpose |
|------|-------|---------|
| MapDashboard.js | ~200 | Main component |
| RealTimeControls.js | ~65 | Live data controls |
| CategoryFilter.js | ~40 | Disaster filtering |
| MapLegend.js | ~55 | Legend display |
| mapHelpers.js | ~95 | Utilities & constants |
| **Total** | **~455** | (Previously 400+ in 1 file) |

---

## Testing Tips

### Test RealTimeControls
```javascript
// Can be tested independently with mock props
<RealTimeControls 
  showRealTime={true}
  realTimeLoading={false}
  realTimeDisastersCount={5}
  onToggleRealTime={jest.fn()}
  onRefresh={jest.fn()}
/>
```

### Test CategoryFilter
```javascript
// Can be tested independently
<CategoryFilter 
  selectedCategory="flood"
  onCategoryChange={jest.fn()}
/>
```

### Test mapHelpers
```javascript
// Pure functions, easy to test
expect(filterDisasters([disaster1, disaster2], 'flood')).toHaveLength(1)
expect(createMarkerIcon('flood', 'critical')).toBeDefined()
```

---

## Future Enhancements

1. **Disaster Info Modal** - Extract disaster detail popup into separate component
2. **Map Controls** - Extract zoom/pan controls into component
3. **Loading States** - Create LoadingSpinner component
4. **Error Boundaries** - Wrap components with error handling
5. **Custom Hooks** - Extract data fetching into useDisasters() hook

---

## Student Learning Path

👶 **Start here**: Read this document and understand the component tree  
🚶 **Next**: Open MapDashboard.js and follow the comments  
🏃 **Then**: Look at RealTimeControls.js to see prop passing  
🔥 **Advanced**: Study mapHelpers.js to understand helper patterns  
🎯 **Master**: Modify a component and test the changes

