import * as utils from "./p5utils.js";

const _config = localStorage.getItem("configuration");
const cfg = (_config && JSON.parse(_config)) || {
    spacing: 20,
    debugSize: 4,
    canvas: null,
    scale: 1,
    position: {
        x: 0,
        y: 0
    },
    drag: {
        is: false,
        x: 0,
        y: 0,
        px: 0,
        py: 0,
    },
    window: {
        min: {
            x: 0,
            y: 0,
        },
        max: {
            x: 1,
            y: 1
        },
        cmin: {
            x: 0,
            y: 0,
        },
        cmax: {
            x: 1,
            y: 1,
        },
        cdx: 1,
        cdy: 1,
    },
    size: 100,
    weight: 1,
    ncells: 0,
    cells: {}, 
    /* template cell:
    {
        type: "",
        data: []
    } */
    selected: null,
    saves: {},
    breaks: {},
    debug: null,
};

window.setup = function() {
    cfg.canvas = createCanvas(windowWidth - convertRemToPixels(cfg.spacing), windowHeight);
    updateView();

    for (let element of document.getElementsByClassName("p5Canvas")) {
        element.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    setup_html();

    noLoop();
    redraw();
}

function updateView() {
    cfg.window.min.x = -cfg.position.x;
    cfg.window.max.x = cfg.window.min.x + width / cfg.scale;
    cfg.window.min.y = -cfg.position.y;
    cfg.window.max.y = cfg.window.min.y + height / cfg.scale;

    cfg.window.cmin.x = Math.floor(cfg.window.min.x / cfg.size);
    cfg.window.cmax.x = Math.floor(cfg.window.max.x / cfg.size);
    cfg.window.cmin.y = Math.floor(cfg.window.min.y / cfg.size);
    cfg.window.cmax.y = Math.floor(cfg.window.max.y / cfg.size);

    cfg.window.cdx = cfg.window.cmax.x - cfg.window.cmin.x + 1;
    cfg.window.cdy = cfg.window.cmax.y - cfg.window.cmin.y + 1;

    const clone = {...cfg};
    clone.canvas = null;
    clone.debug = null;
    localStorage.setItem("configuration", JSON.stringify(clone));

    // window.redraw();
}

window.draw = function() {
    background(24, 26, 27);
    scale(cfg.scale);
    translate(cfg.position.x, cfg.position.y);
    rectMode(CORNER);

    // Paint cells
    if (cfg.ncells < 200 && cfg.window.cdx * cfg.window.cdy > cfg.ncells) {
        for (const cell in cfg.cells) {
            const [x, y] = cell.split(',').map(k => parseInt(k));
            if (x < cfg.window.cmin.x) continue;
            if (x > cfg.window.cmax.x) continue;
            if (y < cfg.window.cmin.y) continue;
            if (y > cfg.window.cmax.y) continue;

            utils.drawBlock(cfg, x, y);
        }            
    } else {
        for (let x = cfg.window.cmin.x; x <= cfg.window.cmax.x; x++) {
            for (let y = cfg.window.cmin.y; y <= cfg.window.cmax.y; y++) {
                const cell = [x, y];
                if (cfg.cells[cell]) {
                    utils.drawBlock(cfg, x, y);
                }
            }
        }
    }

    // Paint cells borders
    stroke(255);
    strokeWeight(cfg.weight);

    // Draw vertical lines
    for (let i = cfg.window.cmin.x; i <= cfg.window.cmax.x; i += 1) {
        line(i * cfg.size, cfg.window.min.y, i * cfg.size, cfg.window.max.y);
    }
    // Draw horizontal lines
    for (let i = cfg.window.cmin.y; i <= cfg.window.cmax.y; i += 1) {
        line(cfg.window.min.x, i * cfg.size, cfg.window.max.x, i * cfg.size);
    }

    // Paint selected cell
    if (cfg.selected) {
        noFill();
        stroke(255);
        strokeWeight(4);
        rectMode(CORNER);
        square(cfg.selected.x * cfg.size, cfg.selected.y * cfg.size, cfg.size);
    } else if (cfg.area) {
        noFill();
        stroke(255);
        strokeWeight(4);
        rectMode(CORNERS);
        rect(cfg.area.x1 * cfg.size, cfg.area.y1 * cfg.size, (cfg.area.x2 + 1) * cfg.size, (cfg.area.y2 + 1) * cfg.size);
    }

    // Paint things related to Debug Mode

    // Paint break points
    if (!!cfg.breaks) {
        for (const breakpoint in cfg.breaks) {
            const [x, y] = breakpoint.split(',').map(k => parseInt(k));
            if (x < cfg.window.cmin.x) continue;
            if (x > cfg.window.cmax.x) continue;
            if (y < cfg.window.cmin.y) continue;
            if (y > cfg.window.cmax.y) continue;

            utils.drawBreak(cfg, x, y);
        }
    }

    if (cfg.debug !== null) {
        const dbg = cfg.debug.debugger;
        const state = cfg.debug.state;
        const x = state.get_coords_x();
        const y = state.get_coords_y();
        
        const storagePtr = state.get_storage();
        const storage = new BigUint64Array(wasm_memory.buffer, storagePtr, state.get_storage_size());

        const dir = state.dir;
        const reg_pos = state.pos;
        const reg_val = state.val;

        // Mark current coordinates
        fill(255, 255, 255, 100);
        noStroke();
        square(x * cfg.size, y * cfg.size, cfg.size);

        // Activate storage view on the bottom of the page
    }
}

window.mousePressed = function(evt) {
    if (evt.target != cfg.canvas.elt) {
        return;
    }

    if (evt.which == 1) {
        const x = Math.floor((mouseX / cfg.scale - cfg.position.x) / cfg.size);
        const y = Math.floor((mouseY / cfg.scale - cfg.position.y) / cfg.size);
        if (cfg.selected && cfg.selected.x == x && cfg.selected.y == y) {
            cfg.selected = null;
        } else {
            cfg.selected = { x, y };
            cfg.area = null;
            update_config();
        }

        updateView();
        redraw();
    } else if (evt.which == 2) {
        cfg.drag.x = mouseX;
        cfg.drag.y = mouseY;
        cfg.drag.px = cfg.position.x;
        cfg.drag.py = cfg.position.y;
        cfg.drag.is = true;

        updateView();
        redraw();
    } else if (evt.which == 3) {
        // Moved code to mouse released
    }

    redraw();
    return false;
}

window.mouseDragged = function(evt) {
    loop();
    if (evt.which == 2) {
        if (!cfg.drag.is) {
            cfg.drag.is = true;
            cfg.drag.x = mouseX;
            cfg.drag.y = mouseY;
            cfg.drag.px = cfg.position.x;
            cfg.drag.py = cfg.position.y;
        }
        cfg.position.x = cfg.drag.px + (mouseX - cfg.drag.x) / cfg.scale;
        cfg.position.y = cfg.drag.py + (mouseY - cfg.drag.y) / cfg.scale;

        updateView();
    } else if (evt.which == 1) {
        const x = Math.floor((mouseX / cfg.scale - cfg.position.x) / cfg.size);
        const y = Math.floor((mouseY / cfg.scale - cfg.position.y) / cfg.size);
        cfg.selected = null;
        if (!cfg.drag.is) {
            cfg.drag.is = true;
            cfg.drag.px = x;
            cfg.drag.py = y;
        }
        cfg.drag.x = x;
        cfg.drag.y = y;
        cfg.area = {
            x1: Math.min(cfg.drag.px, cfg.drag.x),
            y1: Math.min(cfg.drag.py, cfg.drag.y),
            x2: Math.max(cfg.drag.px, cfg.drag.x),
            y2: Math.max(cfg.drag.py, cfg.drag.y),
        };

        updateView();
    } else if (evt.which == 3) {
        const x = Math.floor((mouseX / cfg.scale - cfg.position.x) / cfg.size);
        const y = Math.floor((mouseY / cfg.scale - cfg.position.y) / cfg.size);
        if (cfg.area) {
            // Drag that area
            if (!cfg.drag.is) {
                cfg.drag.is = true;
            } else {
                if (x != cfg.drag.x || y != cfg.drag.y) {
                    const dx = x - cfg.drag.x;
                    const dy = y - cfg.drag.y;

                    // Find cells within area
                    // and move them
                    const new_cells = {};
                    for (let x = cfg.area.x1; x <= cfg.area.x2; x++) {
                        for (let y = cfg.area.y1; y <= cfg.area.y2; y++) {
                            const cell = [x, y];
                            if (cfg.cells[cell]) {
                                new_cells[[x + dx, y + dy]] = cfg.cells[cell];
                                delete cfg.cells[cell];
                            }
                        }
                    }
                    for (const cell in new_cells) {
                        cfg.cells[cell] = new_cells[cell];
                    }
                    // Move area
                    cfg.area.x1 += dx;
                    cfg.area.y1 += dy;
                    cfg.area.x2 += dx;
                    cfg.area.y2 += dy;
                }
            }
            cfg.drag.x = x;
            cfg.drag.y = y;
        } else if (cfg.selected) {
            if (!cfg.drag.is) {
                loop();
                cfg.drag.is = true;
            } else {
                if (x != cfg.drag.x || y != cfg.drag.y) {
                    const dx = x - cfg.drag.x;
                    const dy = y - cfg.drag.y;
                    // Find cells within area
                    // and move them
                    cfg.cells[[cfg.selected.x + dx, cfg.selected.y + dy]] = cfg.cells[[cfg.selected.x, cfg.selected.y]];
                    delete cfg.cells[[cfg.selected.x, cfg.selected.y]];
                    // Move selection
                    cfg.selected.x += dx;
                    cfg.selected.y += dy;
                }
            }
            cfg.drag.x = x;
            cfg.drag.y = y;
        }

        updateView();
    }
}

window.mouseReleased = function(evt) {
    const was_drag = cfg.drag.is;
    cfg.drag.is = false;
    noLoop();

    if (evt.which == 1 && cfg.area) {
        // Fix selected area
        const x1 = Math.min(cfg.area.x1, cfg.area.x2);
        const y1 = Math.min(cfg.area.y1, cfg.area.y2);
        const x2 = Math.max(cfg.area.x1, cfg.area.x2);
        const y2 = Math.max(cfg.area.y1, cfg.area.y2);
        if (x1 == x2 && y1 == y2) {
            cfg.selected = { x: x1, y: y1 };
            cfg.area = null;
        } else {
            cfg.area = { x1, y1, x2, y2 };
        }
    } else if (evt.which == 3 && !was_drag) {
        const x = Math.floor((mouseX / cfg.scale - cfg.position.x) / cfg.size);
        const y = Math.floor((mouseY / cfg.scale - cfg.position.y) / cfg.size);

        if (!cfg.breaks) {
            cfg.breaks = {};
        }

        if (cfg.breaks[[x, y]]) {
            delete cfg.breaks[[x, y]];
        } else {
            cfg.breaks[[x, y]] = true;
        }

        console.log(cfg);

        updateView();
        redraw();
    }

    updateView();
}

window.mouseMoved = function() {
    if (cfg.drag.is) {
        cfg.position.x = cfg.drag.px + mouseX - cfg.drag.x;
        cfg.position.y = cfg.drag.py + mouseY - cfg.drag.y;

        updateView();
    }
}

window.mouseWheel = function(evt) {
    if (evt.target != cfg.canvas.elt) {
        return;
    }
    // Define mouse position before zoom:
    const mx = mouseX / cfg.scale;
    const my = mouseY / cfg.scale;

    const nscl = Math.pow(1.1, -evt.delta/100);
    
    cfg.scale *= nscl;

    // Move to new position after scale:
    cfg.position.x += mx * (1 - nscl);
    cfg.position.y += my * (1 - nscl);

    updateView();

    redraw();
}


window.windowResized = function() {
    if (cfg.debug !== null) {
        resizeCanvas(windowWidth - convertRemToPixels(cfg.spacing), windowHeight - convertRemToPixels(cfg.debugSize));
    } else {
        resizeCanvas(windowWidth - convertRemToPixels(cfg.spacing), windowHeight);
    }

    updateView();
    redraw();
}

window.keyPressed = function() {
    let selChanged = false;
    if (keyCode == UP_ARROW || key == 'w') {
        cfg.selected.y -= 1;
        selChanged = true;
    }
    if (keyCode == DOWN_ARROW || key == 's') {
        cfg.selected.y += 1;
        selChanged = true;
    }
    if (keyCode == LEFT_ARROW || key == 'a') {
        cfg.selected.x -= 1;
        selChanged = true;
    }
    if (keyCode == RIGHT_ARROW || key == 'd') {
        cfg.selected.x += 1;
        selChanged = true;
    }
    if (selChanged) {
        const selMinX = cfg.selected.x * cfg.size;
        const selMaxX = selMinX + cfg.size;
        const selMinY = cfg.selected.y * cfg.size;
        const selMaxY = selMinY + cfg.size;
        if (selMinX < cfg.window.min.x) {
            cfg.position.x += cfg.window.min.x - selMinX;
        }
        if (selMaxX > cfg.window.max.x) {
            cfg.position.x += cfg.window.max.x - selMaxX;
        }
        if (selMinY < cfg.window.min.y) {
            cfg.position.y += cfg.window.min.y - selMinY;
        }
        if (selMaxY > cfg.window.max.y) {
            cfg.position.y += cfg.window.max.y - selMaxY;
        }
        updateView();
        return false;
    }
    if (keyCode == DELETE) {
        if (cfg.selected) {
            delete cfg.cells[[cfg.selected.x, cfg.selected.y]];
        } else if (cfg.area) {
            for (let x = cfg.area.x1; x <= cfg.area.x2; x++) {
                for (let y = cfg.area.y1; y <= cfg.area.y2; y++) {
                    const cell = [x, y];
                    if (cfg.cells[cell]) {
                        delete cfg.cells[cell];
                    }
                }
            }
        }
        update_config();
        updateView();
        return false;
    }
}

function convertRemToPixels(rem) {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function setup_html() {
    fetch('./res/types.json')
        .then(res => res.json())
        .then(dt => {
            cfg.types = dt;
            for (const block in cfg.types.blockTypes) {
                let el = document.createElement("button");
                el.classList.add("block");
                el.innerHTML = block;
                el.addEventListener("click", () => {
                    if (!cfg.selected) return;
                    cfg.cells[[cfg.selected.x, cfg.selected.y]] = {
                        type: block,
                        data: []
                    };
                    update_config();
                    updateView();
                    redraw();
                });
                document.querySelector(".sidebar > .create")
                    .appendChild(el);
            }
        })
        .catch(console.error);
}

function update_config() {
    let config = document.querySelector(".sidebar > .config");
    config.textContent = "";

    if (cfg.selected == null) return;
    
    let [x, y] = [cfg.selected.x, cfg.selected.y];
    let cell = cfg.cells[[x, y]];

    if (!cell) return;

    let cell_type = cell.type;
    let cell_data = cfg.types.blockTypes[cell_type].data;
    
    for (let i = 0; i < cell_data.length; i++) {
        const dt = cell_data[i];
        let el = document.createElement("div");
        
        switch (dt) {
            case "dir":
                let sw = document.createElement("select");
                sw.classList.add("dir");
                sw.addEventListener("change", (evt) => {
                    if (!cfg.selected) return;
                    cfg.cells[[x, y]].data[i] = sw.value;
                    updateView();
                    redraw();
                });

                // Add options "Up", "Down", "Left", "Right" to select
                let opts = ["Up", "Down", "Left", "Right"];
                for (let j = 0; j < opts.length; j++) {
                    let opt = document.createElement("option");
                    opt.value = opts[j][0];
                    opt.innerHTML = opts[j];
                    sw.appendChild(opt);
                }

                cfg.cells[[x, y]].data[i] = cfg.cells[[x, y]].data[i] ?? cfg.types.dirTypes.default[0];
                sw.value = cfg.cells[[x, y]].data[i];

                el.append(sw);
                break;
            case "ind":
            case "val":
                // Create an input for a positive integer value
                // and append it the div `el`
                let inp = document.createElement("input");
                inp.classList.add("ind");
                inp.type = "number";
                inp.min = 0;
                cell.data[i] = cell.data[i] ?? 0;
                inp.value = cell.data[i];
                inp.addEventListener("change", () => {
                    if (!cfg.selected) return;
                    cfg.cells[[x, y]].data[i] = inp.value;
                    update_config();
                    updateView();
                    redraw();
                });
                el.append(inp);
                break;
            default: 
                break;
        }

        
        config.appendChild(el);
    }
}

function findSmallestRect(cells) {
    let min_x = Infinity;
    let min_y = Infinity;
    let max_x = -Infinity;
    let max_y = -Infinity;
    for (let cell in cells) {
        const [x, y] = cell.split(',').map(k => parseInt(k));
        if (x < min_x) min_x = x;
        if (y < min_y) min_y = y;
        if (x > max_x) max_x = x;
        if (y > max_y) max_y = y;
    }
    return [min_x, min_y, max_x, max_y];
}

function cleanup_cells() {
    for (let cell in cfg.cells) {
        if (!cfg.cells[cell] || !cell.match(/-?\d+, ?-?\d+/g)) {
            delete cfg.cells[cell];
        }
    }
}

function get_code() {
    cleanup_cells();
    const [min_x, min_y, max_x, max_y] = findSmallestRect(cfg.cells);
    const width = max_x - min_x + 1;
    const height = max_y - min_y + 1;
    let code = "";
    for (let i = 0; i < height; i++) {
        if (i > 0) code += '\n';
        for (let j = 0; j < width; j++) {
            if (j > 0) code += ' ';
            const cell = cfg.cells[[j + min_x, i + min_y]];
            if (!cell) code += '_';
            else {
                code += `${cell.type}`;
                if (cell.data.length > 0) {
                    code += `(${cell.data.join(',')})`;
                }
            }
        }
    }
    return code;
}

window.compile_code = function() {
    alert("Not Implemented");
}

window.run_code = function() {
    clear_console();
    const code = get_code();
    console.log(code);
    wasm.execute_code(code);
}

window.test_code = function() {
    const code = get_code();
    console.log(wasm.get_code_str(code));
}

window.print_to_console = function(message) {
    const cons = document.querySelector("#console");
    cons.textContent += message;
}

window.clear_console = function() {
    document.querySelector("#console").textContent = "";
}

window.clear_all = function() {
    clear_console();
    cfg.cells = {};
    cfg.selected = null;
    update_config();
    updateView();
}

window.saveas = function() {
    const name = prompt("Save as:", "name");
    if (!name) return;
    cfg.saves = cfg.saves ?? {};
    cfg.saves[name] = {
        cells: {...cfg.cells},
        position: {...cfg.position},
        scale: cfg.scale,
    };
    updateView();
}

window.load = function() {
    const name = prompt("Load:", "name");
    if (!name) return;
    if (!cfg.saves[name]) return;
    cfg.cells = {...cfg.saves[name].cells};
    cfg.position = {...cfg.saves[name].position};
    cfg.scale = cfg.saves[name].scale;
    cfg.selected = null;
    update_config();
    updateView();
}

window.show_saves = function() {
    clear_console();
    print_to_console("Saves:\n");
    print_to_console(Object.keys(cfg.saves).join('\n'));
}

function get_break_points() {
    let bps = [];
    for (const text in cfg.breaks) {
        const [x, y] = text.split(',').map(k => parseInt(k));
        bps.push(x, y);
    }
    return bps;
}

window.debug_code = function() {
    clear_console();
    const code = get_code();
    const debug = wasm.M43Debugger.new(code, get_break_points());

    cfg.debug = {
        debugger: debug,
        state: debug.get_state(),
    }

    document.querySelector(".debug-bar").style.display = "block";

    windowResized();
}