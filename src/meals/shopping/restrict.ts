import type { Modifier } from '@dnd-kit/core'

/** Rows only move up and down */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })
