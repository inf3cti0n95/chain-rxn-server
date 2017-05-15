"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
exports.__esModule = true;
var uws_1 = require("uws");
var gameServer = new uws_1.Server({
    port: 8000
});
var colors = ["red", "green", "blue", "cyan", "yellow", "magenta"];
var turn;
var clients = [];
function getInitalGrid() {
    var initialGrid = [];
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 6; j++) {
            var row = i;
            var column = j;
            var maxBalls = 3;
            if (row === 8 || row === 0) {
                maxBalls--;
                if (column === 5 || column === 0)
                    maxBalls--;
            }
            else if (column === 5 || column === 0) {
                maxBalls--;
                if (row === 8 || row === 0)
                    maxBalls--;
            }
            initialGrid.push({
                row: i,
                column: j,
                color: "none",
                isFull: false,
                maxBalls: maxBalls,
                noOfBalls: 0
            });
        }
    }
    return initialGrid;
}
var gameGrid;
var clientColorMap = [];
var trnvar = 0;
gameServer.on("connection", function (client) {
    var ccMap = {
        client: client,
        color: colors.pop(),
        score: -1
    };
    clientColorMap.push(ccMap);
    console.log("New Client Connected", "Total Number of Clients on Server", clientColorMap.length, "with Color", ccMap.color);
    client.send(JSON.stringify({
        userColor: ccMap.color,
        userScore: 0
    }));
    turn = clientColorMap[0];
    if (clientColorMap.length === 1)
        gameGrid = getInitalGrid();
    if (turn !== undefined)
        client.send(JSON.stringify({ gameGrid: gameGrid, turn: turn.color }));
    client.on("message", function (message) {
        var data = JSON.parse(message);
        // console.log(data)
        // console.log(data.row,data.column)
        var userColor = getClientColor(clientColorMap, client);
        var box = getBox(data.row, data.column);
        // console.log(box)
        // updateBoxColor(data.row,data.column,userColor);
        // updateBox(data.row,data.column,{color: userColor,noOfBalls : box.noOfBalls+1});
        if (turn.color === userColor && (turn.score != 0 || trnvar === 0)) {
            logic(box, userColor, false);
            trnvar++;
            turn = clientColorMap[trnvar % clientColorMap.length];
            score();
            console.log(clientColorMap);
        }
        // console.log(gameGrid)
        clientColorMap.forEach(function (c) {
            c.client.send(JSON.stringify({ gameGrid: gameGrid, turn: turn.color }));
            // console.log(userColor)   
        });
    });
    client.on("close", function () {
        clientColorMap = clientColorMap.filter(function (c) {
            if (c.client === client) {
                colors.push(c.color);
                if (turn !== undefined)
                    if (turn.color === c.color)
                        turn = clientColorMap[clientColorMap.indexOf(turn) + 1];
            }
            return c.client !== client;
        });
    });
});
function getClientColor(clientColorMap, client) {
    var color;
    clientColorMap.forEach(function (c) {
        if (c.client === client)
            color = c.color;
    });
    return color;
}
function getBox(row, column) {
    var box;
    gameGrid.forEach(function (c) {
        if (c.row === row && c.column === column)
            box = c;
    });
    return box;
}
function updateBox(row, column, params) {
    gameGrid = gameGrid.map(function (c) {
        if (c.row === row && c.column === column) {
            c = __assign({}, c, params);
            return c;
        }
        else
            return c;
    });
}
function logic(box, color, isExplosion) {
    if ((box.color === color || box.color === 'none') || isExplosion) {
        if (box.isFull) {
            box.noOfBalls = 0;
            box.color = 'none';
            box.isFull = false;
            getSideBoxes(box.row, box.column).forEach(function (sb) {
                logic(sb, color, true);
            });
        }
        else {
            box.noOfBalls += 1;
            box.color = color;
        }
        box.isFull = box.noOfBalls >= box.maxBalls;
    }
}
function getSideBoxes(row, column) {
    var boxes = [];
    gameGrid.forEach(function (c) {
        if (c.row === row - 1 && c.column === column)
            boxes.push(c);
    });
    gameGrid.forEach(function (c) {
        if (c.row === row && c.column === column - 1)
            boxes.push(c);
    });
    gameGrid.forEach(function (c) {
        if (c.row === row + 1 && c.column === column)
            boxes.push(c);
    });
    gameGrid.forEach(function (c) {
        if (c.row === row && c.column === column + 1)
            boxes.push(c);
    });
    return boxes;
}
function score() {
    clientColorMap.forEach(function (c) {
        if (c.score !== -1)
            c.score = 0;
    });
    gameGrid.forEach(function (b) {
        clientColorMap.forEach(function (c) {
            if (c.color === b.color) {
                if (c.score === -1)
                    c.score += 2;
                else
                    c.score += b.noOfBalls;
            }
        });
    });
}
