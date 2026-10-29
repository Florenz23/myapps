import { describe, expect, it } from 'vitest'
import {
  clearDay, clearMain, coverAt, deleteItem, dishStats, editItem, findDish, placeDish, setSpan,
  tick, tickWeek, toggleDone, untick, updateDish, addToMain, housekeeping,
} from './logic'
import { seedState } from './seed'
import type { DayRef, State } from './types'
import { shiftWeek, todayRef } from './weeks'

const today: DayRef = { key: '2026-W44', idx: 3 }
const W = today.key
const day = (idx: number, key = W): DayRef => ({ key, idx })
const main = (s: State) => s.main.map((i) => i.text)

function setup() {
  const s = seedState(today)
  const id = (name: string) => findDish(s, name)!.id
  return { s, id }
}

describe('ISO weeks', () => {
  it('keys January by the ISO year', () => {
    expect(todayRef(new Date(2027, 0, 1)).key).toBe('2026-W53')
    expect(shiftWeek('2026-W53', 1)).toBe('2027-W01')
  })
})

describe('plan', () => {
  it('a 3-day dish on Saturday crosses into a missing next week and creates it', () => {
    const { s, id } = setup()
    delete s.weeks['2026-W45']
    placeDish(s, day(5), id('Chili'), today)
    expect(s.weeks['2026-W45']).toBeDefined()
    expect(coverAt(s, day(0, '2026-W45'))?.offset).toBe(2)
  })

  it('picking on a leftover day splits the run', () => {
    const { s, id } = setup()
    placeDish(s, day(4), id('Chili'), today) // Fri–Sun
    placeDish(s, day(5), id('Pancakes'), today)
    expect(s.weeks[W][4]!.span).toBe(1)
    expect(coverAt(s, day(6))).toBeNull()
  })

  it('more days overwrite the following days, fewer give them back', () => {
    const { s, id } = setup()
    placeDish(s, day(0), id('Curry'), today)
    placeDish(s, day(2), id('Tuna pasta'), today)
    setSpan(s, day(0), 3, today)
    expect(s.weeks[W][2]).toBeNull()
    setSpan(s, day(0), 1, today)
    expect(coverAt(s, day(1))).toBeNull()
  })

  it('counts every spelling', () => {
    const { s, id } = setup()
    expect(dishStats(s).get(id('Gnocchi with spinach'))!.total).toBe(3)
  })

  it('a rename keeps the old name as another spelling', () => {
    const { s, id } = setup()
    const d = findDish(s, 'Curry')!
    updateDish(s, d.id, { ...d, name: 'Chicken curry' }, today)
    expect(findDish(s, 'curry')?.id).toBe(id('Chicken curry'))
  })
})

describe('the rules between the plan and the main list', () => {
  it('2 + 10: ticking adds only what is not on the list yet', () => {
    const { s, id } = setup()
    addToMain(s, 'Onions')
    placeDish(s, day(0), id('Chili'), today)
    expect(tick(s, day(0), today)).toBe(3)
    expect(main(s)).toEqual(['Onions', 'Minced beef', 'Kidney beans', 'Chopped tomatoes'])
  })

  it('3: unticking never touches your own items, and keeps what another tick needs', () => {
    const { s, id } = setup()
    addToMain(s, 'Onions')
    placeDish(s, day(0), id('Chili'), today)
    placeDish(s, day(3), id('Spaghetti Bolognese'), today)
    tick(s, day(0), today)
    tick(s, day(3), today)
    expect(untick(s, day(0), today)).toBe(2) // Kidney beans, Chopped tomatoes
    expect(main(s)).toEqual(['Onions', 'Minced beef', 'Spaghetti', 'Passata', 'Carrots'])
    expect(untick(s, day(3), today)).toBe(4) // Minced beef was handed over
    expect(main(s)).toEqual(['Onions'])
  })

  it('4: deleted, edited or ticked-off items are yours', () => {
    const { s, id } = setup()
    placeDish(s, day(0), id('Chili'), today)
    tick(s, day(0), today)
    deleteItem(s, 'main', s.main[0].id)
    editItem(s, 'main', s.main[0].id, 'Kidney beans (2 cans)')
    toggleDone(s, s.main[1].id)
    untick(s, day(0), today)
    expect(main(s)).toEqual(['Kidney beans (2 cans)', 'Onions'])
    tick(s, day(0), today)
    clearMain(s, false)
    expect(untick(s, day(0), today)).toBe(0)
  })

  it('5: leftover days have no checkbox of their own', () => {
    const { s, id } = setup()
    placeDish(s, day(0), id('Chili'), today)
    expect(tick(s, day(1), today)).toBe(0)
  })

  it('6: past weeks hold nothing on the list', () => {
    const { s, id } = setup()
    placeDish(s, day(0), id('Chili'), today)
    tick(s, day(0), today)
    const nextWeek = { key: shiftWeek(W, 1), idx: 0 }
    housekeeping(s, nextWeek)
    expect(untick(s, day(0), nextWeek)).toBe(0)
    expect(main(s)).toHaveLength(4)
  })

  it('7: changing or clearing a ticked day unticks it first', () => {
    const { s, id } = setup()
    placeDish(s, day(0), id('Fish fingers'), today)
    tick(s, day(0), today)
    expect(placeDish(s, day(0), id('Tuna pasta'), today)).toBe(2)
    tick(s, day(0), today)
    expect(clearDay(s, day(0), today)).toBe(3)
    expect(s.main).toHaveLength(0)
  })

  it('8: changing a ticked dish’s ingredients updates the list', () => {
    const { s, id } = setup()
    placeDish(s, day(0), id('Fish fingers'), today)
    tick(s, day(0), today)
    const d = findDish(s, 'Fish fingers')!
    expect(updateDish(s, d.id, { ...d, ingredients: ['Fish fingers', 'Potatoes'] }, today)).toEqual({ added: 1, removed: 1 })
    expect(main(s)).toEqual(['Fish fingers', 'Potatoes'])
  })

  it('cart button ticks the week and asks for unknown dishes', () => {
    const { s, id } = setup()
    placeDish(s, day(0), id('Fish fingers'), today)
    const d = findDish(s, 'Tuna pasta')!
    d.ingredients = null
    placeDish(s, day(2), d.id, today)
    const r = tickWeek(s, W, today)
    expect(r).toEqual({ added: 2, ask: [day(2)] })
  })
})
