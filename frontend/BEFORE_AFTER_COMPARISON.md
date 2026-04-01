# Before & After: Code Refactoring Examples

## Example 1: Icon Creation

### ❌ BEFORE (Scattered in MapDashboard)
```javascript
// Lines 8-26 in old MapDashboard.js
const getCategoryIcon = (category, severity) => {
    const emojis = {
        flood: '🌊', fire: '🔥', earthquake: '🌍', cyclone: '🌀',
        landslide: '⛰️', tsunami: '🌊', drought: '☀️', other: '⚠️'
    };
    const colors = {
        critical: '#e74c3c', high: '#e67e22', medium: '#f1c40f', low: '#3498db'
    };
    const emoji = emojis[category] || '⚠️';
    const color = colors[severity] || '#f1c40f';

    return L.divIcon({
        html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${emoji}</div>`,
        className: 'custom-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};
```

**Problems**:
- Mixed with component logic
- Hard to test
- Duplicates if used elsewhere
- CSS embedded in string

---

### ✅ AFTER (In mapHelpers.js)
```javascript
// mapHelpers.js - Clean, reusable, exportable

export const DISASTER_EMOJIS = {
    flood: '🌊',
    fire: '🔥',
    earthquake: '🌍',
    cyclone: '🌀',
    landslide: '⛰️',
    tsunami: '🌊',
    drought: '☀️',
    other: '⚠️'
};

export const SEVERITY_COLORS = {
    critical: '#e74c3c',
    high: '#e67e22',
    medium: '#f1c40f',
    low: '#3498db'
};

