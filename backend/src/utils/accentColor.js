const PALETTE = [
	"#21145f",
	"#3d2b8e",
	"#1a6b8a",
	"#0d7c5e",
	"#6b3fa0",
	"#b5451b",
	"#7b5c00",
	"#1f5fa6",
	"#8b1a4a",
	"#2e6b3e",
]

function pickAccentColor() {
	return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

module.exports = { pickAccentColor }