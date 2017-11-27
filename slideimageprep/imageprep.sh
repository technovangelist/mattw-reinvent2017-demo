#!/bin/bash
bgfile=$(find bg -type f | gshuf -n 1)
slide=$1
pan=$(cat randsource/pans | gshuf -n 1)
tilt=$(cat randsource/tilts | gshuf -n 1)
zoom=$(cat randsource/zooms | gshuf -n 1)
odx=$(cat randsource/odxs | gshuf -n 1)
ody=$(cat randsource/odys | gshuf -n 1)
outstring=p${pan}t${tilt}z${zoom}x${odx}y${ody}
3Drotate pan=$pan tilt=$tilt zoom=$zoom bgcolor="rgb(0,250,0)" ody=$ody odx=$odx srcslides/slide${slide}.jpg interim/slide${slide}-nobg-${outstring}.jpg

convert interim/slide${slide}-nobg-${outstring}.jpg -alpha on -fuzz 20% -transparent "rgb(0,250,0)" interim/slide${slide}-mask-${outstring}.gif
convert $bgfile interim/slide${slide}-mask-${outstring}.gif -composite output/slide${slide}-${outstring}.jpg

# convert slide${slide}-${outstring}.jpg -fuzz 20% -transparent "rgb(0,250,0)" miff:- | composite -compose Dst_Over $bgfile -