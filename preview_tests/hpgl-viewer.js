(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        global.HPGLViewer = factory();
    }
})(this, function () {
    return function (options) {
        if (!options.container) {
            console.error("Please define a container in options");
        }

        if (!options.layerColors) {
            options.layerColors = ["black", "red", "blue", "green", "yellow", "pink", "orange", "turquoise"];
        }

        if (!options.machineRatio) {
            options.machineRatio = 40;
        }

        const canvas = document.getElementById(options.container),
            ctx = canvas.getContext("2d");

        let canvasWidth,
            canvasHeight;

        const _setCanvasSize = function () {
            canvas.width = options.canvasWidth;
            canvas.height = options.canvasWidth * (options.machineTravelHeight / options.machineTravelWidth);

            canvasWidth = canvas.width;
            canvasHeight = canvas.height;
        };

        _setCanvasSize();

        const _log = (msg) => {
            console.log("[HPGL Viewer]", msg);
        };

        const _logError = (cmd) => {
            _log("Could not parse line:" + cmd);
        };

        const _isInt = (value) => {
            if (isNaN(value)) {
                return false;
            }
            const x = parseFloat(value);
            return (x | 0) === x;
        };

        let lastPosition = [0, 0];
        let relative = false;
        let centerOrig = false;

        const _coordinates = (x, y) => {

            if (relative) {
                x = lastPosition[0] + (x / options.machineRatio) * (canvasWidth / options.machineTravelWidth); 
                y = lastPosition[1] + (y / options.machineRatio) * (canvasHeight / options.machineTravelHeight);
            } else {
                x = (x / options.machineRatio) * (canvasWidth / options.machineTravelWidth); 
                y = (y / options.machineRatio) * (canvasHeight / options.machineTravelHeight);
            }

            lastPosition = [x, y];

            if (centerOrig) {
                x += canvasWidth / 2;
                y += canvasHeight / 2;
            }

            return [x, (canvasHeight-y)];
        };
        

        const draw = (hpgl) => {
            hpgl = hpgl.replace(/(\r\n|\n|\r)/gm, "");
            const commands = hpgl.split(";");
            let currentColor = options.layerColors[0];
        
            _clear();
            ctx.lineWidth = .5;
            ctx.strokeStyle = currentColor;
        
            let index = 0;
        
            const drawNextCommand = () => {
                if (index < commands.length) {
                    let cmd = commands[index];
                    index++;
        
                    if (!cmd.length) {
                        drawNextCommand();
                        return;
                    }
                    // RELATIVE MOVE CO-ORDINATES
                    if (cmd.match(/^PR/)) {
                        relative = true;

                    // ABSOLUTE MOVE CO-ORDINATES 
                    } else if(cmd.match(/^PA/)) {
                        relative = false;

                    // PEN UP
                    } else if (cmd.match(/^PU/)) {
                        isPenDown = false;
                        const subcmd = cmd.substring(2).split(",");
                        if (subcmd.length < 2) return drawNextCommand();
                        ctx.beginPath();
                        const [x, y] = _coordinates(subcmd[0], subcmd[1]);
                        ctx.moveTo(x, y);

                    // PEN DOWN (eg. PD400,0; or PD400,0,400,400;)
                    } else if (cmd.match(/^PD/)) {
                        isPenDown = true;
                        const subcmd = cmd.substring(2).split(",");
                        if (subcmd.length < 2) return drawNextCommand();
                        for (let i = 0; i < subcmd.length; i += 2) {
                            const [x, y] = _coordinates(subcmd[i], subcmd[i + 1]);
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    
                    // PEN SELECT
                    } else if (cmd.match(/^SP/)) {
                        const layerNumber = parseInt(cmd.substring(2)) - 1;
                        currentColor = layerNumber > 0 ? options.layerColors[layerNumber] : null;
                        ctx.strokeStyle = currentColor;

                    } else if (cmd.match(/^IN/)
                        || cmd.match(/^VS/) // change Pen Speed
                        || cmd.match(/^DF/) // Set plotter to Default 
                    ) {
                        // Do nothing
                    } else {
                        _logError(cmd);
                    }
                    // setTimeout(drawNextCommand, 5); 
                    drawNextCommand();
                } else {
                    _log("Finished parsing");
                }
            };
        
            drawNextCommand();
        };
        
        const setMachineTravelWidth = function (width) {
            if (_isInt(width)) {
                options.machineTravelWidth = width;
                _setCanvasSize();
            }
        };

        const setMachineTravelHeight = function (height) {
            if (_isInt(height)) {
                options.machineTravelHeight = height;
                _setCanvasSize();
            }
        };

        const _clear = function () {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        };

        // const _move = function (cmd) {
        //     ctx.beginPath();
        //     const coord = _coordinates(cmd[0], cmd[1]);
        //     ctx.moveTo(coord[0], coord[1]);
        // };

        // const _trace = function (cmd) {
        //     for (let i = 0; i < cmd.length; i += 2) {
        //         const coord = _coordinates(cmd[i], cmd[i + 1]);
        //         ctx.lineTo(coord[0], coord[1]);
        //     }
        //     ctx.stroke();
        // };
        
        return {
            draw,
            setMachineTravelWidth,
            setMachineTravelHeight,
            // setMachineOrigin
        };
    };
});
