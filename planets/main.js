function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getSpeedBetweenTwoVectors(firstVector, secondVector) {
    return Math.hypot(firstVector[0] - secondVector[0], firstVector[1] - secondVector[1])
}

function getDistanceBetweenTwoPoints(firstPoint, secondPoint) {
    return Math.hypot(firstPoint[0] - secondPoint[0], firstPoint[1] - secondPoint[1])
}

function getDiffsBetweenTwoPoints(firstPoint, secondPoint) {
    return [firstPoint[0] - secondPoint[0], firstPoint[1] - secondPoint[1]]
}

const WorldParams = Object.freeze({
    'METER': 1_000,
    'RADIUS_WEIGHT_FACTOR': 100 * window.devicePixelRatio,
    'MAX_ELEMENT_WEIGHT': 200_000,
    'MAX_ELEMENT_SPEED': 30,
    'G': 6.67 * Math.pow(10, -11),
    'FPS': 24,
    'MAX_COUNT_OF_ELEMENTS': 100,
    'VISIBILITY': 0.4,
})

class Clock {
    constructor() {
        this.lastRunAt = Date.now()
        this.minDelay = 10
    }

    tick(fps) {
        const currentRunAt = Date.now()
        const delay = 1_000 / fps - (currentRunAt - this.lastRunAt)
        this.lastRunAt = currentRunAt

        return new Promise(
            (resolve) => setTimeout(resolve, delay ? delay > this.minDelay : this.minDelay),
        )
    }
}

class Surface {
    constructor() {
        this.elements = []
        this.clock = new Clock()
        this.createdElements = []

        this.canvas = document.getElementById('bg')
        this.ctx = this.canvas.getContext('2d')

        this.run = this.run.bind(this)

        this.updateSurfaceSize()

        window.onresize = (event) => {
            this.updateSurfaceSize()
        }

        window.addEventListener('click', event => {
            this.addElement(new Element({
                'position': [event.clientX, event.clientY],
                'color': [getRandomInt(10, 255), getRandomInt(10, 255), getRandomInt(10, 255)],
                'vector': [0, 0],
                'surface': this,
                'weight': getRandomInt(
                    Math.trunc(WorldParams.MAX_ELEMENT_WEIGHT * 0.1),
                    Math.trunc(WorldParams.MAX_ELEMENT_WEIGHT * 0.5),
                ),
            }))
        })
    }

