let canvas,
    ctx,
    then = performance.now(),
    FPS = 120,
    t = 0,
    grid = [],
    grid_size_x = 0,
    grid_size_y = 0,
    grid_cell_w = 0,
    grid_cell_h = 0,
    grid_padding = 100,
    cell_line_width = 1,
    current_level = 0,
    mx = 0,
    my = 0,
    mousedown = false,
    outline = [],
    pixis = [],
    pixis_in_goal = 0,
    winner = false;

let changing = false;

// anything in here will be run again when the window resizes
let update = function() {

    old_width = canvas.width;
    old_height = canvas.height;
    new_width = window.innerWidth || window.clientWidth || window.scrollWidth;
    new_height = window.innerHeight || window.ClientHeight || window.scrollWidth;


    grid_size_x = levels[current_level].grid[0].length;
    grid_size_y = levels[current_level].grid.length;

    let greater, smaller;
    if (old_width != new_width || old_height != new_height) {
        // detect resize
        canvas.width = new_width;
        canvas.height = new_height;

        // resize grid
        greater = grid_size_x >= grid_size_y ? grid_size_x : grid_size_y;
        smaller = canvas.width <= canvas.height ? canvas.width : canvas.height;
        grid_cell_w = Math.floor((smaller - grid_padding) / greater);
        grid_cell_h = Math.floor((smaller - grid_padding) / greater);

        grid_size_x = levels[current_level].grid[0].length;
        grid_size_y = levels[current_level].grid.length;

        change_level(current_level);
    }

    if (pixis_in_goal == pixis.length && t > 200 && !changing) {
        pixis_in_goal = 0;
        t = 0;
        if (current_level == levels.length - 1) {
            // WINNER!
            winner = true;
            changing = true;
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } else {
            changing = true;
            change_level(current_level + 1);
        }
    }

    grid.forEach((cell, i) => {

        // determine outline path?
        if (hit(cell)) {
            cell.hover = true;
        }

        if (mousedown && hit(cell)) {
            if (t - cell.changed_close > 20 || !cell.changed_close) {
                cell.closed = !cell.closed
                cell.changed_close = t;
            }
        }
    })

    outline = [];
    for (let c = 0; c < levels[current_level].outline.length - 1; c += 2) {
        let x = levels[current_level].outline[c];
        let y = levels[current_level].outline[c + 1];
        let grid_width = grid_size_x * grid_cell_w;
        let grid_height = grid_size_y * grid_cell_h;
        let offset_x = Math.floor((canvas.width / 2) - (grid_width / 2));
        let offset_y = Math.floor((canvas.height / 2) - (grid_height / 2));
        outline.push(
            (offset_x + (x * grid_cell_w)),
            (offset_y + (y * grid_cell_h))
        );
    }

    pixis_in_goal = 0;
    pixis.forEach(p => {
        if (p.in_goal) {
            pixis_in_goal++;
        }
    })
}

let change_level = function(num) {

    current_level = num;
    console.log("Changing level: ", num, levels[current_level].name);
    pixis = [];
    grid = [];

    grid_size_x = levels[current_level].grid[0].length;
    grid_size_y = levels[current_level].grid.length;

    grid = build_grid(grid_size_x, grid_size_y, grid_cell_w, grid_cell_h);

    let spawner_cell = grid.filter(g => {
        return g.spawner;
    })[0];

    if (spawner_cell) {
        for (let i = 0; i < levels[current_level].pixi_count; i++) {
            pixis.push(
                // the 5's are needed because the pixis have a size
                // if you don't have the correct size they will spawn on the edge
                new pixi(
                    rand_in_range(spawner_cell.x + 5, spawner_cell.x + spawner_cell.w - 5),
                    rand_in_range(spawner_cell.y + 5, spawner_cell.y + spawner_cell.h - 5),
                    levels[current_level].speed
                )
            );
        }
    }

    changing = false;
}

