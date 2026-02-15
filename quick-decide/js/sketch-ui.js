/* ============================================
   Quick, Decide! — rough.js Sketch UI Helpers
   ============================================ */

var SketchUI = {
    drawTimerRing: function(canvas, progress, warning) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        var rc = rough.canvas(canvas);
        var cx = w / 2;
        var cy = h / 2;
        var r = (Math.min(w, h) / 2) - 4;

        // Background ring
        rc.circle(cx, cy, r * 2, {
            stroke: CONFIG.COLORS.softGray,
            strokeWidth: 2,
            roughness: 1.2,
            fill: 'none'
        });

        // Progress arc
        if (progress > 0) {
            var startAngle = -Math.PI / 2;
            var endAngle = startAngle + (Math.PI * 2 * progress);
            var color = warning ? CONFIG.COLORS.eraserPink : CONFIG.COLORS.inkBlue;

            rc.arc(cx, cy, r * 2, r * 2, startAngle, endAngle, false, {
                stroke: color,
                strokeWidth: 3,
                roughness: 0.8
            });
        }
    },

    drawNeuronDiagram: function(canvas, data) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (!data) return;

        var rc = rough.canvas(canvas);
        var inputCount = Math.min(data.inputValues.length, 6);
        var hasNames = data.featureNames && data.featureNames.length > 0;
        var inputX = hasNames ? 120 : 70;
        var neuronX = w / 2 + (hasNames ? 20 : 0);
        var outputX = w - 60;
        var spacing = h / (inputCount + 1);

        // Draw input nodes
        for (var i = 0; i < inputCount; i++) {
            var iy = spacing * (i + 1);
            var val = data.inputValues[i].toFixed(2);
            var featureName = (data.featureNames && data.featureNames[i])
                ? data.featureNames[i]
                : 'x' + i;

            rc.circle(inputX, iy, 28, {
                stroke: CONFIG.COLORS.charcoal,
                strokeWidth: 1.5,
                roughness: 1.5,
                fill: CONFIG.COLORS.paperLines,
                fillStyle: 'solid'
            });

            // Label — show feature name to the left, value inside
            ctx.font = '9px "Architects Daughter", monospace';
            ctx.fillStyle = CONFIG.COLORS.charcoal;
            ctx.textAlign = 'right';
            ctx.fillText(featureName, inputX - 18, iy + 3);
            ctx.textAlign = 'center';
            ctx.font = '10px "Architects Daughter", monospace';
            ctx.fillStyle = CONFIG.COLORS.inkBlue;
            ctx.fillText(val, inputX, iy + 3);

            // Connection line to neuron
            var wt = data.weights[i];
            var lineColor = wt >= 0 ? CONFIG.COLORS.inkBlue : CONFIG.COLORS.eraserPink;
            var lineWidth = Math.min(Math.abs(wt) * 2 + 0.5, 4);

            rc.line(inputX + 16, iy, neuronX - 28, h / 2, {
                stroke: lineColor,
                strokeWidth: lineWidth,
                roughness: 1
            });

            // Weight label on line
            var midX = (inputX + 16 + neuronX - 28) / 2;
            var midY = (iy + h / 2) / 2;
            ctx.font = '9px "Architects Daughter", monospace';
            ctx.fillStyle = lineColor;
            ctx.textAlign = 'center';
            ctx.fillText('w=' + wt.toFixed(2), midX + 10, midY - 3);
        }

        // Draw neuron (center circle)
        rc.circle(neuronX, h / 2, 56, {
            stroke: CONFIG.COLORS.charcoal,
            strokeWidth: 2,
            roughness: 1.5,
            fill: CONFIG.COLORS.highlightYellow + '40',
            fillStyle: 'solid'
        });

        ctx.font = 'bold 12px "Architects Daughter", monospace';
        ctx.fillStyle = CONFIG.COLORS.charcoal;
        ctx.textAlign = 'center';
        ctx.fillText('Σ + b', neuronX, h / 2 - 6);
        ctx.font = '11px "Architects Daughter", monospace';
        ctx.fillText('z=' + data.zValue.toFixed(2), neuronX, h / 2 + 10);

        // Connection to output
        rc.line(neuronX + 30, h / 2, outputX - 24, h / 2, {
            stroke: CONFIG.COLORS.charcoal,
            strokeWidth: 2,
            roughness: 1
        });

        // σ label on connection
        ctx.font = 'bold 13px "Architects Daughter", monospace';
        ctx.fillStyle = CONFIG.COLORS.inkBlue;
        ctx.fillText('σ', (neuronX + 30 + outputX - 24) / 2, h / 2 - 8);

        // Draw output node
        var outColor = data.sigmoidOutput > 0.5
            ? CONFIG.COLORS.correctGreen + '60'
            : CONFIG.COLORS.eraserPink + '40';

        rc.circle(outputX, h / 2, 44, {
            stroke: CONFIG.COLORS.charcoal,
            strokeWidth: 2,
            roughness: 1.5,
            fill: outColor,
            fillStyle: 'solid'
        });

        ctx.font = 'bold 14px "Architects Daughter", monospace';
        ctx.fillStyle = CONFIG.COLORS.charcoal;
        ctx.fillText(data.sigmoidOutput.toFixed(2), outputX, h / 2 + 4);
    },

    drawSigmoidCurve: function(canvas, z, output) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        var rc = rough.canvas(canvas);
        var pad = 20;
        var plotW = w - pad * 2;
        var plotH = h - pad * 2;

        // Axes
        rc.line(pad, h - pad, w - pad, h - pad, {
            stroke: CONFIG.COLORS.softGray, roughness: 1, strokeWidth: 1
        });
        rc.line(pad, pad, pad, h - pad, {
            stroke: CONFIG.COLORS.softGray, roughness: 1, strokeWidth: 1
        });

        // Axis labels
        ctx.font = '9px "Architects Daughter", monospace';
        ctx.fillStyle = CONFIG.COLORS.softGray;
        ctx.textAlign = 'center';
        ctx.fillText('z', w - 10, h - pad + 14);
        ctx.fillText('σ(z)', pad, pad - 6);
        ctx.fillText('0', pad - 8, h - pad + 4);
        ctx.fillText('1', pad - 8, pad + 4);

        // Draw sigmoid curve as a set of rough line segments
        var zMin = -6;
        var zMax = 6;
        var points = [];
        for (var zi = zMin; zi <= zMax; zi += 0.3) {
            var sig = 1 / (1 + Math.exp(-zi));
            var px = pad + ((zi - zMin) / (zMax - zMin)) * plotW;
            var py = (h - pad) - sig * plotH;
            points.push([px, py]);
        }

        for (var i = 0; i < points.length - 1; i++) {
            rc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], {
                stroke: CONFIG.COLORS.inkBlue,
                strokeWidth: 2,
                roughness: 0.6
            });
        }

        // Marker at current z
        var clampedZ = Math.max(zMin, Math.min(zMax, z));
        var markerX = pad + ((clampedZ - zMin) / (zMax - zMin)) * plotW;
        var markerY = (h - pad) - output * plotH;

        rc.circle(markerX, markerY, 10, {
            stroke: CONFIG.COLORS.highlightYellow,
            strokeWidth: 2,
            roughness: 1,
            fill: CONFIG.COLORS.highlightYellow,
            fillStyle: 'solid'
        });
    }
};
