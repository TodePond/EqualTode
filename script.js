//=======//
// WORLD //
//=======//
const WORLD_WIDTH = 100
const WORLD_HEIGHT = 100
const WORLD_AREA = WORLD_WIDTH * WORLD_HEIGHT
const world = new Map()
const clearWorld = () => {
	let i = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			let cell = world.get(i)
			if (cell === undefined) {
				cell = {element: 1, value: Random.Uint8, neighbours: []}
			} else {
				cell.element = 1
				cell.value = Random.Uint8
			}
			world.set(i, cell)
			i++
		}
	}
}

const emptyWorld = () => {
	let i = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			let cell = world.get(i)
			if (cell === undefined) {
				cell = {element: 1, value: 0, neighbours: []}
			} else {
				cell.element = 1
				cell.value = 0
			}
			world.set(i, cell)
			i++
		}
	}
}

/*const NEIGHBOURHOOD = [
	[-1,-1],[ 0,-1],[ 1,-1],
	[-1, 0],        [ 1, 0],
	[-1, 1],[ 0, 1],[ 1, 1],
]*/

const NEIGHBOURHOOD = [
	        [ 0,-1],
	[-1, 0],        [ 1, 0],
	        [ 0, 1],
]

const linkNeighbours = () => {
	let i = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = world.get(i)
			for (const [dx, dy] of NEIGHBOURHOOD) {
				const neighbour = getCell(x+dx, y+dy)
				if (neighbour === undefined) continue
				neighbour.neighbours.push(cell)
			}
			i++
		}
	}
}

const getCell = (x, y) => {
	while (x >= WORLD_WIDTH) x -= WORLD_WIDTH
	while (y >= WORLD_HEIGHT) y -= WORLD_HEIGHT
	while (x < 0) x += WORLD_WIDTH
	while (y < 0) y += WORLD_HEIGHT
	const index = x * WORLD_WIDTH + y
	return world.get(index)
}

clearWorld()
linkNeighbours()

//===========//
// COLOURERS //
//===========//
const colourers = new Map()
const setColours = (element, rule) => {
	const numbers = [...(0).to(255)].map(rule)
	const strings = numbers.map(([r, g, b]) => `hsl(${r / 255 * 360}, ${g / 255 * 100}%, ${b / 255 * 100}%)`)
	colourers.set(element, strings)
}

setColours(0, v => [v, v, v])
//setColours(1, v => [0, v, Math.round(v/2)])
setColours(1, v => [255-v, 255, v])
setColours(2, v => [255-v, 255, v])
setColours(3, v => [255-v, 255, v])

//======//
// DRAW //
//======//
const draw = (context) => {
	let i = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = world.get(i)
			const colourer = colourers.get(cell.element)
			const colour = colourer[cell.value]
			context.fillStyle = colour
			context.fillRect(x, y, 1, 1)
			i++
		}
	}
}

//======//
// SHOW //
//======//
const show = Show.start({scale: 5.0})
show.tick = (context) => {
	paint()
	update()
	draw(context)
}

//=======//
// PAINT //
//=======//
let brush = {element: [1], value: [...(0).to(255)]}
const paint = () => {
	if (!Mouse.Left) return
	const [x, y] = Mouse.position.map(v => Math.round(v / show.scale))
	const cell = getCell(x, y)
	if (cell === undefined) return
	const element = brush.element[Random.Uint8 % brush.element.length]
	const value = brush.value[Random.Uint8 % brush.value.length]
	cell.element = element
	cell.value = value
}

//========//
// UPDATE //
//========//
const update = () => {
	for (let i = 0; i < WORLD_AREA; i++) {
		const index = Random.Uint32 % WORLD_AREA
		const cell = world.get(index)
		applyRules(cell)
	}
}

const applyRules = (cell) => {
	
	const neighbour = cell.neighbours[Random.Uint32 % cell.neighbours.length]
	const oldA = cell.value
	const oldB = neighbour.value
	
	const ruleA = rules.get("a")
	const ruleB = rules.get("b")

	const elementRuleA = rules.get(cell.element)
	const elementRuleB = rules.get(neighbour.element)

	let newA = oldA
	let newB = oldB

	if (elementRuleA !== undefined) newA = Math.round(clamp(elementRuleA(oldA, oldB), 0, 255))
	if (elementRuleB !== undefined) newB = Math.round(clamp(elementRuleB(oldA, oldB), 0, 255))
	
	let newNewA = newA
	let newNewB = newB

	if (ruleA !== undefined) newNewA = Math.round(clamp(ruleA(newA, newB), 0, 255))
	if (ruleB !== undefined) newNewB = Math.round(clamp(ruleB(newA, newB), 0, 255))

	cell.value = clamp(newNewA, 0, 255)
	neighbour.value = clamp(newNewB, 0, 255)

}

const clamp = (n, min, max) => {
	if (n < min) return min
	if (n > max) return max
	return n
}

//=======//
// RULES //
//=======//
on.keydown(e => {
	const func = KEYDOWN[e.key]
	if (func !== undefined) {
		func(e)
	}
})

const rules = new Map()

const KEYDOWN = {}
KEYDOWN["r"] = () => {
	clearWorld()
}

KEYDOWN["c"] = () => {
	emptyWorld()
}

KEYDOWN["1"] = () => {
	rules.clear()
	rules.set("a", (a, b) => (a+b-1)/2)
	rules.set("b", (a, b) => b)
	rules.set(2, () => 255)
	rules.set(3, () => 0)
}

KEYDOWN["2"] = () => {
	rules.clear()
	rules.set("a", (a, b) => b)
	rules.set("b", (a, b) => a)
	rules.set(2, () => 255)
	rules.set(3, () => 0)
}

KEYDOWN["3"] = () => {
	rules.clear()
	rules.set("a", (a, b) => a)
	rules.set("b", (a, b) => a)
	rules.set(2, () => 255)
	rules.set(3, () => 0)
}

KEYDOWN["4"] = () => {
	rules.clear()
	rules.set("a", (a, b) => a > b? a-3 : b-3)
	rules.set("b", (a, b) => a > b? a-3 : b-3)
	rules.set(2, () => 255)
	rules.set(3, () => 0)
}

KEYDOWN["5"] = () => {
	rules.clear()
	rules.set("a", (a, b) => (a*0.75+b*0.25))
	rules.set("b", (a, b) => (a*0.75+b*0.25))
	rules.set(2, () => 255)
	rules.set(3, () => 0)
}

KEYDOWN["q"] = () => brush = {element: [1], value: [...(0).to(255)]}
KEYDOWN["w"] = () => brush = {element: [2], value: [...(0).to(255)]}
KEYDOWN["e"] = () => brush = {element: [3], value: [...(0).to(255)]}

KEYDOWN["4"]()
emptyWorld()