let pixi = function(start_x, start_y, speed = 100) {
    let o = {
        start_x: start_x,
        start_y: start_y,
        x: start_x,
        y: start_y,
        vx: rand_in_range(0, 100) > 50 ? 2 : -2,
        vy: rand_in_range(0, 100) > 50 ? 2 : -2,
        w: 5,
        h: 5,
        speed: speed,
        trapped: false
    };

    o.change_dir = function(dir) {
        let self = this;
        dir *= -1;
        return dir;
    }

    o.change_y = function() {
        let self = this;
        self.vy = self.change_dir(self.vy);
    }

    o.change_x = function() {
        let self = this;
        self.vx = self.change_dir(self.vx);
    }

    o.update = function() {
        let self = this;
        self.collided = false;

        if (!self.trapped) {
            self.x += self.vx;
            self.y += self.vy;
        }

        if (self.x > canvas.width || self.x < 0) {
            self.x = self.start_x;
        }
        if (self.y > canvas.width || self.y < 0) {
            self.y = self.start_y;
        }

        for (let c = 2; c < outline.length - 1; c += 2) {
            let x1 = outline[c - 2],
                y1 = outline[c - 1],
                x2 = outline[c],
                y2 = outline[c + 1];

            let h = lineRect(x1, y1, x2, y2, self.x, self.y, self.w, self.h);
            if (h) {
                self.collided = true;
                // yes I know this are backwards, look at the lineLine function for why, the math is beyond me
                if (h.left || h.right) {
                    self.change_y();
                }
                if (h.top || h.bottom) {
                    self.change_x();
                }
            }
        }
        // if we already collided with a wall then skip this step
        if (!self.collided) {
            grid.forEach(cell => {
                if (cell.closed) {
                    self.test_hit(cell);
                }
            })
        }

        grid.forEach(cell => {
            if (hit_rect(self, cell)) {
                self.trapped = cell.closed;
                if (cell.goal) {
                    self.in_goal = true;
                } else {
                    self.in_goal = false;
                }
            }
        });

    }

    o.test_hit = function(cell) {
        let self = this;
        // top
        let h = lineRect(cell.x, cell.y, cell.x + cell.w, cell.y, self.x, self.y, self.w, self.h);
        if (h) {
            self.collided = true;
            // yes I know this are backwards, look at the lineLine function for why, the math is beyond me
            if (h.left || h.right) {
                self.change_y();
            }
            if (h.top || h.bottom) {
                self.change_x();
            }
        }

        // left
        h = lineRect(cell.x, cell.y, cell.x, cell.y + cell.h, self.x, self.y, self.w, self.h);
        if (h) {
            self.collided = true;
            // yes I know this are backwards, look at the lineLine function for why, the math is beyond me
            if (h.left || h.right) {
                self.change_y();
            }
            if (h.top || h.bottom) {
                self.change_x();
            }
        }

        // right
        h = lineRect(cell.x + cell.w, cell.y, cell.x + cell.w, cell.y + cell.h, self.x, self.y, self.w, self.h);
        if (h) {
            self.collided = true;
            // yes I know this are backwards, look at the lineLine function for why, the math is beyond me
            if (h.left || h.right) {
                self.change_y();
            }
            if (h.top || h.bottom) {
                self.change_x();
            }
        }

        // bottom
        h = lineRect(cell.x, cell.y + cell.h, cell.x + cell.w, cell.y + cell.h, self.x, self.y, self.w, self.h);
        if (h) {
            self.collided = true;
            // yes I know this are backwards, look at the lineLine function for why, the math is beyond me
            if (h.left || h.right) {
                self.change_y();
            }
            if (h.top || h.bottom) {
                self.change_x();
            }
        }
    }

    o.draw = function() {
        let self = this;
        ctx.beginPath();
        ctx.fillRect(self.x, self.y, self.w, self.h);
        ctx.closePath();
    }

    return o;
}

let loop = function() {
    t++;

    update();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "128px sans-serif";
    ctx.fillStyle = "salmon";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "slateblue";
    if (winner) {
        ctx.fillText("WINNER!", canvas.width / 2 - ctx.measureText("WINNER!").width / 2, canvas.height / 2);
    } else {
        ctx.strokeStyle = "rgb(150, 28, 14)";
        ctx.lineWidth = cell_line_width;

        ctx.beginPath();
        ctx.moveTo(outline[0], outline[1]);
        for (let xy = 2; xy < outline.length - 1; xy += 2) {
            ctx.lineTo(outline[xy], outline[xy + 1]);
        }
        ctx.stroke();
        ctx.closePath();

        grid.forEach(cell => {
            ctx.beginPath();
            if (cell.goal) {
                ctx.fillStyle = "rgba(0,122,50,.3)";
            } else {
                ctx.fillStyle = "rgba(255,255,255,.01)";
            }
            if (cell.closed) {
                ctx.fillStyle = "rgba(106, 90, 205, .2)";
            }

            if (cell.portal) {
                ctx.fillStyle = "rgba(255, 0, 0, .2)";
            }
            ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
            ctx.closePath();
        })

        let trapped_pixis = pixis.filter(p => {
            return p.trapped && !p.in_goal;
        });

        ctx.fillStyle = "red";
        trapped_pixis.forEach(p => {
            p.update();
        })

        trapped_pixis.forEach(p => {
            p.draw();
        })

        let free_pixis = pixis.filter(p => {
            return !p.trapped && !p.in_goal;
        })
        ctx.fillStyle = "white";
        free_pixis.forEach(p => {
            p.update();
        })

        free_pixis.forEach(p => {
            p.draw();
        })

        let goal_pixis = pixis.filter(p => {
            return p.in_goal;
        })
        ctx.fillStyle = "green";
        goal_pixis.forEach(p => {
            p.update();
        })

        goal_pixis.forEach(p => {
            p.draw();
        })
    }

    requestAnimationFrame(FPS_LOCK);
}

