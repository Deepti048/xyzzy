/**
 * Map Legend Component
 * Shows the meaning of colors and icons on the map
 */

import React from 'react';
import { DISASTER_EMOJIS, SEVERITY_COLORS } from './mapHelpers';

export default function MapLegend({ showRealTime }) {
    return (
        <div className="map-legend">
            <h4>📋 Legend</h4>

            {/* Severity colors */}
            <div className="legend-section">
                <h5>Severity Levels:</h5>
                <div className="legend-items">
                    {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
                        <div key={severity} className="legend-item">
                            <span
                                className="legend-color"
                                style={{ backgroundColor: color }}
                            ></span>
                            <span className="legend-label">
                                {severity.charAt(0).toUpperCase() + severity.slice(1)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Disaster types */}
            <div className="legend-section">
                <h5>Disaster Types:</h5>
                <div className="legend-items">
                    {Object.entries(DISASTER_EMOJIS).slice(0, 6).map(([type, emoji]) => (
                        <div key={type} className="legend-item">
                            <span className="legend-emoji">{emoji}</span>
                            <span className="legend-label">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data sources info */}
            <div className="legend-section">
                <h5>Data Sources:</h5>
                <ul className="sources-list">
                    <li>🏢 Database: Local disaster reports</li>
                    {showRealTime && (
                        <>
                            <li>🌍 USGS: Real-time earthquakes</li>
                            <li>🛰️ NASA: Global events (fires, storms, etc)</li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}
