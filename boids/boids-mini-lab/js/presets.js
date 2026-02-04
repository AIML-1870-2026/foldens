// ===== Presets Manager - Save/Load/Export with URL Query Support =====

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

    // Generate URL query string from config
    configToQueryString(config) {
        const params = new URLSearchParams();

        // Behavior params (short names for URL)
        if (config.behavior) {
            if (config.behavior.separation !== undefined) params.set('sep', config.behavior.separation);
            if (config.behavior.alignment !== undefined) params.set('ali', config.behavior.alignment);
            if (config.behavior.cohesion !== undefined) params.set('coh', config.behavior.cohesion);
            if (config.behavior.maxSpeed !== undefined) params.set('spd', config.behavior.maxSpeed);
            if (config.behavior.neighborRadius !== undefined) params.set('rad', config.behavior.neighborRadius);
            if (config.behavior.perceptionAngle !== undefined) params.set('ang', config.behavior.perceptionAngle);
        }

        // Simulation params
        if (config.simulation) {
            if (config.simulation.boidCount !== undefined) params.set('cnt', config.simulation.boidCount);
            if (config.simulation.speciesCount !== undefined) params.set('spc', config.simulation.speciesCount);
            if (config.simulation.boundaryMode !== undefined) params.set('bnd', config.simulation.boundaryMode);
        }

        // Shepherd params
        if (config.shepherd) {
            if (config.shepherd.mode !== undefined) params.set('shp', config.shepherd.mode);
            if (config.shepherd.radius !== undefined) params.set('shr', config.shepherd.radius);
        }

        // Display params
        if (config.display) {
            if (config.display.theme !== undefined) params.set('thm', config.display.theme);
            if (config.display.trailOpacity !== undefined) params.set('trl', config.display.trailOpacity);
            if (config.display.palette !== undefined) params.set('pal', config.display.palette);
        }

        return params.toString();
    }

    // Parse URL query string to config
    queryStringToConfig(queryString) {
        const params = new URLSearchParams(queryString);
        const config = {
            version: '1.0',
            behavior: {},
            simulation: {},
            shepherd: {},
            display: {}
        };

        // Behavior params
        if (params.has('sep')) config.behavior.separation = parseFloat(params.get('sep'));
        if (params.has('ali')) config.behavior.alignment = parseFloat(params.get('ali'));
        if (params.has('coh')) config.behavior.cohesion = parseFloat(params.get('coh'));
        if (params.has('spd')) config.behavior.maxSpeed = parseFloat(params.get('spd'));
        if (params.has('rad')) config.behavior.neighborRadius = parseInt(params.get('rad'));
        if (params.has('ang')) config.behavior.perceptionAngle = parseInt(params.get('ang'));

        // Simulation params
        if (params.has('cnt')) config.simulation.boidCount = parseInt(params.get('cnt'));
        if (params.has('spc')) config.simulation.speciesCount = parseInt(params.get('spc'));
        if (params.has('bnd')) config.simulation.boundaryMode = params.get('bnd');

        // Shepherd params
        if (params.has('shp')) config.shepherd.mode = params.get('shp');
        if (params.has('shr')) config.shepherd.radius = parseInt(params.get('shr'));

        // Display params
        if (params.has('thm')) config.display.theme = params.get('thm');
        if (params.has('trl')) config.display.trailOpacity = parseFloat(params.get('trl'));
        if (params.has('pal')) config.display.palette = params.get('pal');

        return config;
    }

    // Get shareable URL for current config
    getShareableURL(config) {
        const queryString = this.configToQueryString(config);
        const baseURL = window.location.href.split('?')[0];
        return `${baseURL}?${queryString}`;
    }

    // Check if URL has config params and return config if so
    getConfigFromURL() {
        const queryString = window.location.search;
        if (!queryString || queryString.length <= 1) return null;

        try {
            const config = this.queryStringToConfig(queryString);

            // Check if any params were actually set
            const hasParams = Object.values(config.behavior).length > 0 ||
                             Object.values(config.simulation).length > 0 ||
                             Object.values(config.shepherd).length > 0 ||
                             Object.values(config.display).length > 0;

            return hasParams ? config : null;
        } catch (e) {
            console.warn('Failed to parse URL config:', e);
            return null;
        }
    }

    // Copy shareable URL to clipboard
    copyShareableURL(config) {
        const url = this.getShareableURL(config);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
                .then(() => console.log('URL copied to clipboard'))
                .catch(err => console.error('Failed to copy URL:', err));
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                console.log('URL copied to clipboard (fallback)');
            } catch (err) {
                console.error('Failed to copy URL:', err);
            }
            document.body.removeChild(textArea);
        }

        return url;
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