let build_grid = function(
    size_x = 0,
    size_y = 0,
    w = 10,
    h = 10
) {
    let o = [];
    // find the center x and y of our grid
    let grid_width = size_x * w;
    let grid_height = size_y * h;
    let offset_x = Math.floor((canvas.width / 2) - (grid_width / 2));
    let offset_y = Math.floor((canvas.height / 2) - (grid_height / 2));

    for (let row = 0; row < size_y; row++) {
        for (let col = 0; col < size_x; col++) {
            if (levels[current_level].grid[row][col] != 0) {
                let r = {
                    x: (offset_x + (col * w)),
                    y: (offset_y + (row * h)),
                    w: w,
                    h: h,
                    row: row,
                    col: col,
                    val: levels[current_level].grid[row][col],
                    closed: false,
                    hover: false,
                    goal: levels[current_level].grid[row][col] == 2,
                    spawner: levels[current_level].grid[row][col] == 3,
                    portal: levels[current_level].grid[row][col] >= 100
                }

                o.push(r);
            }
        }
    }
    return o;
}

// GAME START
addEventListener("DOMContentLoaded", dcl => {
    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d");

    grid_size_x = levels[current_level].grid[0].length;
    grid_size_y = levels[current_level].grid.length;

    ctx.font = '296px sans-serif';
    update();
    change_level(0);

    requestAnimationFrame(FPS_LOCK);
})

// HELPERS
addEventListener("resize", r => {
    update();
})

addEventListener("mousemove", mm => {
    mx = mm.clientX;
    my = mm.clientY;
})

addEventListener("mousedown", md => {
    mousedown = true;
})

addEventListener("mouseup", mu => {
    mousedown = false;
})

let FPS_LOCK = function() {
    let now = performance.now();

    let delta = now - then;
    if (delta > 1000 / FPS) {
        then = now - (delta % (1000 / FPS));
        loop();
    } else {
        requestAnimationFrame(FPS_LOCK);
    }
}

function rand_in_range(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

let hit = function(f) {
    let x = f.x,
        y = f.y;

    if (mx < x) { return false; }
    if (mx > x + f.w) { return false; }
    if (my < y) { return false; }
    if (my > y + f.h) { return false; }
    return true;
}

let hit_rect = function(r1, r2) {
    if (r1.x < r2.x) { return false; }
    if (r1.x + r1.w > r2.x + r2.w) { return false; }
    if (r1.y < r2.y) { return false; }
    if (r1.y + r1.h > r2.y + r2.h) { return false; }
    return true;
}

// LINE/RECTANGLE
let lineRect = function(x1, y1, x2, y2, rx, ry, rw, rh) {

    // check if the line has hit any of the rectangle's sides
    // uses the Line/Line function below
    let left = lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
    let right = lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
    let top = lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
    let bottom = lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);

    // if ANY of the above are true, the line
    // has hit the rectangle
    if (left || right || top || bottom) {
        return {
            left: left,
            right: right,
            top: top,
            bottom: bottom
        }
    }
    return false;
}

// LINE/LINE
let lineLine = function(x1, y1, x2, y2, x3, y3, x4, y4) {

    // calculate the direction of the lines
    let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // if uA and uB are between 0-1, lines are colliding
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        return true;
    }
    return false;
}

function hit_poly(poly_array, x, y, w, h) {
    var inside = false;
    var test_x = x + w;
    var test_y = y + h;
    for (var i = 0; i < (poly_array.length - 1); i++) {

        var p1_x = poly_array[i][0];
        var p1_y = poly_array[i][1];
        var p2_x = poly_array[i + 1][0];
        var p2_y = poly_array[i + 1][1];

        // this edge is crossing the horizontal ray of testpoint
        if ((p1_y < test_y && p2_y >= test_y) || (p2_y < test_y && p1_y >= test_y)) {
            // checking special cases (holes, self-crossings, self-overlapping, horizontal edges, etc.)
            if ((p1_x + (test_y - p1_y) / (p2_y - p1_y) * (p2_x - p1_x)) < test_x) {
                inside = !inside;
            }
        }
    }
    return inside;
}