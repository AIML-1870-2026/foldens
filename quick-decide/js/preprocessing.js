/* ============================================
   Quick, Decide! — Canvas → Tensor Preprocessing
   ============================================ */

var Preprocessor = {
    // Offscreen canvases
    _cleanCanvas: null,
    _cleanCtx: null,
    _offscreen: null,
    _offCtx: null,

    init: function() {
        // Clean canvas: redraw strokes on pure white (same size as drawing canvas)
        this._cleanCanvas = document.createElement('canvas');
        this._cleanCanvas.width = CONFIG.CANVAS_SIZE;
        this._cleanCanvas.height = CONFIG.CANVAS_SIZE;
        this._cleanCtx = this._cleanCanvas.getContext('2d', { willReadFrequently: true });

        // Offscreen canvas: 28x28 for model input
        this._offscreen = document.createElement('canvas');
        this._offscreen.width = CONFIG.MODEL_INPUT_SIZE;
        this._offscreen.height = CONFIG.MODEL_INPUT_SIZE;
        this._offCtx = this._offscreen.getContext('2d', { willReadFrequently: true });
    },

    canvasToTensor: function(sourceCanvas) {
        if (typeof tf === 'undefined') return null;
        if (!DrawingCanvas.strokes || DrawingCanvas.strokes.length === 0) return null;

        var size = CONFIG.MODEL_INPUT_SIZE; // 28
        var strokes = DrawingCanvas.strokes;

        // Step 1: Compute bounding box from stroke coordinates (not pixels)
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (var s = 0; s < strokes.length; s++) {
            for (var p = 0; p < strokes[s].length; p++) {
                var pt = strokes[s][p];
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
            }
        }

        if (minX >= maxX && minY >= maxY) return null;

        var bboxW = maxX - minX || 1;
        var bboxH = maxY - minY || 1;
        var maxDim = Math.max(bboxW, bboxH);
        var padding = Math.max(maxDim * 0.15, 8);
        var cropSize = maxDim + padding * 2;
        var cx = (minX + maxX) / 2;
        var cy = (minY + maxY) / 2;

        // Step 2: Draw strokes DIRECTLY onto 28×28 canvas with proper stroke width.
        // Previous approach drew at 500×500 then downsampled — 3px strokes became
        // sub-pixel (~0.17px) and the model saw a near-blank image every time.
        // Drawing directly at 28×28 with ~2px strokes matches Quick Draw training data.
        var offCtx = this._offCtx;
        offCtx.clearRect(0, 0, size, size);
        offCtx.fillStyle = '#FFFFFF';
        offCtx.fillRect(0, 0, size, size);

        var scale = (size - 4) / cropSize; // leave ~2px border on each side
        offCtx.strokeStyle = '#000000';
        offCtx.lineWidth = 2; // 2px at 28×28 matches Quick Draw training data
        offCtx.lineCap = 'round';
        offCtx.lineJoin = 'round';

        for (var s2 = 0; s2 < strokes.length; s2++) {
            var stroke = strokes[s2];
            if (stroke.length < 2) continue;
            offCtx.beginPath();
            var x0 = (stroke[0].x - cx) * scale + size / 2;
            var y0 = (stroke[0].y - cy) * scale + size / 2;
            offCtx.moveTo(x0, y0);
            for (var p2 = 1; p2 < stroke.length; p2++) {
                var x = (stroke[p2].x - cx) * scale + size / 2;
                var y = (stroke[p2].y - cy) * scale + size / 2;
                offCtx.lineTo(x, y);
            }
            offCtx.stroke();
        }

        // Step 3: Extract pixels, invert (black strokes → white = high activation)
        var smallData = offCtx.getImageData(0, 0, size, size);
        var input = new Float32Array(size * size);

        for (var i = 0; i < size * size; i++) {
            var gray = smallData.data[i * 4]; // R channel (canvas is grayscale)
            // Invert: black stroke (0) → 1.0, white bg (255) → 0.0
            input[i] = (255 - gray) / 255;
        }

        // Paint debug canvas if available (shows inverted 28×28 model input)
        this.paintDebugCanvas(input, size);

        return tf.tensor4d(input, [1, size, size, 1]);
    },

    paintDebugCanvas: function(inputData, size) {
        var canvas = document.getElementById('model-eye-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var imgData = ctx.createImageData(size, size);
        for (var i = 0; i < size * size; i++) {
            var v = Math.round(inputData[i] * 255); // 1.0=stroke → white, 0.0=bg → black
            imgData.data[i * 4 + 0] = v;
            imgData.data[i * 4 + 1] = v;
            imgData.data[i * 4 + 2] = v;
            imgData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    },

    findBoundingBox: function(imageData, w, h) {
        var data = imageData.data;
        var minX = w, minY = h, maxX = 0, maxY = 0;
        var found = false;
        // On clean white canvas, anything below 250 is a drawn pixel
        var threshold = 250;

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var idx = (y * w + x) * 4;
                if (data[idx] < threshold) {
                    found = true;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (!found) return null;
        return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    },

    // Compute interpretable features from the drawing
    computeDrawingFeatures: function() {
        if (!DrawingCanvas.strokes || DrawingCanvas.strokes.length === 0) return null;

        var strokes = DrawingCanvas.strokes;
        var cw = CONFIG.CANVAS_SIZE;
        var ch = CONFIG.CANVAS_SIZE;

        // --- Feature: Stroke Count ---
        var strokeCount = strokes.length;

        // --- Feature: Total Points (ink amount) ---
        var totalPoints = 0;
        for (var s = 0; s < strokes.length; s++) {
            totalPoints += strokes[s].length;
        }

        // --- Feature: Total Stroke Length ---
        var totalLength = 0;
        for (var s2 = 0; s2 < strokes.length; s2++) {
            var st = strokes[s2];
            for (var p = 1; p < st.length; p++) {
                var dx = st[p].x - st[p - 1].x;
                var dy = st[p].y - st[p - 1].y;
                totalLength += Math.sqrt(dx * dx + dy * dy);
            }
        }

        // --- Feature: Bounding Box Dimensions ---
        var minX = cw, minY = ch, maxX = 0, maxY = 0;
        for (var s3 = 0; s3 < strokes.length; s3++) {
            for (var p2 = 0; p2 < strokes[s3].length; p2++) {
                var pt = strokes[s3][p2];
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
            }
        }
        var bboxW = maxX - minX || 1;
        var bboxH = maxY - minY || 1;

        // --- Feature: Aspect Ratio ---
        var aspectRatio = bboxW / bboxH;

        // --- Feature: Density (stroke length / bbox area) ---
        var bboxArea = bboxW * bboxH;
        var density = totalLength / bboxArea;

        // --- Feature: Curviness (avg angle change between segments) ---
        var totalAngleChange = 0;
        var angleSegments = 0;
        for (var s4 = 0; s4 < strokes.length; s4++) {
            var stk = strokes[s4];
            for (var p3 = 2; p3 < stk.length; p3++) {
                var ax = stk[p3 - 1].x - stk[p3 - 2].x;
                var ay = stk[p3 - 1].y - stk[p3 - 2].y;
                var bx = stk[p3].x - stk[p3 - 1].x;
                var by = stk[p3].y - stk[p3 - 1].y;
                var dot = ax * bx + ay * by;
                var magA = Math.sqrt(ax * ax + ay * ay);
                var magB = Math.sqrt(bx * bx + by * by);
                if (magA > 0.5 && magB > 0.5) {
                    var cosAngle = dot / (magA * magB);
                    cosAngle = Math.max(-1, Math.min(1, cosAngle));
                    totalAngleChange += Math.acos(cosAngle);
                    angleSegments++;
                }
            }
        }
        var curviness = angleSegments > 0 ? totalAngleChange / angleSegments : 0;

        // --- Feature: Horizontal Symmetry ---
        var centerX = (minX + maxX) / 2;
        var leftPoints = 0, rightPoints = 0;
        for (var s5 = 0; s5 < strokes.length; s5++) {
            for (var p4 = 0; p4 < strokes[s5].length; p4++) {
                if (strokes[s5][p4].x < centerX) leftPoints++;
                else rightPoints++;
            }
        }
        var symmetry = 1 - Math.abs(leftPoints - rightPoints) / (leftPoints + rightPoints + 1);

        // --- Feature: Drawing Speed (avg speed across all strokes) ---
        var totalSpeed = 0;
        var speedSegments = 0;
        for (var s6 = 0; s6 < strokes.length; s6++) {
            var stk2 = strokes[s6];
            for (var p5 = 1; p5 < stk2.length; p5++) {
                var dx2 = stk2[p5].x - stk2[p5 - 1].x;
                var dy2 = stk2[p5].y - stk2[p5 - 1].y;
                var dt = stk2[p5].t - stk2[p5 - 1].t;
                if (dt > 0) {
                    totalSpeed += Math.sqrt(dx2 * dx2 + dy2 * dy2) / dt;
                    speedSegments++;
                }
            }
        }
        var avgSpeed = speedSegments > 0 ? totalSpeed / speedSegments : 0;

        // Normalize all features to roughly [0, 1]
        return [
            { name: 'Stroke Count', value: Math.min(strokeCount / 15, 1), raw: strokeCount },
            { name: 'Ink Amount', value: Math.min(totalLength / 3000, 1), raw: Math.round(totalLength) },
            { name: 'Curviness', value: Math.min(curviness / 1.2, 1), raw: curviness.toFixed(2) + ' rad' },
            { name: 'Symmetry', value: symmetry, raw: (symmetry * 100).toFixed(0) + '%' },
            { name: 'Density', value: Math.min(density * 200, 1), raw: density.toFixed(4) },
            { name: 'Aspect Ratio', value: Math.min(aspectRatio / 2, 1), raw: aspectRatio.toFixed(2) },
            { name: 'Canvas Fill', value: Math.min(bboxArea / (cw * ch), 1), raw: ((bboxArea / (cw * ch)) * 100).toFixed(0) + '%' },
            { name: 'Draw Speed', value: Math.min(avgSpeed / 3, 1), raw: avgSpeed.toFixed(1) + ' px/ms' }
        ];
    }
};
