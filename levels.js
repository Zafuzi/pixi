// each level increases either the pixis or the grid size
// 0 = empty
// 1 = floor
// 2 = goal
// 3 = spawner location
// 100+ = portal (connects to other 100+, add more numbers if you need more portals)

let levels = [{
        name: "Level 1",
        pixi_count: 10,
        grid: [
            [2, 1, 1, 1],
            [0, 0, 3, 1]
        ],
        outline: [
            0, 0,
            4, 0,
            4, 2,
            2, 2,
            2, 1,
            0, 1,
            0, 0,
        ],
        speed: 300
    },
    {
        name: "Level 2",
        pixi_count: 15,
        grid: [
            [0, 1, 0, 1, 0],
            [3, 1, 1, 1, 2],
            [0, 1, 0, 1, 0]
        ],
        outline: [
            0, 1,
            1, 1,
            1, 0,
            2, 0,
            2, 1,
            3, 1,
            3, 0,
            4, 0,
            4, 1,
            5, 1,
            5, 2,
            4, 2,
            4, 3,
            3, 3,
            3, 2,
            2, 2,
            2, 3,
            1, 3,
            1, 2,
            0, 2,
            0, 1
        ],
        speed: 100
    },
    {
        name: "Level 3",
        pixi_count: 25,
        grid: [
            [1, 1, 1, 1],
            [1, 1, 1, 1],
            [1, 3, 1, 2],
            [1, 1, 1, 0]
        ],
        outline: [
            0, 0,
            4, 0,
            4, 3,
            3, 3,
            3, 4,
            0, 4,
            0, 0
        ],
        speed: 100
    },
    {
        name: "Level 4",
        pixi_count: 50,
        grid: [
            [0, 0, 0, 2],
            [0, 1, 0, 1],
            [1, 3, 0, 1],
            [0, 1, 1, 1]
        ],
        outline: [
            3, 0,
            4, 0,
            4, 4,
            1, 4,
            1, 3,
            0, 3,
            0, 2,
            1, 2,
            1, 1,
            2, 1,
            2, 3,
            3, 3,
            3, 0
        ],
        speed: 100
    }
]