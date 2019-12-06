//MAKE SURE NET WORKS AND STUFF
    //SHOULD ADD ERROR HANDLING FOR INCORRECT LENGTH OF ARRAYS BEING PASSED
    //THINK ABOUT USING FOR OF LOOPS
    //RENAME VARIABLES AND COMMENT CODE

//SHOULD BE USING FLOAT ARRAYS INSTEAD OF REGULAR ARRAYS SINCE THEYRE WAY MORE MEMORY EFFICIENT
    //uhhh I dont think theyre resizable but I think the only time I use that feature is pushing the bias so its probably doable

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
            let newWeights = new Array(numInputs); //all the weights for a single output neuron
            for (let weightNum = 0; weightNum < numInputs; weightNum ++) { //make one weight for every input->output
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
    let maxIndex = 0;
    for (let [index, element] of ary.entries()) {
        if (element > ary[maxIndex]) {
            maxIndex = index;
        }
    }
    return maxIndex;
}



function Agent(runnerInstance) {

    this.runnerInstance = runnerInstance;
    this.canvas = runnerInstance.canvas;
    this.network = new Net([this.canvas.width * this.canvas.height, 3]);
    this.fitness = undefined;
    this.canvasContext = this.canvas.getContext('2d');
    this.keys = {
        UP: {keyCode: 32},
        DOWN: {keyCode: 40},
        NONE: {}
    }
    this.currentKey = this.keys.NONE

    this.dispatchRunnerKeyEvent = (eventType, key) => {
        if (key != this.keys.NONE) { //don't need to make an event if key is NONE
            this.runnerInstance.handleEvent(new KeyboardEvent(eventType, key));
        }
    }

    this.holdKey = keyType => {
        if (keyType != this.currentKey) {
            console.log(keyType);
            this.dispatchRunnerKeyEvent("keyup", this.currentKey); //release current held key
            this.dispatchRunnerKeyEvent("keydown", keyType); //press new key
            this.currentKey = keyType;
        }
    }

    this.actions = { //maps neural network outputs to actions
        0: () => this.holdKey(this.keys.NONE), 
        1: () => this.holdKey(this.keys.UP),
        2: () => this.holdKey(this.keys.DOWN)
    }


    this.getCanvasData = canvasContext => {
        let rawData = canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        let data = new Array(this.canvas.width * this.canvas.height);
        for (let d = 0; d < rawData.length; d +=4 ) {
            data[d/4] = (rawData[d] + rawData[d+1] + rawData[d+2]) / 3;
        }
        return data;
    }


    this.play = () => {
        this.runnerInstance.restart();
        let startTime = new Date().getTime();
        let agent = this;
        let playLoop = window.setInterval(() => {
            if (! this.runnerInstance.crashed) {
                let imageData = agent.getCanvasData(this.canvasContext);
                let decisions = agent.network.feed(imageData);
                let choice = maxElementIndex(decisions);
                agent.actions[choice]()
            } 
            else {
                agent.fitness = new Date().getTime() - startTime; //fitness = time alive
                window.clearInterval(playLoop);
            }
        }, 100);
    }


    this.mutate = (mutationRate, mutationAmount) => {

    }


    this.breed = otherAgent => {
        
    }
}




function displayEvolutionInfo(generationNum, agentNum, totalAgents) {
    var generation = document.getElementById("generation");
    var agentCounter = document.getElementById("agentCounter");
    if (generation === null || agentCounter === null) {
        generation = document.createElement("h2");
        agentCounter = document.createElement("h2");
        for (let element of [generation, agentCounter]) {
            document.body.appendChild(element);
            element.style.position = "absolute";
            element.style.left = "5px";
        }
        generation.id = "generation";
        agentCounter.id = "agentCounter";
        generation.style.top = "10px";
        agentCounter.style.top = "30px";
    }
    generation.innerText = `Generation: ${generationNum}`;
    agentCounter.innerText = `Agent: ${agentNum}/${totalAgents}`;
}


let a = new Agent(Runner.instance_);
a.play();
displayEvolutionInfo(1, 1, 1);