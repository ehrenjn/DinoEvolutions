//MAKE SURE NET WORKS AND STUFF
    //SHOULD ADD ERROR HANDLING FOR INCORRECT LENGTH OF ARRAYS BEING PASSED
    //THINK ABOUT USING FOR OF LOOPS
    //RENAME VARIABLES AND COMMENT CODE

"use strict";


function ReLU(val) {
    if (val < 0) {
        return 0;
    }
    return val;
}


function Net(neuronCounts) {

    if (! (neuronCounts instanceof Array)) {
        throw new Error("Can only create a Net from an array of ints representing the number of neurons in each layer")
    }

    this.neuronCounts = neuronCounts;
    this.weights = []
    for (let layerNum = 1; layerNum < neuronCounts.length; layerNum ++) {
        let numInputs = neuronCounts[layerNum - 1] + 1; //+1 for bias input
        let numOutputs = neuronCounts[layerNum];
        let weightMatrix = new Array(numOutputs); //make each row the inputs to a single neuron so that summing is easier
        for (let row = 0; row < weightMatrix.length; row ++) {
            newWeights = new Array(numInputs); //all the weights for a single output neuron
            for (weightNum = 0; weightNum < numInputs; weightNum ++) { //make one weight for every input->output
                newWeights[weightNum] = Math.random() * 2 - 1; //init weights to be from -1 to 1
            }
            weightMatrix[row] = newWeights;
        }
        this.weights.push(weightMatrix);
    }
    

    this.feed = inputs => {

        if (!(inputs instanceof Array) || inputs.length != this.neuronCounts[0]) {
            throw new Error(`inputs must be an array of length ${this.neuronCounts[0]}`);
        }

        for (let layer = 0; layer < this.weights.length; layer ++) {
            inputs.push(1) //add bias input for this layer
            let layerWeights = this.weights[layer];
            var outputs = new Array(layerWeights.length); //will store the outputs for this layer
            for (let outputNum = 0; outputNum < layerWeights.length; outputNum ++) {
                let outNeuronWeights = layerWeights[outputNum];
                let currentOutput = 0;
                for (let inputNum = 0; inputNum < inputs.length; inputNum ++) {
                    currentOutput += inputs[inputNum] * outNeuronWeights[inputNum];
                }
                currentOutput = ReLU(currentOutput);
                outputs[outputNum] = currentOutput;
            }
            inputs = outputs; //inputs to next layer is output of current layer
        }
        return outputs;
    }
}



function maxElementIndex(ary) {
    maxIndex = 0;
    for ([index, element] of ary.entries()) {
        if (element > ary[maxIndex]) {
            maxIndex = element;
        }
    }
    return maxIndex;
}



function Agent(runnerInstance) {

    this.runnerInstance = runnerInstance;
    this.canvas = runnerInstance.canvas;
    this.network = new Net([this.canvas.width * this.canvas.height * 4, 3]);
    this.fitness = 0;
    this.canvasContext = this.canvas.getContext('2d');


    this.actions = { //maps network outputs to actions
        0: () => { // release keys

        }, 
        1: () => { //hold up
            if (! this.ducking) { //can only jump when not ducking
                this.jumping = true;
            }
        },
        2: () => { //hold down
            this.jumping = false;
        }
    }


    this.play = () => {
        this.runnerInstance.restart();
        startTime = new Date().getTime();
        while (! this.runnerInstance.crashed) {
            let imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
            let decisions = this.network.feed(imageData.data);
            let choice = maxElementIndex(decisions);
            this.actions[choice]()
        }
        this.fitness = new Date().getTime() - startTime; //fitness = time alive
    }


    this.mutate = (mutationRate, mutationAmount) => {

    }


    this.breed = otherAgent => {
        
    }
}



a = new Agent(Runner.instance_);