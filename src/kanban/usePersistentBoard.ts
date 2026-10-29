import { get, set } from 'idb-keyval'
import { useEffect, useReducer } from 'react'
import { boardReducer, type Action } from './boardReducer'
import { seedBoard } from './seed'
import type { Board } from './types'

// IndexedDB, not localStorage: iOS can clear a WebView's localStorage.
const KEY = 'kanban-board'

type State = Board | null
type LoadAction = { type: 'load'; board: Board }

// Changes to the seed that boards saved earlier should get too.
function migrate(board: Board): Board {
  return {
    ...board,
    lists: board.lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.title === 'Emoji support' && c.icon === 'Smile' ? { ...c, icon: '😀' } : c)),
    })),
  }
}

function reducer(state: State, action: Action | LoadAction): State {
  if (action.type === 'load') return action.board
  return state && boardReducer(state, action)
}

// The board is null until storage has answered, so the seed never flashes over saved data.
export function usePersistentBoard() {
  const [board, dispatch] = useReducer(reducer, null)

  useEffect(() => {
    get<Board>(KEY)
      .then((saved) => dispatch({ type: 'load', board: saved ? migrate(saved) : seedBoard() }))
      .catch(() => dispatch({ type: 'load', board: seedBoard() }))
  }, [])

  useEffect(() => {
    if (board) set(KEY, board).catch(() => {})
  }, [board])

  return [board, dispatch as (action: Action) => void] as const
}
