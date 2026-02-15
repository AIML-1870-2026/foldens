/* ============================================
   Quick, Decide! — TensorFlow.js Model Manager
   ============================================ */

var ModelManager = {
    model: null,
    intermediateModel: null,
    loading: false,
    ready: false,
    _expectedShape: null,

    init: async function() {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js not loaded');
            return false;
        }

        this.loading = true;

        try {
            // Try IndexedDB cache first
            try {
                this.model = await tf.loadLayersModel('indexeddb://' + CONFIG.INDEXEDDB_KEY);
                console.log('Model loaded from IndexedDB cache');
            } catch (e) {
                // Cache miss: load from files
                console.log('Loading model from files...');
                this.model = await tf.loadLayersModel(CONFIG.MODEL_URL);
                // Save to IndexedDB for next time
                try {
                    await this.model.save('indexeddb://' + CONFIG.INDEXEDDB_KEY);
                    console.log('Model cached to IndexedDB');
                } catch (saveErr) {
                    console.warn('Could not cache model:', saveErr);
                }
            }

            // Check input shape
            this._expectedShape = this.model.inputs[0].shape;
            console.log('Model input shape:', this._expectedShape);

            // Warm up with dummy prediction
            var dummyShape = this._expectedShape.map(function(d) { return d || 1; });
            var dummy = tf.zeros(dummyShape);
            var warmup = this.model.predict(dummy);
            warmup.dispose();
            dummy.dispose();

            // Build intermediate model for educational layer
            this.buildIntermediateModel();

            this.ready = true;
            this.loading = false;
            return true;
        } catch (error) {
            console.error('Model load failed:', error);
            this.loading = false;
            return false;
        }
    },

    buildIntermediateModel: function() {
        try {
            var layers = this.model.layers;
            var denseLayers = layers.filter(function(l) {
                return l.getClassName() === 'Dense';
            });

            if (denseLayers.length >= 2) {
                var hiddenLayer = denseLayers[denseLayers.length - 2];
                var outputLayer = denseLayers[denseLayers.length - 1];

                this.intermediateModel = tf.model({
                    inputs: this.model.inputs,
                    outputs: [hiddenLayer.output, outputLayer.output]
                });
                console.log('Intermediate model built for educational layer');
            }
        } catch (e) {
            console.warn('Could not build intermediate model:', e);
        }
    },

    predict: function(tensor) {
        if (!this.ready || !tensor) return null;

        var self = this;
        return tf.tidy(function() {
            // Reshape if needed to match model input
            var input = self._reshapeInput(tensor);
            var output = self.model.predict(input);
            var probs = output.dataSync();

            // Get top 5
            var indexed = [];
            for (var i = 0; i < probs.length; i++) {
                indexed.push({ index: i, confidence: probs[i] });
            }
            indexed.sort(function(a, b) { return b.confidence - a.confidence; });

            var top5 = indexed.slice(0, 5).map(function(item) {
                var cat = CATEGORIES[item.index] || {
                    displayName: 'Unknown',
                    name: 'unknown',
                    emoji: '✏️'
                };
                return {
                    label: cat.displayName,
                    name: cat.name,
                    emoji: cat.emoji,
                    confidence: item.confidence,
                    index: item.index
                };
            });
            return top5;
        });
    },

    _reshapeInput: function(tensor) {
        if (!this._expectedShape) return tensor;

        var expected = this._expectedShape;
        var actual = tensor.shape;

        // If shapes match, return as-is
        if (expected.length === actual.length) {
            var match = true;
            for (var i = 0; i < expected.length; i++) {
                if (expected[i] !== null && expected[i] !== actual[i]) {
                    match = false;
                    break;
                }
            }
            if (match) return tensor;
        }

        // Try common reshapes
        // [1,28,28,1] -> [1,784] (flattened)
        if (expected.length === 2 && expected[1] === 784) {
            return tensor.reshape([1, 784]);
        }
        // [1,28,28,1] -> [1,28,28] (no channel dim)
        if (expected.length === 3 && expected[1] === 28 && expected[2] === 28) {
            return tensor.reshape([1, 28, 28]);
        }

        return tensor;
    },

    getIntermediateOutputs: function(tensor) {
        if (!this.intermediateModel || !tensor) return null;
        var self = this;
        return tf.tidy(function() {
            var input = self._reshapeInput(tensor);
            var outputs = self.intermediateModel.predict(input);
            return {
                hiddenActivations: Array.from(outputs[0].dataSync()),
                outputLogits: Array.from(outputs[1].dataSync())
            };
        });
    },

    getNeuronData: function(tensor, targetIndex) {
        if (!this.ready || !tensor || targetIndex < 0) return null;

        try {
            var layers = this.model.layers;
            var denseLayers = layers.filter(function(l) {
                return l.getClassName() === 'Dense';
            });
            var lastDense = denseLayers[denseLayers.length - 1];
            var weightsTensor = lastDense.getWeights();
            var wData = weightsTensor[0].dataSync();
            var bData = weightsTensor[1].dataSync();
            var numInputs = weightsTensor[0].shape[0];
            var numOutputs = weightsTensor[0].shape[1];

            // Get weights for this output neuron
            var neuronWeights = [];
            for (var i = 0; i < numInputs; i++) {
                neuronWeights.push(wData[i * numOutputs + targetIndex]);
            }
            var neuronBias = bData[targetIndex];

            // Get input activations
            var intermediate = this.getIntermediateOutputs(tensor);
            if (!intermediate) return null;

            var inputValues = intermediate.hiddenActivations;

            // Compute weighted sum
            var z = neuronBias;
            var count = Math.min(inputValues.length, neuronWeights.length);
            for (var j = 0; j < count; j++) {
                z += inputValues[j] * neuronWeights[j];
            }

            var sigmoidOutput = 1 / (1 + Math.exp(-z));

            return {
                inputValues: inputValues.slice(0, 8),
                weights: neuronWeights.slice(0, 8),
                allWeights: neuronWeights,
                allInputs: inputValues,
                bias: neuronBias,
                zValue: z,
                sigmoidOutput: sigmoidOutput
            };
        } catch (e) {
            console.warn('getNeuronData error:', e);
            return null;
        }
    },

    getLastDenseWeights: function(targetIndex) {
        if (!this.ready || targetIndex < 0) return null;
        try {
            var layers = this.model.layers;
            var denseLayers = layers.filter(function(l) {
                return l.getClassName() === 'Dense';
            });
            var lastDense = denseLayers[denseLayers.length - 1];
            var weightsTensor = lastDense.getWeights();
            var wData = weightsTensor[0].dataSync();
            var bData = weightsTensor[1].dataSync();
            var numInputs = weightsTensor[0].shape[0];
            var numOutputs = weightsTensor[0].shape[1];

            var weights = [];
            for (var i = 0; i < numInputs; i++) {
                weights.push(wData[i * numOutputs + targetIndex]);
            }

            return { weights: weights, bias: bData[targetIndex] };
        } catch (e) {
            return null;
        }
    }
};
