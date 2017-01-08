# Interactive Network Visualization

This is the code for the Interactive Network Visualization using D3 tutorial.

## Changes

The code here has been updated from the original tutorial in the following ways:

* Converted everything from Coffeescript to plain old Javascript.
* Uses D3 version 4 - which includes significant changes to the force layout.
* Removed jQuery and other unnecessary libraries
* Moved the code around a bit to make things a bit clearer.

Otherwise, most of the functionality should be about the same.

## Code

Most of the interesting code is in:

```
src/network.js
```

So you should start there.

There are a few other javascript files:

* `src/radial_layout.js` includes a layout function for positioning things around a circle.
* `src/tooltip.js` implements a simple tooltip that is used on hover.

I've attempted to add the keyword `@v4` in the comments to highlight significant changes in the implementation needed when working with D3v4.

Enjoy!

## Running

To view the demo on your computer, you need to be running a local web server.

If you have python installed, you can easily run a web-server from the command line.

First check which version of python you have installed:

```
python --version
```

If it is python 2.xx, then run the following command:

```
cd /path/to/interactive-network-v4

python -m SimpleHTTPServer 3000
```

If it is python 3.xx, you can use:

```
cd /path/to/interactive-network-v4

python3 -m http.server 3000
```

If node is more your style and you have `npm` installed, try out `http-server`:

```
# install the package globally, if you don't have it already.
# NOTE: you only need to do this once.
npm install http-server -g

cd /path/to/interactive-network-v4

http-server -p 3000
```

## Data

The data comes from Last FM. A script used to create the json files in `data` can be found in:

```
tools/lastfm_network.rb
```

This is a ruby script, and may require additional packages to run.
