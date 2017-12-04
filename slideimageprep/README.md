# slideimageprep Overview

Vize.ai needs a dataset of at least 20 images of each thing it should recognize. If 20 is good, 60 must better. Since I don't know the configuration of the room, I generated 80+ images of each slide in different orientations with different blur levels to deal with the fact that I probably won't be able to achieve perfect focus with my Raspberry Pi.

The actual command run at the prompt is:

`seq 40 | xargs -Iz seq 69 | xargs -Ix ./imageprep.sh x`

This goes through each of the 69 images of slides 40 times. Each run is configured in **imageprep.sh**. 

Imageprep does a gshuf to pick a semi-random line in each of the files in randsource. Then performs 3Drotate on them using those choices. 3Drotate can be found here: http://www.fmwconcepts.com/imagemagick/3Drotate/index.php

Each run creates one output file in perfect focus and one in a semi-random amount of blur.