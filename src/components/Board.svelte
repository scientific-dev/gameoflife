<script>
    import { onMount } from 'svelte';
    import touchToMouse from 'svelte-touch-to-mouse';
    import Board from '../utils/Board';
    import { EXAMPLES } from '../utils/Examples';

    const setPlainTxt = x => plainTxt = x;
    
    let board = { running: false, rows: 10, columns: 10, scrollOffset: 40 }, 
        generations = 0,
        speed = 1.5,
        cellSize = 50,
        grids = '0x0',
        displayInfo = false,
        plainTxt = null;

    function plotExample (fn) {
        fn();
        board = board;
        generations = 0;
        displayInfo = false;
    }

    onMount(() => {
        let adjustScrollOffset = () => board.scrollOffset = window.innerWidth > 1024 ? 40 : 150,
            searchQuery = new URLSearchParams(window.location.search);

        board = new Board(document.getElementById('canvas'));
        board.onEachGen = () => generations = board.generations;
        board.onZoomChange = x => cellSize = x;
        board.onGridChange = x => grids = x;

        window.board = board;
        window.addEventListener('resize', () => {
            board.resize();
            adjustScrollOffset();
        });

        speed = board.speed / 1000;
        cellSize = board.cellSize;
        grids = `${board.rows}x${board.columns}`;

        touchToMouse('canvas');
        adjustScrollOffset();

        let txtQuery = searchQuery.get('txt'),
            zoom = searchQuery.get('zoom'),
            grid = searchQuery.get('grid'),
            f = (x, y) => isNaN(x) ? y : x;

        if (txtQuery) board.plotFromPlaintxt(decodeURIComponent(txtQuery), 0);
        if (zoom) cellSize = f(parseInt(zoom), cellSize);
        if (grid) grids = grid;
    });

    $: board.speed = speed * 1000;
    $: {
        board.cellSize = cellSize;
        board.resize?.();
    }

    $: {
        [board.rows, board.columns] = Board.parseGrid(grids);
        board.resize?.();
    }

    $: setPlainTxt(displayInfo ? board.toPlaintxt() : null);
</script>

<div style={displayInfo ? 'opacity: 0.7;' : ''}>  
    <canvas 
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
    />

    <h1 class="float text-shadow">Game of Life</h1>

    <div class="float panel">
        <a 
            class="shadow"
            href="#start"
            on:click={() => {
                board[board.running ? 'stop' : 'start']();
                board = board;
            }}
        >{board.running ? 'Stop' : 'Start'}</a>

        {#if !board.running}
            <a class="shadow" href="#start" on:click={() => board.nextGeneration()}>Next</a>
            <a class="shadow" href="#start" on:click={() => board.fillBg().drawGame().data = {}}>Clear</a>
        {/if}

        <a class="shadow" href="#start">Speed: <input type="number" min=0.1 bind:value={speed}/>s</a>
        <a class="shadow" href="#start">Size: <input type="number" min=5 bind:value={cellSize}/></a>
        <a class="shadow" href="#start">Grids: <input bind:value={grids}/></a>

        <span class="shadow">Generations: {generations}</span>
        <a class="shadow" href="#info" on:click={() => {
            board.stop();
            board = board;
            displayInfo = true;
        }}>...</a>
    </div>

</div>

{#if displayInfo}
    <div class="infotab float">
        <h2>Game of Life</h2>

        <p>
            The Game of Life, also known simply as Life, is a cellular automaton devised by the British mathematician John Horton Conway in 1970. It is a zero-player game, meaning that its evolution is determined by its initial state, requiring no further input. One interacts with the Game of Life by creating an initial configuration and observing how it evolves. It is Turing complete and can simulate a universal constructor or any other Turing machine.
            More in <a href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life" target="_blank">Wikipedia</a>.
        </p>

        <a class="info-btn" href="#default" on:click={() => displayInfo = false}>Close</a>

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
            {#each Object.entries(EXAMPLES) as [id, data]}
                <a 
                    class="info-btn" 
                    href="#start" 
                    on:click={() => plotExample(() => board.plotExample(id))}
                >{data.name}</a>
            {/each}

            <a class="info-btn" href="#start" on:click={() => plotExample(() => board.plotRandom())}>Random</a>
        </div>

        <h3>Share: </h3>

        <div style="margin-left: 10px;">
            <p>Share the Game of life layout you are playing with to your friends.</p>
            <input
                class="link-display shadow" 
                id="link_display"
                value="{window.location.origin}{window.location.pathname}?txt={plainTxt.replace(/\n/g, '%0A')}&zoom={cellSize}&grid={grids}"
                disabled=true
            />

            <a
                class="info-btn wide-btn"
                href="#info"
                on:click={({ target }) => {
                    let input = document.getElementById('link_display');
                    input.select();
                    input.setSelectionRange(0, 9999);
                    navigator.clipboard.writeText(input.value);
                    target.innerHTML = 'Copied!';
                }}
            >Copy Link</a>
        </div>

        <h3>Plaintext:</h3>

        <div style="margin-left: 10px;">
            <p style="margin-bottom: 7px;">Play the Game of life using the <a href="https://conwaylife.com/wiki/Plaintext">Plaintext format</a>.</p>
            <textarea id="plaintext" bind:value={plainTxt}/>

            <a 
                class="info-btn wide-btn" 
                href="#start"
                on:click={() => {
                    board.plotFromPlaintxt(document.getElementById('plaintext').value);
                    displayInfo = false;
                }}
            >Start</a>
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

    .wide-btn {
        width: calc(100% - 20px);
        margin-left: 0;
        text-align: center;
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

    .infotab:not(textarea)::-webkit-scrollbar-thumb {
        background-color: #18181d!important;
    }

    textarea {
        width: calc(100% - 30px);
        height: 200px;
        outline: none;
        border-radius: 4px;
        resize: vertical;
        background-color: #18181d;
        color: white;
        padding: 15px;
        white-space: pre;
        overflow-x: auto;
    }

    .link-display {
        display: block;
        width: calc(100% - 10px);
        padding: 5px;
        border-radius: 3px;
        margin-top: -10px;
        margin-bottom: 5px;
        font-family: "Recursive";
        font-size: 16px;
        background-color: rgb(255, 255, 255);
        color: black;
    }
</style>