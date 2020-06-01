# react-canvas-map

Please note that this package is not intended for world maps or integrating with any large map
datasets. It is instead for displaying a single static image, zooming and panning around it, with
markers and drop zones in 2d space relative to that image.

# Installation

To use simply install from `npm`:

```shell
npm install react-canvas-map
```

Check out the examples on the demo site for implementation example code.

# Development Environment

## Installation

From the root directory, install the requirements of the base package with `yarn` / `npm`:

```shell
yarn
```

Likewise do the same in the demo folder:

```shell
cd demo
yarn
```

If you don't already have `ruby` installed, follow their
[installation instructions](https://www.ruby-lang.org/en/documentation/installation/).

Install `jekyll` using `ruby`:

```shell
gem install jekyll
```

## Running

To watch the base package's code for changes and rebuild on the fly, run the following from the
project root directory:

```shell
yarn watch
```

Simultaneously, to watch the demo project's files for changes and rebuild / host the static files,
run the following from the demo directory:

```shell
cd demo
yarn start
```

You will be able to access a hosted copy of your demo site at `localhost:4000`, and any `javascript`
or `css` changes to either the base package or the demo site will be reflected there after a browser
refresh.

## Linting

todo
