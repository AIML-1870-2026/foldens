// ===== Boids Mini-Lab Configuration =====

const CONFIG = {
    // Canvas settings
    canvas: {
        aspectRatio: 16 / 9,
        minWidth: 800,
        minHeight: 450
    },

    // Simulation defaults
    simulation: {
        boidCount: 100,
        boundaryMode: 'wrap', // 'wrap' or 'bounce'
        speciesCount: 2
    },

    // Behavior defaults
    behavior: {
        separation: 1.5,
        alignment: 1.0,
        cohesion: 1.0,
        maxSpeed: 4,
        maxForce: 0.1, // Maximum steering force
        neighborRadius: 50,
        perceptionAngle: 270 // degrees
    },

    // Shepherd (mouse) defaults
    shepherd: {
        mode: 'repel', // 'repel', 'attract', 'neutral'
        radius: 100,
        strength: 2.0
    },

    // Display defaults
    display: {
        theme: 'nature', // 'nature' or 'minimal'
        trailOpacity: 0.05, // 0 to 0.5
        quadtreeVisualization: 'off' // 'off', 'grid', 'active', 'heatmap'
    },

    // Boid visual properties
    boid: {
        baseSize: 8,
        speedElongation: 0.3 // How much faster boids stretch
    },

    // Quadtree settings
    quadtree: {
        maxBoidsPerNode: 10,
        maxDepth: 8
    },

    // Color palettes
    palettes: {
        warm: {
            name: 'Warm',
            colors: ['#FF6B6B', '#FFE66D', '#FDA085'], // Coral, Amber, Peach
            speciesNames: ['Coral', 'Amber', 'Peach']
        },
        cool: {
            name: 'Cool',
            colors: ['#4ECDC4', '#6C5CE7', '#74B9FF'], // Teal, Indigo, Sky
            speciesNames: ['Teal', 'Indigo', 'Sky']
        },
        colorblind: {
            name: 'Colorblind-Friendly',
            colors: ['#0066CC', '#FF9900'], // Blue, Orange
            speciesNames: ['Blue', 'Orange']
        }
    },

    // Species shapes
    shapes: ['bird', 'fish', 'arrow'],

    // Theme colors
    themes: {
        nature: {
            background: '#0a1628',
            trailOverlay: 'rgba(10, 22, 40, '
        },
        minimal: {
            background: '#f5f5f5',
            trailOverlay: 'rgba(245, 245, 245, '
        }
    },

    // Built-in presets
    presets: {
        schooling: {
            name: 'Schooling',
            description: 'Organized, parallel movement like fish',
            behavior: {
                separation: 1.5,
                alignment: 2.5,
                cohesion: 1.5,
                maxSpeed: 4,
                neighborRadius: 60,
                perceptionAngle: 270
            }
        },
        chaoticSwarm: {
            name: 'Chaotic Swarm',
            description: 'Disorganized, buzzing motion',
            behavior: {
                separation: 1.0,
                alignment: 0.5,
                cohesion: 0.5,
                maxSpeed: 5,
                neighborRadius: 30,
                perceptionAngle: 360
            }
        },
        tightCluster: {
            name: 'Tight Cluster',
            description: 'Dense, cohesive groups like starlings',
            behavior: {
                separation: 1.0,
                alignment: 1.0,
                cohesion: 3.0,
                maxSpeed: 3,
                neighborRadius: 80,
                perceptionAngle: 270
            }
        }
    },

    // Slider ranges
    sliders: {
        boidCount: { min: 10, max: 2000, step: 10 },
        separation: { min: 0, max: 5, step: 0.1 },
        alignment: { min: 0, max: 5, step: 0.1 },
        cohesion: { min: 0, max: 5, step: 0.1 },
        maxSpeed: { min: 1, max: 10, step: 0.5 },
        neighborRadius: { min: 20, max: 150, step: 5 },
        perceptionAngle: { min: 180, max: 360, step: 10 },
        shepherdRadius: { min: 50, max: 200, step: 10 },
        trailOpacity: { min: 0, max: 50, step: 1 }
    },

    // Tooltips
    tooltips: {
        separation: 'How strongly boids avoid crowding. Higher = more personal space.',
        alignment: 'How strongly boids match their neighbors\' direction. Higher = more uniform movement.',
        cohesion: 'How strongly boids stick together. Higher = tighter groups.',
        maxSpeed: 'The maximum speed a boid can travel.',
        neighborRadius: 'How far each boid can see other boids.',
        perceptionAngle: 'The field of view angle. 360° = can see all around.',
        shepherdRadius: 'The area of influence around the mouse cursor.',
        trailOpacity: 'How long trails persist. 0% = no trails, higher = longer trails.'
    }
};

// Export config for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
