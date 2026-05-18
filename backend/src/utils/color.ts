const PALETTE = [
    '4F6BED',
    '3AAFA9',
    'E05C5C',
    '9B5DE5',
    '2D9CDB',
    'F4845F',
    '57A773',
    'D65799',
    'F0A500',
    '7B6FA0',
] as const

export function pickAccentColor(): string {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)]!
}