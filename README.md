# A pixelated Paint

[Live preview here](https://wellenina.github.io/etch-a-sketch/)

This project started as an [assignment for **The Odin Project**](https://www.theodinproject.com/lessons/foundations-etch-a-sketch).
The original goal was _"to build a browser version of something between a sketchpad and an Etch-A-Sketch"_, as a webpage with a grid of square divs that would change color when the cursor would pass over them, letting the user 'paint' as on a canvas.
I kept working on it for fun and built an overly complicated version of the assignment whose features include:

* Select any color for the brush and the background through a **color picker**. When a new background color is selected, only the 'empty' pixels are changed and the painted ones remain unaffected
* Change the amount of pixels in the canvas (from 1x1 to 100x100), after asking for confirmation if the user has started drawing - since the resizing will clear the canvas
* Paint on **click and drag** instead of just mouse-over, for more intentional and precise drawing (and stop painting at the next mouse-up anywhere on the window)
* **Hover effect** on buttons and on the canvas (available on devices that support hover functionality). The cursor on the canvas shows, for every different mode, a preview of the color that will be painted when clicking
* **Mobile compatible**
* **Responsive** (adapts to both landscape and portrait mode on mobile devices)

#### Tools
* **Color mode**: simply paint with the selected color
* **Rainbow and grayscale mode**: paint a sequence of colors from a rainbow pastel or a grayscale palette
* **Lighten and darken mode**: increase or decrease the brightness of the pixels
* **Bucket tool**: fill an area of adjacent pixels of the same color with the selected color
* **Eraser**: erase the painted pixels, restoring the background color
* **Rotate left and right**: rotate the whole canvas by 90° counterclockwise or clockwise
* **Flip vertical and horizontal**: mirror the whole canvas across the horizontal or vertical axis
* **Invert colors**: turn the painted pixels to their opposite colors (does not affect the background)
* **Clear**: clear the whole canvas, after asking for confirmation if the user has started drawing

#### Features I'm pretty proud of:
* **Undo and redo**: erase or restore the last change done, for every kind of action, virtually an infinite number of times
* **Download image**: export the 'painting' created as a png file (image size approximately 400x400 px)

[Try it here](https://wellenina.github.io/etch-a-sketch/)



Icons on buttons from [Icons8](https://icons8.com)