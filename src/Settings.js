import React from 'react';
import './Settings.css';

const Settings = ({ settings, onSettingsChange, onBack }) => {
    const handleToggle = (setting) => {
        onSettingsChange({
            ...settings,
            [setting]: !settings[setting]
        });
    };

    return (
        <div className="settings-container">
            <h1>⚙️ Settings</h1>
            <p>Customize your flashcard experience</p>

            <div className="settings-list">
                <div className="setting-item">
                    <div className="setting-info">
                        <h3>🌙 Dark Mode</h3>
                        <p>Switch between light and dark theme</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.darkMode}
                            onChange={() => handleToggle('darkMode')}
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <h3>🔄 Invert Swipe Controls</h3>
                        <p>
                            {settings.invertSwipe
                                ? 'Swipe LEFT = ✓ Correct | Swipe RIGHT = ✗ Incorrect'
                                : 'Swipe RIGHT = ✓ Correct | Swipe LEFT = ✗ Incorrect'}
                        </p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.invertSwipe}
                            onChange={() => handleToggle('invertSwipe')}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>

            <button onClick={onBack} className="back-button">← Back to Menu</button>
        </div>
    );
};

export default Settings;
