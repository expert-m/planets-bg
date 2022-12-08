class Drawer {
    constructor() {
        this.canvas = document.getElementById('bg')
        this.ctx = this.canvas.getContext('2d')

        this.matrix = '-   '.split('')
        this.fontSize = 14

        this.update = this.update.bind(this)
    }

    run() {
        this.init()
        this.fill()

        window.onresize = (event) => {
            this.init()
            this.fill()
        }

        setInterval(this.update, 35)
    }

    init() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight

        this.drops = []
        this.dropsLength = this.canvas.width / this.fontSize

        for (let i = 0; i < this.canvas.height / this.fontSize; ++i) {
            this.drops.push(0)
        }
    }

    update() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.fillStyle = '#fff'
        this.ctx.font = `${this.fontSize}px arial`

        for (let i = 0; i < this.drops.length; ++i) {
            const text = this.matrix[Math.floor(Math.random() * this.matrix.length)]
            const x = --this.drops[i] * this.fontSize
            const y = i * this.fontSize

            if (x < 0) {
                if (Math.random() > 0.975) {
                    this.drops[i] = this.dropsLength
                }

                continue
            }

            this.ctx.fillText(text, x, y)
        }
    }

    fill() {
        for (let i = 0; i < this.canvas.width / this.fontSize; ++i) {
            this.update()
        }
    }
}

const drawer = new Drawer()

document.addEventListener('DOMContentLoaded', () => {
    drawer.run()
})
