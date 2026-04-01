/**
 * Category Filter Component
 * Allows users to filter disasters by category
 */

import React from 'react';

export default function CategoryFilter({
    selectedCategory,
    onCategoryChange,
    showRealTime
}) {
    const categories = [
        { id: 'all', label: '📍 All Disasters', emoji: '📍' },
        { id: 'flood', label: '🌊 Floods', emoji: '🌊' },
        { id: 'fire', label: '🔥 Wildfires', emoji: '🔥' },
        { id: 'earthquake', label: '📍 Earthquakes', emoji: '📍' },
        { id: 'storm', label: '⛈️ Storms', emoji: '⛈️' },
        { id: 'volcano', label: '🌋 Volcanoes', emoji: '🌋' },
        { id: 'tsunami', label: '🌊 Tsunamis', emoji: '🌊' },
        { id: 'landslide', label: '⛰️ Landslides', emoji: '⛰️' },
    ];

    return (
        <div className="category-filter">
            <label className="filter-label">Filter by Category:</label>
            <div className="filter-buttons">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => onCategoryChange(cat.id)}
                        title={cat.label}
                    >
                        {cat.emoji} {cat.id !== 'all' && cat.id}
                    </button>
                ))}
            </div>
        </div>
    );
}
