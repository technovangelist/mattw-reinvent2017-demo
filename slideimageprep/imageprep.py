import sys
import os
from image_transformer import ImageTransformer
from util import save_image

img_path = sys.argv[1]

it = ImageTransformer(img_path, None)

if not os.path.isdir('output'):
    os.mkdir('output')

xang = 10
yang = 10
zang = 8

xdist = 100
ydist = 100
zdist = 100000

rotated_img = it.rotate_along_axis(phi = yang, gamma = zang, theta = xang, dx = xdist, dy = ydist, dz = zdist)

save_image('output/xa{}ya{}za{}xd{}yd{}zd{}.jpg'.format(xang, yang, zang, xdist, ydist, zdist), rotated_img)