    updateSurfaceSize() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.width = this.canvas.width
        this.height = this.canvas.height
        this.size = [this.width, this.height]
        this.maxCountOfElements = Math.min(
            Math.trunc((this.width * this.height) / window.devicePixelRatio / 60_000),
            this.maxCountOfElements = WorldParams.MAX_COUNT_OF_ELEMENTS,
        )
    }

    drawCircle(position, radius, color) {
        this.ctx.beginPath()

        const x = position[0]
        const y = position[1]
        const r = radius

        this.ctx.arc(x, y, r, 0, 2 * Math.PI, false)

        const c = r * 0.33
        const gradient = this.ctx.createRadialGradient(x - c, y - c, r * 0.33, x - c, y - c, r * 1.66)
        gradient.addColorStop(0, `rgba(${color[0] + 100}, ${color[1] + 100}, ${color[2] + 100}, ${WorldParams.VISIBILITY})`)
        gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${WorldParams.VISIBILITY})`)

        this.ctx.fillStyle = gradient
        this.ctx.fill()
    }

    drawSimpleCircle(position, radius, color, border) {
        this.ctx.beginPath()
        this.ctx.arc(position[0], position[1], radius, 0, 2 * Math.PI)
        this.ctx.lineWidth = border
        this.ctx.strokeStyle = color
        this.ctx.stroke()
    }

    addElement(element) {
        this.createdElements.push(element)
    }

    run() {
        this.update()
        this.clock.tick(WorldParams.FPS).then(this.run)
    }

    initFirstElements() {
        const countOfElements = Math.trunc(this.maxCountOfElements / 2)

        for (let i = 0; i < countOfElements; ++i) {
            const weight = getRandomInt(WorldParams.MAX_ELEMENT_WEIGHT * 0.01, WorldParams.MAX_ELEMENT_WEIGHT * 0.5)
            const area = weight / WorldParams.RADIUS_WEIGHT_FACTOR
            const radius = Math.pow(area / Math.PI, 0.5)
            const border = 2 * radius + 10

            if (Math.min(this.width, this.height) < border) {
                break
            }

            this.addElement(new Element({
                'position': [getRandomInt(border, this.width - border), getRandomInt(border, this.height - border)],
                'color': [getRandomInt(10, 255), getRandomInt(10, 255), getRandomInt(10, 255)],
                'vector': [getRandomInt(-1, 1), getRandomInt(-1, 1)],
                'surface': this,
                'weight': weight,
            }))
        }
    }

    addRandomElements() {
        const forRandom = Math.trunc(2_000 / WorldParams.FPS)

        if (getRandomInt(0, forRandom) === 0) {
            const weight = getRandomInt(WorldParams.MAX_ELEMENT_WEIGHT * 0.01, WorldParams.MAX_ELEMENT_WEIGHT * 0.2)
            const area = weight / WorldParams.RADIUS_WEIGHT_FACTOR
            const radius = Math.pow(area / Math.PI, 0.5)

            this.addElement(new Element({
                'position': [2 * radius, 2 * radius],
                'color': [getRandomInt(10, 255), getRandomInt(10, 255), getRandomInt(10, 255)],
                'vector': [getRandomInt(0, 1), getRandomInt(0, 1)],
                'surface': this,
                'weight': weight,
            }))
        }

        if (getRandomInt(0, forRandom) === 0) {
            const weight = getRandomInt(WorldParams.MAX_ELEMENT_WEIGHT * 0.01, WorldParams.MAX_ELEMENT_WEIGHT * 0.3)
            const area = weight / WorldParams.RADIUS_WEIGHT_FACTOR
            const radius = Math.pow(area / Math.PI, 0.5)

            this.addElement(new Element({
                'position': [this.width - 2 * radius, this.height - 2 * radius],
                'color': [getRandomInt(10, 255), getRandomInt(10, 255), getRandomInt(10, 255)],
                'vector': [-getRandomInt(0, 1), -getRandomInt(0, 1)],
                'surface': this,
                'weight': weight,
            }))
        }
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        let countOfDestroyedElements = 0

        for (const element of this.elements) {
            if (element.isDestroyed) {
                ++countOfDestroyedElements
            } else {
                element.update()
            }
        }

        if (this.elements.length > 10 && countOfDestroyedElements / this.elements.length > 0.25) {
            this.elements = this.elements.filter(element => !element.isDestroyed)
            countOfDestroyedElements = 0
        }

        if (this.createdElements.length > 0) {
            for (const element of this.createdElements) {
                this.elements.push(element)
            }

            this.createdElements = []
        }

        if (this.elements.length - countOfDestroyedElements < this.maxCountOfElements) {
            this.addRandomElements()
        }
    }
}

class Explosion {
    constructor({position, color, surface, initialRadius}) {
        this.position = position
        this.color = color
        this.surface = surface
        this.initialRadius = initialRadius
        this.n = 0
        this.isDestroyed = false
    }

    update() {
        ++this.n
        const explosionRadius = this.initialRadius + Math.pow(this.n, 0.8)
        const visibility = Math.pow(this.initialRadius / explosionRadius, 4)
        const explosionColor = `rgba(19, 100, 99, ${visibility * WorldParams.VISIBILITY})`
        this.surface.drawSimpleCircle(this.position, explosionRadius, explosionColor, this.initialRadius * visibility)

        if (visibility < 0.01) {
            this.isDestroyed = true
        }
    }
}

class Element {
    constructor({position, color, vector, surface, weight = 1}) {
        this.position = position
        this.color = color
        this.vector = vector
        this.surface = surface
        this.weight = weight
        this.isDestroyed = false
    }

    get weight() {
        return this._weight
    }

    set weight(value) {
        this._weight = value
        this.updateRadius()
    }

    updateRadius() {
        const area = Math.abs(this.weight) / WorldParams.RADIUS_WEIGHT_FACTOR
        let radius = Math.pow(area / Math.PI, 0.5)

        if (radius < 3) {
            radius = 3
        }

        this.radius = radius
    }

    update() {
        for (const element of this.surface.elements) {
            if (element === this || element.isDestroyed || element.constructor !== Element) {
                continue
            }

            this.updatePosition(element)
            this.handleCollisions(element)

            if (this.isDestroyed) {
                return
            }
        }

        this.checkSpeed()

        this.position[0] += this.vector[0]
        this.position[1] += this.vector[1]

        this.checkPosition()

        if (Math.abs(this.weight) > WorldParams.MAX_ELEMENT_WEIGHT) {
            this.blowUp()
        }

        if (!this.isDestroyed) {
            this.surface.drawCircle(this.position, this.radius, this.color)
        }
    }

    checkPosition() {
        let reducedSpeed = false

        for (let i = 0; i < 2; ++i) {
            if (this.position[i] - this.radius < 0 || this.position[i] + this.radius > this.surface.size[i]) {
                this.vector[i] = -this.vector[0]

                if (!reducedSpeed) {
                    this.vector[0] /= 2
                    this.vector[1] /= 2
                    reducedSpeed = true
                }

                if (this.position[i] - this.radius < 0) {
                    this.position[i] = this.radius
                } else {
                    this.position[i] = this.surface.size[i] - this.radius
                }
            }
        }
    }

    updatePosition(element) {
        const diffs = getDiffsBetweenTwoPoints(element.position, this.position)
        const distance = Math.hypot(...diffs) || 0.00000001
        const f = (WorldParams.G * element.weight * this.weight) / Math.pow(distance / WorldParams.METER, 2)
        const a = f / this.weight

        this.vector[0] += (diffs[0] / distance) * a
        this.vector[1] += (diffs[1] / distance) * a
    }

    checkSpeed() {
        if (this.speed > WorldParams.MAX_ELEMENT_SPEED) {
            const c = WorldParams.MAX_ELEMENT_SPEED / this.speed
            this.vector[0] *= c
            this.vector[1] *= c
        }
    }

    handleCollisions(element) {
        if (this.weight < element.weight) {
            return
        }

        const distance = getDistanceBetweenTwoPoints(element.position, this.position)
        const intersection = distance - this.radius - element.radius

        if (intersection >= 0) {
            return
        }

        if (getSpeedBetweenTwoVectors(this.vector, element.vector) > WorldParams.MAX_ELEMENT_SPEED * 0.8) {
            this.blowUp()
            element.blowUp()
        } else {
            this.consumeWeight(element)
        }
    }

    consumeWeight(element) {
        const weightRatio = element.weight / this.weight
        this.weight += element.weight

        if (weightRatio > 0.05) {
            this.color = [
                Math.max(Math.min((this.color[0] * (1 - weightRatio)) + (element.color[0] * weightRatio), 255), 10),
                Math.max(Math.min((this.color[1] * (1 - weightRatio)) + (element.color[1] * weightRatio), 255), 10),
                Math.max(Math.min((this.color[2] * (1 - weightRatio)) + (element.color[2] * weightRatio), 255), 10),
            ]
        }

        const a = element.weight / this.weight
        this.vector[0] = element.vector[0] * a + this.vector[0] * (1 - a)
        this.vector[1] = element.vector[1] * a + this.vector[1] * (1 - a)
        element.destroy()
    }

    blowUp() {
        this.destroy()

        const n = getRandomInt(
            Math.trunc(this.weight / WorldParams.MAX_ELEMENT_WEIGHT * 5),
            Math.trunc(this.weight / WorldParams.MAX_ELEMENT_WEIGHT * 20),
        )

        if (n < 3) {
            return
        }

        const maxWeight = Math.trunc(this.weight / n)

        if (maxWeight < WorldParams.MAX_ELEMENT_WEIGHT * 0.01) {
            return
        }

        const radius = Math.trunc(this.radius)

        for (let i = 0; i < n; ++i) {
            const position = [
                this.position[0] - getRandomInt(-radius, radius),
                this.position[1] - getRandomInt(-radius, radius),
            ]
            position[getRandomInt(0, 1)] += this.radius * (getRandomInt(0, 1) - 1)

            const diffs = getDiffsBetweenTwoPoints(this.position, position)
            const distance = Math.hypot(...diffs) || 1
            const vector = diffs.map(d => (-d / distance) * (WorldParams.MAX_ELEMENT_SPEED * 0.05))
            const weight = getRandomInt(1, maxWeight)

            this.surface.addElement(new Element({
                'position': position,
                'color': [getRandomInt(10, 255), getRandomInt(10, 255), getRandomInt(10, 255)],
                'vector': vector,
                'surface': this.surface,
                'weight': weight,
            }))
        }
    }

    destroy() {
        this.isDestroyed = true
        this.surface.addElement(new Explosion({
            'position': this.position,
            'color': this.color,
            'surface': this.surface,
            'initialRadius': this.radius,
        }))
    }

    get speed() {
        return Math.hypot(...this.vector)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const surface = new Surface()
    surface.initFirstElements()
    surface.run()
})
