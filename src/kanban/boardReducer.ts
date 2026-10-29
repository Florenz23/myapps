import type { Board, Card } from './types'

export type Action =
  | { type: 'updateCard'; cardId: string; title: string; description: string }
  | { type: 'deleteCard'; cardId: string }
  | { type: 'moveCard'; cardId: string; toListId: string; toIndex?: number }
  | { type: 'addCard'; listId: string; title: string }
  | { type: 'addList'; id: string; title: string }
  | { type: 'renameList'; listId: string; title: string }
  | { type: 'deleteList'; listId: string }

// New lists take the next color in line, like the reference's five.
const accents = ['#60a5fa', '#a78bfa', '#fb923c', '#4ade80', '#cbd5e1', '#f472b6', '#facc15', '#2dd4bf']

const findCard = (board: Board, cardId: string) => {
  for (const list of board.lists) {
    const card = list.cards.find((c) => c.id === cardId)
    if (card) return { list, card }
  }
}

export function boardReducer(board: Board, action: Action): Board {
  switch (action.type) {
    case 'updateCard':
      return {
        ...board,
        lists: board.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) =>
            c.id === action.cardId ? { ...c, title: action.title, description: action.description } : c,
          ),
        })),
      }

    case 'deleteCard':
      return {
        ...board,
        lists: board.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== action.cardId) })),
      }

    case 'moveCard': {
      const found = findCard(board, action.cardId)
      if (!found) return board
      const moving: Card = found.card
      const lists = board.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== moving.id) }))
      return {
        ...board,
        lists: lists.map((l) => {
          if (l.id !== action.toListId) return l
          const cards = [...l.cards]
          cards.splice(action.toIndex ?? cards.length, 0, moving)
          return { ...l, cards }
        }),
      }
    }

    case 'addCard':
      return {
        ...board,
        lists: board.lists.map((l) =>
          l.id === action.listId
            ? { ...l, cards: [...l.cards, { id: crypto.randomUUID(), title: action.title, description: '' }] }
            : l,
        ),
      }

    case 'addList':
      return {
        ...board,
        lists: [
          ...board.lists,
          {
            id: action.id,
            title: action.title,
            accent: accents[board.lists.length % accents.length],
            icon: 'StickyNote',
            cards: [],
          },
        ],
      }

    case 'renameList':
      return {
        ...board,
        lists: board.lists.map((l) => (l.id === action.listId ? { ...l, title: action.title } : l)),
      }

    case 'deleteList':
      return { ...board, lists: board.lists.filter((l) => l.id !== action.listId) }
  }
}
