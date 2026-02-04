// ===== Presets Manager - Save/Load/Export =====

class Presets {
    constructor() {
        this.storageKey = 'boids-mini-lab-presets';
        this.customPresets = this.loadFromStorage();
    }

    // Get all built-in preset names
    getBuiltInPresets() {
        return Object.keys(CONFIG.presets);
    }

    // Get all custom preset names
    getCustomPresets() {
        return Object.keys(this.customPresets);
    }

    // Get a preset by name (checks built-in first, then custom)
    getPreset(name) {
        // Check built-in presets
        if (CONFIG.presets[name]) {
            return { ...CONFIG.presets[name], isBuiltIn: true };
        }

        // Check custom presets
        if (this.customPresets[name]) {
            return { ...this.customPresets[name], isBuiltIn: false };
        }

        return null;
    }

    // Save current state as a custom preset
    savePreset(name, config) {
        const preset = {
            name: name,
            savedAt: new Date().toISOString(),
            behavior: { ...config.behavior },
            simulation: { ...config.simulation },
            shepherd: { ...config.shepherd },
            display: { ...config.display }
        };

        this.customPresets[name] = preset;
        this.saveToStorage();

        return preset;
    }

    // Delete a custom preset
    deletePreset(name) {
        if (this.customPresets[name]) {
            delete this.customPresets[name];
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Rename a custom preset
    renamePreset(oldName, newName) {
        if (this.customPresets[oldName] && !this.customPresets[newName]) {
            this.customPresets[newName] = this.customPresets[oldName];
            this.customPresets[newName].name = newName;
            delete this.customPresets[oldName];
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Load presets from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load presets from storage:', e);
        }
        return {};
    }

    // Save presets to localStorage
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.customPresets));
        } catch (e) {
            console.warn('Failed to save presets to storage:', e);
        }
    }

    // Export config as JSON file
    exportToFile(config, filename = 'boids-config.json') {
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            ...config
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    // Import config from JSON file
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);

                    // Validate basic structure
                    if (!config.version) {
                        reject(new Error('Invalid config file: missing version'));
                        return;
                    }

                    resolve(config);
                } catch (err) {
                    reject(new Error('Failed to parse JSON: ' + err.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    // Clear all custom presets
    clearAll() {
        this.customPresets = {};
        this.saveToStorage();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Presets;
}
