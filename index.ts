import {Server} from 'uws';
const gameServer = new Server({
    port: 8000
});
let colors = ["red","green","blue","cyan","yellow","magenta"];
let turn;
let clients = [];
function getInitalGrid(){
    let initialGrid = [];
    for(let i=0; i<9 ; i++){
        for(let j=0;j< 6;j++){
            let row = i;
            let column = j;
            let maxBalls = 3;
            if(row === 8 || row === 0 ){
                maxBalls--;
                if(column === 5 || column === 0)
                    maxBalls--;
            }
            else if(column === 5 || column === 0){
                maxBalls--;
                if(row === 8 || row === 0 )
                    maxBalls--;
            }
            initialGrid.push({
                row: i,
                column: j,
                color: "none",
                isFull: false,
                maxBalls: maxBalls,
                noOfBalls: 0
            })
        }
    }
    return initialGrid;
}
let gameGrid;
let clientColorMap = []
let trnvar = 0;
gameServer.on("connection",(client)=>{
    let ccMap = {
        client: client,
        color: colors.pop(),
        score: -1
    }
    clientColorMap.push(ccMap);
    console.log("New Client Connected","Total Number of Clients on Server", clientColorMap.length, "with Color", ccMap.color);
    client.send(JSON.stringify({
        userColor: ccMap.color,
        userScore: 0
    }));
    turn = clientColorMap[trnvar];
    if(clientColorMap.length === 1)
        gameGrid = getInitalGrid();
        if(turn!== undefined)
    client.send(JSON.stringify({gameGrid:gameGrid,turn:turn.color}))
    client.on("message",(message)=>{
        let data = JSON.parse(message)
        // console.log(data)
        // console.log(data.row,data.column)
        let userColor = getClientColor(clientColorMap,client);
        let box = getBox(data.row,data.column)
        // console.log(box)
        // updateBoxColor(data.row,data.column,userColor);
        // updateBox(data.row,data.column,{color: userColor,noOfBalls : box.noOfBalls+1});

            if(turn.color === userColor && (turn.score!=0 || trnvar === 0)){
                logic(box,userColor,false);
                trnvar++;
                turn = clientColorMap[trnvar%clientColorMap.length]
                score();
                console.log(clientColorMap)
            }

        // console.log(gameGrid)
        clientColorMap.forEach((c)=>{
            c.client.send(JSON.stringify({gameGrid:gameGrid,turn:turn.color}))
                // console.log(userColor)   
        })

    })
    client.on("close",()=>{
        clientColorMap = clientColorMap.filter((c)=>{
            if(c.client === client){
                colors.push(c.color)
                if(turn !== undefined)
                if(turn.color === c.color)
                    turn =  clientColorMap[clientColorMap.indexOf(turn)+1]
            }
            return c.client !== client
        })
    })
})


function getClientColor(clientColorMap,client){
    let color;
clientColorMap.forEach((c)=>{
        if(c.client === client)
           color = c.color;
    })
    return color;
}

function getBox(row,column){
    let box;
gameGrid.forEach((c)=>{
        if(c.row === row && c.column === column)
           box = c;
    })
    return box;
}

function updateBox(row,column, params){
    gameGrid = gameGrid.map((c)=>{
        if(c.row === row && c.column === column){
            c = {...c,...params};
            return c;
        }
        else 
        return c;
    })
}

function logic(box,color,isExplosion){
    if((box.color === color || box.color === 'none')|| isExplosion){               
        if(box.isFull){
            box.noOfBalls = 0;
            box.color = 'none'
            box.isFull = false;
            getSideBoxes(box.row,box.column).forEach((sb)=>{
                logic(sb,color,true)
            })
        }else{
            box.noOfBalls+=1;
            box.color = color;
        } 
        box.isFull = box.noOfBalls >= box.maxBalls;
    }
}

function getSideBoxes(row,column){
     let boxes=[];
     gameGrid.forEach((c)=>{
        if(c.row === row-1 && c.column === column)
           boxes.push(c);
    })
    gameGrid.forEach((c)=>{
        if(c.row === row && c.column === column-1)
           boxes.push(c);
    })
    gameGrid.forEach((c)=>{
        if(c.row === row+1 && c.column === column)
           boxes.push(c);
    })
    gameGrid.forEach((c)=>{
        if(c.row === row && c.column === column+1)
           boxes.push(c);
    })
    return boxes;
}


function score(){
    clientColorMap.forEach((c)=>{
        if(c.score !== -1)
        c.score = 0;
    })
    gameGrid.forEach((b)=>{
        
        clientColorMap.forEach((c)=>{
            
            if(c.color === b.color){
                if(c.score === -1 )
                    c.score+=2;
                else
                    c.score+=b.noOfBalls;
            }
        })
    })
}