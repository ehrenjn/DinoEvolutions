# DinoEvolutions

Using a genetic algorithm to play the Chrome dino game using pixel input


## Running the Code

To run the code:

1. Open up chrome://dino
2. Start playing the game but let the dino die on the first cactus
3. Open up the dev console (Ctrl+Shift+j) and paste in the contents of ai.js

After following the above instructions, the game should restart automatically and dinos will start running by themselves
It should take about 8 hours (or ~30 generations) for the dinos to get "pretty good"


## Strategy

The basic idea is to train a dense neural net through crossover and mutation rather than backprop  
The input to the network are the pixels in the canvas, and it has 3 outputs (down, up, and do nothing)  
Every 0.1 seconds the pixel data is fed into the network  
The output with the highest value is chosen as the next action (eg, if the the down output is 1, up is 2, and do nothing is 1.5 then the dino will press up)  
  
The network only has a single layer because that way you can think of each weight as how much each individual pixel contributes to each action (eg, "if this pixel is black then I should probably jump"), and the dinos *should* be able to know when to jump just based off of a few pixels (theres not really any abstract features to read)  
Another reason for only having one layer is that performing crossover on the weights will only work if each parent dino's weights represent the same thing. If there was a 2nd layer, then two parent dinos could be "seeing" exact the same feature in the 2nd layer, however the weights for that feature could be connected to a different middle layer neuron on each dino, and then crossing over would combine two unrelated features, resulting in a garbage dino child (there are ways around like like crossing over groups of weights but it seemed overly complex for this simple a task)

In the first generation 30 dinos are randomly generated
During every subsequent generation:
- the 10 best dinos "survive" (they compete again in the next generation)
- 10 dinos are bred from the top 10 dinos (through crossover) to compete in the next generation
- 10 mutant dinos are created by copying one of the top ten dinos and slightly adjusting its weights

There were also a few changes made to eliminate noise:  
- Instead of seeing every single pixel, dinos look at a version of the game that has a reduced resolution (3x smaller width/height)
- Because the terrain changes every game, dinos run 3 times and their fitness is the sum of all their scores (just in case a trash dino coincidently has a good game, or a good dino has to play a hard map)


## Results

The dinos can't outplay human beings but after 30 generations of playing they become consistent enough to get over 100 points most of the time, and the best dinos can score over 500 points

Every generation there are also some dud dinos that are pretty garbage, but they become a lot more rare in later generations

