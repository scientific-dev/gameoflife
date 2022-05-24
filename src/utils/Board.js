import { EXAMPLES } from "./Examples";

export default class Board {

    data = {}
    cellSize = 50;
    initialRow = 0;
    initialColumn = 0;
    generations = 0;
    rows = 0;
    columns = 0;
    speed = 1500;
    offsetX = 0;
    offsetY = 0;
    scrollOffset = 40;
    running = false;
    drawLines = true;
    onEachGen = () => {};
    onZoomChange = () => {};
    onGridChange = () => {};

    constructor (canvas = new HTMLCanvasElement()) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        canvas.onmousedown = ({ pageX, pageY }) => {
            let cX = pageX, cY = pageY;

            const onmove = (event) => {
                let o = this.offset, so = this.scrollOffset;
                
                this.offsetX += cX - event.pageX;
                this.offsetY += cY - event.pageY;

                this.offsetX = Math.max(-so, Math.min(this.offsetX, (this.columns * o - canvas.width) + so));
                this.offsetY = Math.max(-so, Math.min(this.offsetY, (this.rows * o - canvas.height) + so));

                cX = event.pageX, cY = event.pageY;
                this.fillBg().drawGame().plotFromData(this.data);
                this.canvas.style.cursor = 'grabbing';
            }

            const onup = () => {
                canvas.removeEventListener('mousemove', onmove);
                canvas.removeEventListener('mouseup', onup);
                this.canvas.style.cursor = 'default';
            }

            canvas.addEventListener('mousemove', onmove);
            canvas.addEventListener('mouseup', onup);
        };

        canvas.onclick = (event) => {
            if (this.running) return;
            let o = this.cellSize + this.ctx.lineWidth,
                c = Math.floor((event.pageX + this.offsetX) / o),
                r = Math.floor((event.pageY + this.offsetY) / o)
            
            if (c < 0 || r < 0) return;
            if (this.columns > c && this.rows > r) this.plot(c, r);
        };
    }

    get offset () {
        return this.cellSize + this.ctx.lineWidth;
    }

    fillBg () {
        this.ctx.fillStyle = '#18181d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fill();

        return this;
    }

    drawGame () {
        if (!this.drawLines) return this;

        let o = this.offset,
            w = this.columns * o,
            h = this.rows * o;

        for (let x = 0; x <= this.columns; x++) this.drawLine(x * o, 0, x * o, h);
        for (let y = 0; y <= this.rows; y++) this.drawLine(0, y * o, w, y * o);

        return this;
    }

    drawLine (x, y, lx, ly) {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(x - this.offsetX, y - this.offsetY);
        this.ctx.lineTo(lx - this.offsetX, ly - this.offsetY);
        this.ctx.stroke();
    }

    resize () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.lineWidth = this.drawLines ? (this.cellSize > 20) ? 1 : 0.5 : 0;

        if (!this.rows && !this.columns) {
            this.rows = Math.ceil(window.innerHeight / this.offset);
            this.columns = Math.ceil(window.innerWidth / this.offset);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.fillBg()
            .drawGame()
            .plotFromData(this.data);
    }

    plot (column, row) {
        let r = this.data[row] || (this.data[row] = new Set()),
            alive = !r.has(column);

        r[alive ? 'add' : 'delete'](column);
        this.fillCell(column, row, alive ? '#ffffff' : '#18181d')
    }

    plotFromData (data) {
        let rows = Object.entries(data);

        for (let i = 0; i < rows.length; i++) {
            let [r, columns] = rows[i];
            for (let c of columns)
                this.fillCell(c, r, '#ffffff');
        }
    }

    fillCell (column, row, color) {
        let o = this.offset,
            lw = this.ctx.lineWidth;

        this.ctx.fillStyle = color;
        this.ctx.fillRect((column * o) + lw - this.offsetX, (row * o) + lw - this.offsetY, this.cellSize - lw, this.cellSize - lw);
        this.ctx.fill();     
    }

    nextGeneration () {
        let newData = {},
            lastRow = new Set(),
            currentRow = new Set(),
            nextRow = this.data[0] || new Set();

        for (let r = 0; r < this.rows; r++) {
            let columns = new Set(nextRow),
                lastCol = 0,
                currentCol = 0,
                nextCol = columns.has(0);

            currentRow = nextRow;
            nextRow = this.data[r + 1] || new Set();

            for (let c = 0; c < this.columns; c++) {
                currentCol = nextCol;
                nextCol = columns.has(c + 1);

                let n = lastCol + nextCol;
                for (let i = -1; i < 2; i++) 
                    n += lastRow.has(c + i) + nextRow.has(c + i);

                if (n == 3) {
                    columns.add(c);
                    this.fillCell(c, r, '#ffffff');
                } else if (n != 2) {
                    columns.delete(c);
                    this.fillCell(c, r, '#18181d');
                }

                lastCol = currentCol;
            }

            if (columns.size) newData[r] = columns;
            lastRow = currentRow;
        }

        this.data = newData;
        this.generations += 1;
        this.onEachGen();
    }

    async start () {
        this.running = true;

        while (this.running) {
            this.nextGeneration();
            await new Promise(r => setTimeout(r, this.speed));
        }
    }

    stop () {
        this.running = false;
    }

    insertRawData (data) {
        this.data = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, new Set(v)]))
        this.plotFromData(this.data);
    }

    getRawData () {
        return JSON.stringify(Object.fromEntries(Object.entries(this.data).map(([k, v]) => [k, Array(...v)]))); 
    }

    plotExample (id) {
        let data = EXAMPLES[id];

        if (data.zoom) this.onZoomChange(data.zoom);
        this.onGridChange(`${Math.max(data.minGrid[0], this.rows)}x${Math.max(data.minGrid[1], this.columns)}`);
        this.insertRawData(data.data);
    }

    plotRandom () {
        let f = () => Math.floor(Math.random() * 2);

        for (let r = 0; r < this.rows; r++) {
            let columns = new Set();

            for (let c = 0; c < this.columns; c++)
                if (f()) columns.add(c);

            this.data[r] = columns;
        }

        this.plotFromData(this.data);
    }

    static parseGrid (grids) {
        let f = (x, y) => isNaN(x = parseInt(x)) ? y : x;
        let [r, c] = grids.split('x');

        return [f(r, this.rows), f(c, this.columns)];
    }

}