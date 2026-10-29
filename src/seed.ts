import type { DayRef, Dish, State } from './types'
import { emptyState, housekeeping, newId } from './logic'
import { shiftWeek } from './weeks'

// First start: starter dishes, the two side lists, and ~6 eaten past weeks,
// so the picker's sorting and the counts show something right away.

const DISHES: Omit<Dish, 'id'>[] = [
  {
    name: 'Chili', aliases: ['Chilli', 'Chili con carne'], weekend: false, days: 3,
    ingredients: ['Minced beef', 'Kidney beans', 'Onions', 'Chopped tomatoes'],
    prep: 'Brown the beef with the onions\nAdd beans and tomatoes\nSimmer 40 min',
  },
  {
    name: 'Spaghetti Bolognese', aliases: ['Spag bol'], weekend: false, days: 2,
    ingredients: ['Spaghetti', 'Minced beef', 'Passata', 'Carrots'], prep: '',
  },
  { name: 'Curry', aliases: [], weekend: false, days: 2, ingredients: ['Chicken', 'Coconut milk', 'Curry paste', 'Rice'], prep: '' },
  { name: 'Fish fingers', aliases: [], weekend: false, days: 1, ingredients: ['Fish fingers', 'Peas'], prep: '' },
  { name: 'Tuna pasta', aliases: [], weekend: false, days: 1, ingredients: ['Pasta', 'Tuna', 'Sweetcorn'], prep: '' },
  { name: 'Gnocchi with spinach', aliases: ['Gnocci with spinach'], weekend: false, days: 1, ingredients: ['Gnocchi', 'Spinach', 'Cream'], prep: '' },
  {
    name: 'Pancakes', aliases: [], weekend: true, days: 1, ingredients: ['Flour', 'Eggs', 'Milk'],
    prep: 'Whisk flour, eggs and milk\nRest 10 min\nFry thin in butter',
  },
  { name: 'Lasagne', aliases: [], weekend: true, days: 2, ingredients: ['Lasagne sheets', 'Minced beef', 'Passata', 'Mozzarella'], prep: '' },
]

// Past weeks, oldest first: [weekday, dish name]. Plain spellings count too.
const HISTORY: [number, string][][] = [
  [[0, 'Chili'], [3, 'Fish fingers'], [4, 'Tuna pasta'], [5, 'Lasagne']],
  [[0, 'Spaghetti Bolognese'], [2, 'Curry'], [4, 'Fish fingers'], [5, 'Pancakes'], [6, 'Gnocchi with spinach']],
  [[0, 'Gnocci with spinach'], [1, 'Chili'], [4, 'Fish fingers'], [5, 'Lasagne']],
  [[0, 'Curry'], [2, 'Tuna pasta'], [3, 'Spaghetti Bolognese'], [5, 'Pancakes'], [6, 'Fish fingers']],
  [[0, 'Chili'], [3, 'Gnocchi with spinach'], [4, 'Fish fingers'], [5, 'Lasagne']],
  [[0, 'Spaghetti Bolognese'], [2, 'Tuna pasta'], [3, 'Curry'], [5, 'Pancakes'], [6, 'Fish fingers']],
]

export function seedState(today: DayRef): State {
  const s = emptyState()
  s.dishes = DISHES.map((d) => ({ ...d, id: newId() }))
  s.always = ['Eggs', 'Bread', 'Cheese'].map((text) => ({ id: newId(), text }))
  s.ifEmpty = ['Milk', 'Salad', 'Tomatoes'].map((text) => ({ id: newId(), text }))
  HISTORY.forEach((week, i) => {
    const key = shiftWeek(today.key, i - HISTORY.length)
    s.weeks[key] = Array(7).fill(null)
    for (const [idx, name] of week) {
      const dish = s.dishes.find((d) => d.name === name)
      s.weeks[key][idx] = dish
        ? { dishId: dish.id, name: dish.name, span: dish.days, buy: false }
        : { name, span: 1, buy: false }
    }
  })
  housekeeping(s, today)
  return s
}
