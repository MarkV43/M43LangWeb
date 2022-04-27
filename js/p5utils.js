export function drawBlock(cfg, x, y) {
    const block = cfg.cells[[x, y]];
    if (!block) {
        return;
    }

    const blockCfg = cfg.types.blockTypes[block.type];

    // Paint cell white
    fill(blockCfg.color);
    noStroke();
    square(x * cfg.size, y * cfg.size, cfg.size);

    // Check if there is "val" or "ind" in `blockCfg.data`
    fill(blockCfg.textColor);
    textSize(blockCfg.textSize);
    if (["val", "ind"].some(r => blockCfg.data.includes(r))) {
        textAlign(CENTER, TOP);
        text(blockCfg.display, (x + 0.5) * cfg.size, (y + 0.05) * cfg.size);
    } else {
        textAlign(CENTER, CENTER);
        text(blockCfg.display, (x + 0.5) * cfg.size, (y + 0.5) * cfg.size);
    }

    for (let i = 0; i < blockCfg.data.length; i++) {
        switch (blockCfg.data[i]) {
            case "dir":
                drawSimpleArrow(cfg, x, y, block.data[i], cfg.types.arrowColors[i]);
                break;
            case "ind":
            case "val":
                
                textAlign(CENTER, CENTER);
                fill(blockCfg.textColor);
                const value = block.data[i].toString();
                const size = value.length;
                if (size < 3) {
                    textSize(0.4 * cfg.size);
                } else {
                    textSize(0.9 / size * cfg.size);
                }
                text(value, (x + 0.5) * cfg.size, (y + 0.55) * cfg.size);
                break;
        }
    }
}

function drawSimpleArrow(cfg, x, y, dir, color) {
    fill(color);
    stroke(0);
    strokeWeight(1);
    switch (dir) {
        case 'U':
            triangle((x + 0.5) * cfg.size, y * cfg.size, (x + 0.4) * cfg.size, (y + 0.1) * cfg.size, (x + 0.6) * cfg.size, (y + 0.1) * cfg.size);
            break
        case 'L':
            triangle(x * cfg.size, (y + 0.5) * cfg.size, (x + 0.1) * cfg.size, (y + 0.4) * cfg.size, (x + 0.1) * cfg.size, (y + 0.6) * cfg.size);
            break
        case 'R':
            triangle((x + 1) * cfg.size, (y + 0.5) * cfg.size, (x + 0.9) * cfg.size, (y + 0.4) * cfg.size, (x + 0.9) * cfg.size, (y + 0.6) * cfg.size);
            break
        case 'D':
        default:
            triangle((x + 0.5) * cfg.size, (y + 1) * cfg.size, (x + 0.4) * cfg.size, (y + 0.9) * cfg.size, (x + 0.6) * cfg.size, (y + 0.9) * cfg.size);
            break
    }
}

export function drawBreak(cfg, x, y) {
    stroke(255, 0, 0);
    strokeWeight(1);
    fill(0, 0, 0, 0.1);
    rectMode(CORNER);
    square(x * cfg.size, y * cfg.size, cfg.size);
}