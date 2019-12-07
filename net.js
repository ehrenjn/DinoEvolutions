//MAKE SURE NET WORKS AND STUFF
    //SHOULD ADD ERROR HANDLING FOR INCORRECT LENGTH OF ARRAYS BEING PASSED
    //THINK ABOUT USING FOR OF LOOPS
    //RENAME VARIABLES AND COMMENT CODE

//SHOULD BE USING FLOAT ARRAYS INSTEAD OF REGULAR ARRAYS SINCE THEYRE WAY MORE MEMORY EFFICIENT
    //uhhh I dont think theyre resizable but I think the only time I use that feature is pushing the bias so its probably doable


//TRY PUTTING THE BEST AGENTS BACK INTO THE GAME EVERY ROUND TO WEED OUT ACCIDENTLY GOOD ONES
    //downside of this is that a coincedental loss could knock them out of the gene pool... but thats how real life works too so whatever
//CHECK EVERY PART OF CODE
//TRY CHANGING MUTATION RATES
    //maybe wait until you have a really good agent and then try messing with it's genes to find out what mutation rate is good
//TRY CHANGING MUTATION AMOUNT TO A FLAT AMOUNT INSTEAD OF A PERCENTAGE OF THE WEIGHT SO THAT SMALLER WEIGHTS CAN STILL MUTATE
    //very doable since all my weights are from -1 to 1 at the start and the only way to change them is mutating
//TRY MAKING EACH AGENT PLAY MULTIPLE GAMES, SINCE SMALL CACTUSES SEEM TO BE A LOT HARDER THAN LARGE
//WANNA PRINT GENERATION FOR EACH BEST SCORE BUT ITS PRETTY HARD
//KEEP TRACK OF TOTAL FITNESS FOR A WHOLE GENERATION SO YOU CAN CHECK IF ITS ACTUALLY LEARNING MORE EASILY
//maybe breed half mutants and half clean combinations?


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
            data[d/4] = rawData[d+3]; //agent only sees alpha channel of pixels (makes cacti completely black, simplifies colors)
        }
        return data;
    }


    this.play = () => {
        let agent = this;
        return new Promise(function(callback) {
            agent.runnerInstance.restart();
            let playLoop = window.setInterval(() => {
                if (! agent.runnerInstance.crashed) {
                    let imageData = agent.getCanvasData(agent.canvasContext);
                    let decisions = agent.network.feed(imageData);
                    let choice = maxElementIndex(decisions);
                    agent.actions[choice]()
                } 
                else {
                    agent.fitness = agent.runnerInstance.distanceRan;
                    window.clearInterval(playLoop);
                    callback();
                }
            }, 100);
        });
    }


    this.breed = (otherAgent, mutationRate, mutationAmount) => {

        if (this.network.weights[0].length != otherAgent.network.weights[0].length ||
            this.network.weights[0][0].length != otherAgent.network.weights[0][0].length ||
            this.network.weights[0][0][0].length != otherAgent.network.weights[0][0][0].length) {
            throw new Error("Agent weights must have exact same dimensionality to breed");
        }

        let child = new Agent(this.runnerInstance);
        for (let layerNum = 0; layerNum < this.network.weights.length; layerNum ++) {
            let numOutputs = this.network.weights[layerNum].length;
            for (let outputNum = 0; outputNum < numOutputs; outputNum ++) {
                let numWeights = this.network.weights[layerNum][outputNum].length;
                for (let weightNum = 0; weightNum < numWeights; weightNum ++) {
                    let weight;

                    if (Math.random() < 0.5) { //choose parent for gene
                        weight = this.network.weights[layerNum][outputNum][weightNum];
                    } else {
                        weight = otherAgent.network.weights[layerNum][outputNum][weightNum];
                    }

                    if (Math.random() < mutationRate) { //mutate the gene
                        let mutationSign = Math.random() < 0.5 ? -1 : 1;
                        //weight += mutationSign * weight * mutationAmount;
                        weight += mutationSign * mutationAmount;
                    }
                    
                    child.network.weights[layerNum][outputNum][weightNum] = weight;
                }
            }
        }

        return child;
    }
}




const MUTATION_RATE = 0.05 //0.03 (tried after mutation was fixed); //0.05 (never tried); //0 (og, got 210);
const MUTATION_AMOUNT = 0.1 //0.05; //0.2; //0;
const AGENTS_PER_GEN = 30;
const BREEDABLE_AGENTS_RATIO = 1/6;
const BREEDABLE_AGENTS_PER_GEN = Math.floor(AGENTS_PER_GEN * BREEDABLE_AGENTS_RATIO);
const CHILDREN_PER_GEN = AGENTS_PER_GEN - BREEDABLE_AGENTS_PER_GEN;


function printAgentInfo(generationNum, agentNum, totalAgents) {
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

function printFitnessInfo(fitness) {
    console.log(`Fitness: ${fitness}`);
}

function printBestScores(bestAgents) {
    console.log("Best scores:")
    bestAgents.forEach(agent => {
        console.log(agent.fitness);
    });
}


function randomChoice(ary) {
    return ary[Math.floor(Math.random() * ary.length)];
}


async function trainingLoop(currentAgents) {
    let bestAgents = [];
    let generation = 1;
    while (true) {
        for (let [agentNum, agent] of currentAgents.entries()) {
            printAgentInfo(generation, agentNum + 1, currentAgents.length);
            await agent.play();
            printFitnessInfo(agent.fitness)
        }
        let allAgents = bestAgents.concat(currentAgents);
        allAgents.sort((agent1, agent2) => { //sort agents in ascending order
            return agent2.fitness - agent1.fitness;
        })
        bestAgents = allAgents.slice(0, BREEDABLE_AGENTS_PER_GEN);
        printBestScores(bestAgents);
        currentAgents = [];
        for (let childNum = 0; childNum < CHILDREN_PER_GEN; childNum ++) {
            let parent1 = randomChoice(bestAgents);
            let parent2 = randomChoice(bestAgents);
            while (parent2 == parent1) { //make sure parents aren't the same
                parent2 = randomChoice(bestAgents);
            }
            currentAgents.push(parent1.breed(parent2, MUTATION_RATE, MUTATION_AMOUNT));
        }
        generation ++;
    }
}


(function() {
    let bestAgents = [];
    let currentAgents = [];
    for (let agentNum = 0; agentNum < AGENTS_PER_GEN; agentNum ++) {
        currentAgents.push(new Agent(Runner.instance_));
    }
    trainingLoop(currentAgents);
})();