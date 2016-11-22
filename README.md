# NoxCloudIDE

An online text editor for developers on the go. It aims to be simple, yet featureful, allowing people from all skill levels to use it.

#### Designed to run within containers with every instance being completely separate and having an external authorisation mechanism

## Getting Started
### Prerequisites
1. The LTS version of [Node](https://nodejs.org/)

### Server
1. Run `npm install` inside the `server` directory
2. (Optional) Run `make` for quickly running the server (check the [`makefile`](https://github.com/morwoen/NoxCloudIDE/blob/master/server/makefile) for more info of the command I have been testing with) **OR**
3. Run `node server`. Optional configuration:
  
  `--workspace /path/to/workspace` to set up the working directory. Defaults to current directory.
    
  `--port 8080` to set up the port it should run on. Defaults to 8080.

### UI
1. Run `npm install` inside the `ui` directory
2. Run `npm dev` to run a development server **OR**
3. Run `npm watch` to run a development server, watching for file changes **OR**
4. Run `npm prod` to package all files for production **OR**
5. Run `npm web` to package all files for development

## Ideas and Contributions
are always welcome :heart:

## Things to consider while developing
These are foreseen problems or just thoughts which need more investigation

1. [Maximum open files](http://stackoverflow.com/questions/3734932/max-open-files-for-working-process)
