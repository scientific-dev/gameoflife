<script>
    import { onMount } from 'svelte';
    import touchToMouse from 'svelte-touch-to-mouse';
    import Board from '../utils/Board';

    let board = { running: false, rows: 10, columns: 10, scrollOffset: 40 }, 
        generations = 0,
        speed = 1.5,
        cellSize = 50,
        grids = '0x0',
        displayInfo = false;

    function plotExample (fn) {
        fn();
        board = board;
        generations = 0;
        displayInfo = false;
    }

    onMount(() => {
        let sOf = () => board.scrollOffset = window.innerWidth > 1024 ? 40 : 150;
        board = new Board(document.getElementById('canvas'));
        board.onEachGen = () => generations = board.generations;

        window.board = board;
        window.addEventListener('resize', () => {
            board.resize();
            sOf();
        });

        speed = board.speed / 1000;
        cellSize = board.cellSize;
        grids = `${board.rows}x${board.columns}`;

        touchToMouse('canvas');
        sOf();
    });

    $: board.speed = speed * 1000;
    $: {
        board.cellSize = cellSize;
        board.resize?.();
    }

    $: {
        let f = (x, y) => isNaN(x = parseInt(x)) ? y : x;
        let [r, c] = grids.split('x');

        board.rows = f(r, board.rows);
        board.columns = f(c, board.columns);
        board.resize?.();
    }
</script>

<div style={displayInfo ? 'opacity: 0.7;' : ''}>  
    <canvas 
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
    />

    <h1 class="float">Game of Life</h1>

    <div class="float panel">
        <a 
            href="#start"
            on:click={() => {
                board[board.running ? 'stop' : 'start']();
                board = board;
            }}
        >{board.running ? 'Stop' : 'Start'}</a>

        {#if !board.running}
            <a href="#start" on:click={() => board.nextGeneration()}>Next</a>
            <a href="#start" on:click={() => board.fillBg().drawGame()}>Clear</a>
        {/if}

        <a href="#start">Speed: <input type="number" min=0.1 bind:value={speed}/>s</a>
        <a href="#start">Size: <input type="number" min=5 bind:value={cellSize}/></a>
        <a href="#start">Grids: <input bind:value={grids}/></a>

        <span>Generations: {generations}</span>
        <a href="#info" on:click={() => displayInfo = true}>i</a>
    </div>

</div>

{#if displayInfo}
    <div class="infotab float">
        <h2>Game of Life</h2>

        <p>
            The Game of Life, also known simply as Life, is a cellular automaton devised by the British mathematician John Horton Conway in 1970. It is a zero-player game, meaning that its evolution is determined by its initial state, requiring no further input. One interacts with the Game of Life by creating an initial configuration and observing how it evolves. It is Turing complete and can simulate a universal constructor or any other Turing machine.
            More in <a href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life" target="_blank">Wikipedia</a>.
        </p>

        <h3>Rules</h3>

        <ol>
            <li>Each cell has 8 neighbours surrounding it.</li>
            <li>Coloured cells represents that the cell is alive while uncoloured cells represents that the cell is dead.</li>
            <li>Any live cell with fewer than two live neighbours dies, as if by underpopulation.</li>
            <li>Any live cell with two or three live neighbours lives on to the next generation.</li>
            <li>Any live cell with more than three live neighbours dies, as if by overpopulation.</li>
            <li>Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.</li>
        </ol>

        <h3>Examples:</h3>

        <div style="margin-left: 10px;">
            <a 
                class="info-btn" 
                href="#start" 
                on:click={() => plotExample(() => {
                    board.plotExample('GOSPER_GLIDER_GUN')
                    grids = '50x50';
                })}
            >Gosper Glider Gun</a>

            <a class="info-btn" href="#start" on:click={() => plotExample(() => board.plotRandom())}>Random</a>
        </div>

        <h3>Additional Settings</h3>

        <div>
            <input 
                type="checkbox" 
                name="lines" 
                bind:checked={board.drawLines}
            />
            <label for="lines">Lines</label>
        </div>

        <br/>
        <a class="info-btn" href="#default" on:click={() => displayInfo = false}>Close</a>

        <hr/>

        <p>
            Made by <a target="_blank" href="https://github.com/scientific-dev">TheSudarsanDev</a><br/>
            TheSudarsanDev © {new Date().getFullYear()}
        </p>
    </div>
{/if}

<style>
    canvas {
        width: 100vw;
        height: 100vh;
        -webkit-touch-callout: none;
        -ms-touch-action: none; 
        touch-action: none;
    }

    .float {
        z-index: 1;
        position: fixed;
    }

    h1 {
        margin: 0;
        font-size: 25px;
        left: 10px;
        top: 10px;
        user-select: none;
    }

    .panel {
        bottom: 11px;
        left: 16px;
        margin-right: 8px;
    }

    .panel a, .panel span, .info-btn {
        text-decoration: none;
        padding: 5px 10px;
        border-radius: 3px;
        margin-left: 2px;
        margin-bottom: 4px;
        display: inline-block;
    }

    .panel a, .panel span {
        background-color: white;
        color: black;
    }

    .panel a:hover, .panel span:hover {
        background-color: whitesmoke;
    }

    .info-btn {
        background-color: #18181d;
        color: white!important;;
    }

    input {
        outline: none;
        color: white;
        background-color: #18181d;
        border: none;
        border-radius: 2px;
        width: 50px;
        margin-top: -5px;
        display: inline-block;
    }

    .infotab {
        background-color: whitesmoke;
        padding: 25px;
        border-radius: 4px;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 20px;
        color: black!important;
        overflow-y: auto;
    }

    .infotab h2 {
        margin: 0;
    }

    .infotab a {
        color: black;
        font-weight: bold;
    }

    .infotab div {
        margin-top: -10px;
    }
</style>