export const createMarkerIcon = (category, severity) => {
    const emoji = DISASTER_EMOJIS[category] || '⚠️';
    const color = SEVERITY_COLORS[severity] || '#f1c40f';

    const markerStyle = `
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    return L.divIcon({
        html: `<div style="${markerStyle}">${emoji}</div>`,
        className: 'custom-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};
```

**Benefits**:
- ✅ Reusable across components
- ✅ Constants separate from logic
- ✅ Easier to test
- ✅ Easy to find and modify
- ✅ Can import in other components

---

## Example 2: Filtering Logic

### ❌ BEFORE (Inline in render)
```javascript
// Lines 200-210 in old MapDashboard.js
const combined = [
    ...disasters,
    ...(showRealTime ? realTimeDisasters : [])
];

const filtered = selectedCategory === 'all'
    ? combined.filter(d => d.status !== 'resolved')
    : combined.filter(d => d.category === selectedCategory && d.status !== 'resolved');

// Then used in JSX directly
{filtered.map(disaster => (
    <Marker key={disaster.id} ... />
))}
```

**Problems**:
- Logic mixed with rendering
- Hard to test filtering separately
- Repeated in multiple places
- Difficult to modify filter rules

---

### ✅ AFTER (Extracted to helper)
```javascript
// mapHelpers.js
export const filterDisasters = (disasters, selectedCategory) => {
    if (selectedCategory === 'all') {
        return disasters.filter(d => d.status !== 'resolved');
    }
    return disasters.filter(
        d => d.category === selectedCategory && d.status !== 'resolved'
    );
};

// MapDashboard.js - Clean usage
const combined = [...disasters, ...(showRealTime ? realTimeDisasters : [])];
const filtered = filterDisasters(combined, selectedCategory);

// In JSX - still clean
{filtered.map(disaster => (
    <Marker key={disaster.id} ... />
))}
```

**Benefits**:
- ✅ Logic separated from rendering
- ✅ Can be tested independently
- ✅ Can be reused in other components
- ✅ Clear, self-documenting name
- ✅ Easy to modify rules in one place

---

## Example 3: Component Organization

### ❌ BEFORE (Single 400+ line component)
```javascript
// MapDashboard.js (old) - 400+ lines
function MapDashboard() {
    // 40 lines of state
    const [disasters, setDisasters] = useState([]);
    const [showRealTime, setShowRealTime] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    // ... 30 more state variables

    // 50 lines of data fetching
    const fetchRealTimeDisasters = async () => { ... }
    const fetchDisasters = async () => { ... }
    const fetchStats = async () => { ... }

    // 50 lines of useEffect hooks
    useEffect(() => { ... })
    useEffect(() => { ... })

    // 30 lines of event handlers
    const handleNavigate = (lat, lng) => { ... }

    // 180 lines of JSX - all the controls, map, legend
    return (
        <div className="map-dashboard">
            <header>...</header>
            <div className="realtime-controls">...</div>
            <div className="category-filter">...</div>
            <MapContainer>...</MapContainer>
            <div className="map-legend">...</div>
        </div>
    )
}
```

**Problems**:
- ❌ Hard to find specific code
- ❌ Too many concerns in one file
- ❌ Can't reuse UI sections
- ❌ Difficult to test
- ❌ Changes in one area affect everything

---

### ✅ AFTER (Organized into focused components)
```javascript
// MapDashboard.js (~200 lines - focused)
function MapDashboard() {
    // 10 lines of state - ONLY what MapDashboard needs
    const [disasters, setDisasters] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [realTimeDisasters, setRealTimeDisasters] = useState([]);
    const [showRealTime, setShowRealTime] = useState(true);
    // ... just the key state

    // Data fetching (organized)
    const fetchDisasters = async () => { ... }
    const fetchRealTimeDisasters = async () => { ... }
    const fetchStats = async () => { ... }

    // Initialization
    useEffect(() => { ... })

    // Rendering - clean and organized
    return (
        <div className="map-dashboard">
            {/* Header section */}
            <div className="content-header">...</div>

            {/* Delegated to sub-components */}
            <RealTimeControls {...props} />
            <CategoryFilter {...props} />
            <MapLegend {...props} />

            {/* Map section */}
            <MapContainer>...</MapContainer>
        </div>
    )
}

// RealTimeControls.js (~65 lines - single purpose)
export default function RealTimeControls({ showRealTime, onToggleRealTime, ... }) {
    return (
        <div className="realtime-controls">
            <label className="realtime-toggle">
                <input 
                    type="checkbox" 
                    checked={showRealTime} 
                    onChange={(e) => onToggleRealTime(e.target.checked)}
                />
                • Live Global Disasters
            </label>
            {showRealTime && (
                <div className="realtime-info">
                    {/* Controls and status */}
                </div>
            )}
        </div>
    )
}

// CategoryFilter.js (~40 lines - single purpose)
export default function CategoryFilter({ selectedCategory, onCategoryChange }) {
    const categories = [/* ... */];
    return (
        <div className="category-filter">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => onCategoryChange(cat.id)}
                >
                    {cat.emoji}
                </button>
            ))}
        </div>
    )
}

// mapHelpers.js (~95 lines - pure utilities)
export const DISASTER_EMOJIS = { ... }
export const SEVERITY_COLORS = { ... }
export const createMarkerIcon = (category, severity) => { ... }
export const filterDisasters = (disasters, category) => { ... }
export const combinedisasters = (...) => { ... }
// etc.
```

**Benefits**:
- ✅ Each file ~65-95 lines (easy to read)
- ✅ Find code quickly by filename
- ✅ Modify one component without affecting others
- ✅ Can reuse sub-components elsewhere
- ✅ Easy to test individual components
- ✅ Clear separation of concerns

---

## Example 4: Real-Time Controls

### ❌ BEFORE (Inline in MapDashboard JSX)
```javascript
// Lines 250-290 of old MapDashboard.js
return (
    <div className="map-dashboard">
        {/* ... header ... */}

        {/* Real-time controls - 40+ lines of JSX */}
        <div className="realtime-controls">
            <div className="realtime-status">
                <label className="realtime-toggle">
                    <input 
                        type="checkbox" 
                        checked={showRealTime} 
                        onChange={(e) => setShowRealTime(e.target.checked)}
                    />
                    <span className="toggle-label">🌍 Live Global Disasters</span>
                </label>
                
                {showRealTime && (
                    <div className="realtime-info">
                        <span className={`update-indicator ${realTimeLoading ? 'loading' : 'ready'}`}>
                            {realTimeLoading ? '⏳ Updating...' : '🟢 Live'}
                        </span>
                        {lastUpdateTime && (
                            <span className="update-time">
                                Last update: {lastUpdateTime.toLocaleTimeString()}
                            </span>
                        )}
                        <button 
                            className="btn btn-sm btn-primary"
                            onClick={fetchRealTimeDisasters}
                            disabled={realTimeLoading}
                        >
                            🔄 Refresh Now
                        </button>
                    </div>
                )}
            </div>

            {showRealTime && (apiErrors.usgs || apiErrors.eonet) && (
                <div className="api-errors">
                    {/* error messages */}
                </div>
            )}
            
            {showRealTime && realTimeDisasters.length > 0 && (
                <div className="realtime-count">
                    🌍 {realTimeDisasters.length} global disasters detected
                </div>
            )}
        </div>

        {/* ... rest of JSX ... */}
    </div>
)
```

**Problems**:
- ❌ Large block of code mixed with other content
- ❌ Hard to find when scrolling
- ❌ Can't reuse in another page
- ❌ Logic and UI tightly coupled

---

### ✅ AFTER (Extracted to component)
```javascript
// MapDashboard.js - Clean one-liner
return (
    <div className="map-dashboard">
        <div className="content-header">...</div>
        
        {/* Simple component usage */}
        <RealTimeControls
            showRealTime={showRealTime}
            onToggleRealTime={setShowRealTime}
            realTimeLoading={realTimeLoading}
            lastUpdateTime={lastUpdateTime}
            onRefresh={fetchRealTimeDisasters}
            realTimeDisastersCount={realTimeDisasters.length}
            apiErrors={apiErrors}
        />

        {/* Continue with other UI */}
    </div>
)

// RealTimeControls.js - Focused component
export default function RealTimeControls({
    showRealTime,
    onToggleRealTime,
    realTimeLoading,
    lastUpdateTime,
    onRefresh,
    realTimeDisastersCount,
    apiErrors
}) {
    return (
        <div className="realtime-controls">
            <div className="realtime-status">
                <label className="realtime-toggle">
                    <input
                        type="checkbox"
                        checked={showRealTime}
                        onChange={(e) => onToggleRealTime(e.target.checked)}
                    />
                    <span className="toggle-label">🌍 Live Global Disasters</span>
                </label>

                {showRealTime && (
                    <div className="realtime-info">
                        <span className={`update-indicator ${realTimeLoading ? 'loading' : 'ready'}`}>
                            {realTimeLoading ? '⏳ Updating...' : '🟢 Live'}
                        </span>

                        {lastUpdateTime && (
                            <span className="update-time">
                                Last: {lastUpdateTime.toLocaleTimeString()}
                            </span>
                        )}

                        <button
                            className="btn btn-sm btn-primary"
                            onClick={onRefresh}
                            disabled={realTimeLoading}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                )}
            </div>

            {showRealTime && (apiErrors.usgs || apiErrors.eonet) && (
                <div className="api-errors">
                    {apiErrors.usgs && (
                        <span className="error-tag">⚠️ USGS Earthquakes unavailable</span>
                    )}
                    {apiErrors.eonet && (
                        <span className="error-tag">⚠️ NASA Events unavailable</span>
                    )}
                </div>
            )}

            {showRealTime && realTimeDisastersCount > 0 && (
                <div className="realtime-count">
                    🌍 {realTimeDisastersCount} global disasters detected
                </div>
            )}
        </div>
    );
}
```

**Benefits**:
- ✅ RealTimeControls is now reusable
- ✅ MapDashboard is much cleaner
- ✅ Can test RealTimeControls independently
- ✅ Can use in other dashboards/pages
- ✅ Props clearly show what data it needs

---

## Summary of Improvements

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Main component size** | 400+ lines | 200 lines | 50% smaller |
| **Files** | 1 large file | 5 focused files | Organized |
| **Reusability** | None | High | Can reuse helpers & components |
| **Testability** | Medium | High | Can test functions separately |
| **Readability** | Low | High | Clear, commented code |
| **Maintainability** | Difficult | Easy | Find & fix quickly |
| **Code duplication** | High | Low | One source of truth |

## Key Takeaway

**Before**: "One big file that does everything"
**After**: "Small files that each do one thing well"

This is the principle of **Single Responsibility** - a core programming best practice used in professional software development worldwide.

