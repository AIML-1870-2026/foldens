// ===== UI Controller - Sidebar and Controls =====

class UI {
    constructor(simulation) {
        this.simulation = simulation;

        // Initialize all UI components
        this.setupSidebarCollapse();
        this.setupSliders();
        this.setupButtons();
        this.setupThemeToggle();
        this.setupSpeciesControls();
        this.setupShepherdControls();
        this.setupPresetButtons();
        this.setupExportImport();
        this.setupTooltips();

        // Initial sync from config
        this.syncFromConfig();
    }

    // Setup sidebar collapse functionality
    setupSidebarCollapse() {
        const sidebar = document.getElementById('sidebar');
        const collapseBtn = document.getElementById('collapse-btn');

        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');

                // Update button text
                collapseBtn.textContent = sidebar.classList.contains('collapsed') ? '\u00bb' : '\u00ab';

                // Trigger canvas resize
                setTimeout(() => {
                    this.simulation.resizeCanvas();
                }, 310); // After CSS transition
            });
        }
    }

    // Setup all slider controls
    setupSliders() {
        // Boid count
        this.setupSlider('boid-count', (value) => {
            this.simulation.setBoidCount(parseInt(value));
        });

        // Behavior sliders
        this.setupSlider('separation', (value) => {
            CONFIG.behavior.separation = parseFloat(value);
        });

        this.setupSlider('alignment', (value) => {
            CONFIG.behavior.alignment = parseFloat(value);
        });

        this.setupSlider('cohesion', (value) => {
            CONFIG.behavior.cohesion = parseFloat(value);
        });

        this.setupSlider('max-speed', (value) => {
            CONFIG.behavior.maxSpeed = parseFloat(value);
        });

        this.setupSlider('neighbor-radius', (value) => {
            CONFIG.behavior.neighborRadius = parseInt(value);
            this.simulation.flock.perceptionRadius = parseInt(value);
        });

        this.setupSlider('perception-angle', (value) => {
            CONFIG.behavior.perceptionAngle = parseInt(value);
            this.simulation.flock.perceptionAngle = parseInt(value);
        }, '\u00b0'); // Degree symbol suffix

        // Shepherd radius
        this.setupSlider('shepherd-radius', (value) => {
            this.simulation.shepherd.setRadius(parseInt(value));
        });

        // Trail opacity
        this.setupSlider('trail-opacity', (value) => {
            const opacity = parseInt(value) / 100;
            this.simulation.renderer.setTrailOpacity(opacity);
        }, '%');
    }

    // Helper to setup a single slider
    setupSlider(id, onChange, valueSuffix = '') {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(`${id}-value`);

        if (!slider) return;

        const updateValue = () => {
            if (valueDisplay) {
                valueDisplay.textContent = slider.value + valueSuffix;
            }
            onChange(slider.value);
        };

        slider.addEventListener('input', updateValue);
    }

    // Setup button controls
    setupButtons() {
        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.simulation.togglePause();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.simulation.reset();
            });
        }
    }

    // Update play/pause button text
    updatePlayPauseButton() {
        const btn = document.getElementById('play-pause-btn');
        if (btn) {
            btn.textContent = this.simulation.running ? 'Pause' : 'Play';
        }
    }

    // Setup theme toggle
    setupThemeToggle() {
        const natureBtn = document.getElementById('theme-nature');
        const minimalBtn = document.getElementById('theme-minimal');
        const appElement = document.getElementById('app');

        if (natureBtn && minimalBtn) {
            natureBtn.addEventListener('click', () => {
                appElement.className = 'theme-nature';
                this.simulation.renderer.setTheme('nature');
                natureBtn.classList.add('active');
                minimalBtn.classList.remove('active');
            });

            minimalBtn.addEventListener('click', () => {
                appElement.className = 'theme-minimal';
                this.simulation.renderer.setTheme('minimal');
                minimalBtn.classList.add('active');
                natureBtn.classList.remove('active');
            });
        }

        // Quadtree visualization dropdown
        const quadtreeViz = document.getElementById('quadtree-viz');
        if (quadtreeViz) {
            quadtreeViz.addEventListener('change', () => {
                this.simulation.renderer.setQuadtreeVisualization(quadtreeViz.value);
            });
        }
    }

    // Setup species controls
    setupSpeciesControls() {
        // Species count buttons
        const speciesBtns = document.querySelectorAll('.species-btn');
        speciesBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const count = parseInt(btn.dataset.count);
                this.simulation.flock.setSpeciesCount(count);

                // Update active state
                speciesBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Palette toggle
        const warmBtn = document.getElementById('palette-warm');
        const coolBtn = document.getElementById('palette-cool');

        if (warmBtn && coolBtn) {
            warmBtn.addEventListener('click', () => {
                this.simulation.renderer.setPalette('warm');
                warmBtn.classList.add('active');
                coolBtn.classList.remove('active');
            });

            coolBtn.addEventListener('click', () => {
                this.simulation.renderer.setPalette('cool');
                coolBtn.classList.add('active');
                warmBtn.classList.remove('active');
            });
        }
    }

    // Setup shepherd controls
    setupShepherdControls() {
        const shepherdBtns = document.querySelectorAll('.shepherd-btn');

        shepherdBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.simulation.shepherd.setMode(mode);

                // Update active state
                shepherdBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // Setup preset buttons
    setupPresetButtons() {
        // Built-in presets
        const schoolingBtn = document.getElementById('preset-schooling');
        const swarmBtn = document.getElementById('preset-swarm');
        const clusterBtn = document.getElementById('preset-cluster');

        if (schoolingBtn) {
            schoolingBtn.addEventListener('click', () => {
                this.simulation.applyPreset('schooling');
            });
        }

        if (swarmBtn) {
            swarmBtn.addEventListener('click', () => {
                this.simulation.applyPreset('chaoticSwarm');
            });
        }

        if (clusterBtn) {
            clusterBtn.addEventListener('click', () => {
                this.simulation.applyPreset('tightCluster');
            });
        }

        // Save preset button
        const saveBtn = document.getElementById('save-preset-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const name = prompt('Enter preset name:');
                if (name && name.trim()) {
                    const config = this.simulation.getConfig();
                    this.simulation.presets.savePreset(name.trim(), config);
                    alert(`Preset "${name}" saved!`);
                }
            });
        }

        // Load preset button
        const loadBtn = document.getElementById('load-preset-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                const presetNames = this.simulation.presets.getCustomPresets();

                if (presetNames.length === 0) {
                    alert('No saved presets. Use "Save" to create one first.');
                    return;
                }

                const list = presetNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
                const choice = prompt(`Choose a preset (enter number):\n\n${list}`);

                if (choice) {
                    const index = parseInt(choice) - 1;
                    if (index >= 0 && index < presetNames.length) {
                        const preset = this.simulation.presets.getPreset(presetNames[index]);
                        if (preset) {
                            this.simulation.loadConfig(preset);
                            alert(`Preset "${presetNames[index]}" loaded!`);
                        }
                    }
                }
            });
        }
    }

    // Setup export/import functionality
    setupExportImport() {
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const importFile = document.getElementById('import-file');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const config = this.simulation.getConfig();
                this.simulation.presets.exportToFile(config);
            });
        }

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });

            importFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const config = await this.simulation.presets.importFromFile(file);
                    const success = this.simulation.loadConfig(config);

                    if (success) {
                        alert('Configuration imported successfully!');
                    } else {
                        alert('Failed to apply configuration.');
                    }
                } catch (err) {
                    alert('Import error: ' + err.message);
                }

                // Reset file input
                importFile.value = '';
            });
        }
    }

    // Setup tooltips
    setupTooltips() {
        const tooltipData = {
            'separation': CONFIG.tooltips.separation,
            'alignment': CONFIG.tooltips.alignment,
            'cohesion': CONFIG.tooltips.cohesion,
            'max-speed': CONFIG.tooltips.maxSpeed,
            'neighbor-radius': CONFIG.tooltips.neighborRadius,
            'perception-angle': CONFIG.tooltips.perceptionAngle,
            'shepherd-radius': CONFIG.tooltips.shepherdRadius,
            'trail-opacity': CONFIG.tooltips.trailOpacity
        };

        for (const [id, tooltip] of Object.entries(tooltipData)) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) {
                label.setAttribute('data-tooltip', tooltip);
                label.style.cursor = 'help';
            }
        }
    }

    // Sync UI from current CONFIG values
    syncFromConfig() {
        // Sync sliders
        this.syncSlider('boid-count', this.simulation.flock.boids.length);
        this.syncSlider('separation', CONFIG.behavior.separation);
        this.syncSlider('alignment', CONFIG.behavior.alignment);
        this.syncSlider('cohesion', CONFIG.behavior.cohesion);
        this.syncSlider('max-speed', CONFIG.behavior.maxSpeed);
        this.syncSlider('neighbor-radius', CONFIG.behavior.neighborRadius);
        this.syncSlider('perception-angle', CONFIG.behavior.perceptionAngle, '\u00b0');
        this.syncSlider('shepherd-radius', this.simulation.shepherd.radius);
        this.syncSlider('trail-opacity', Math.round(this.simulation.renderer.trailOpacity * 100), '%');

        // Sync species count buttons
        const speciesBtns = document.querySelectorAll('.species-btn');
        speciesBtns.forEach(btn => {
            const count = parseInt(btn.dataset.count);
            btn.classList.toggle('active', count === this.simulation.flock.speciesCount);
        });

        // Sync shepherd mode buttons
        const shepherdBtns = document.querySelectorAll('.shepherd-btn');
        shepherdBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.simulation.shepherd.mode);
        });

        // Sync theme buttons
        const natureBtn = document.getElementById('theme-nature');
        const minimalBtn = document.getElementById('theme-minimal');
        if (natureBtn && minimalBtn) {
            natureBtn.classList.toggle('active', this.simulation.renderer.theme === 'nature');
            minimalBtn.classList.toggle('active', this.simulation.renderer.theme === 'minimal');
        }

        // Sync palette buttons
        const warmBtn = document.getElementById('palette-warm');
        const coolBtn = document.getElementById('palette-cool');
        if (warmBtn && coolBtn) {
            warmBtn.classList.toggle('active', this.simulation.renderer.palette === 'warm');
            coolBtn.classList.toggle('active', this.simulation.renderer.palette === 'cool');
        }

        // Sync quadtree dropdown
        const quadtreeViz = document.getElementById('quadtree-viz');
        if (quadtreeViz) {
            quadtreeViz.value = this.simulation.renderer.quadtreeVisualization;
        }

        // Update play/pause button
        this.updatePlayPauseButton();
    }

    // Helper to sync a single slider
    syncSlider(id, value, suffix = '') {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(`${id}-value`);

        if (slider) {
            slider.value = value;
        }
        if (valueDisplay) {
            valueDisplay.textContent = value + suffix;
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
