import './kanban.css'
import {
  closestCenter, DndContext, DragOverlay, MouseSensor, pointerWithin, TouchSensor, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'
import type { Action } from './boardReducer'
import { CardFace } from './CardItem'
import { CardSheet } from './CardSheet'
import { ListColumn } from './ListColumn'
import { ListMenuSheet } from './ListMenuSheet'
import { ListSwitcher } from './ListSwitcher'
import { NewListSheet } from './NewListSheet'
import type { Board as BoardData } from './types'
import { usePersistentBoard } from './usePersistentBoard'
import { VersionLine } from './VersionLine'

export function Board({ onSwitchApp }: { onSwitchApp?: () => void }) {
  const [board, dispatch] = usePersistentBoard()
  if (!board) return <div className="board-bg h-dvh" />
  return <BoardView board={board} dispatch={dispatch} onSwitchApp={onSwitchApp} />
}

function BoardView({ board, dispatch, onSwitchApp }: {
  board: BoardData
  dispatch: (action: Action) => void
  onSwitchApp?: () => void
}) {
  const [active, setActive] = useState(0)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [menuListId, setMenuListId] = useState<string | null>(null)
  const [addingList, setAddingList] = useState(false)
  const [jumpTo, setJumpTo] = useState<string | null>(null)
  const strip = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const lastDragEnd = useRef(0)

  // Touch: hold ~300 ms to pick a card up, so a normal swipe still scrolls. Mouse: just drag.
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
  )

  // Only the visible list's cards and the pills count as drop targets.
  const activeListId = board.lists[active]?.id
  const collision: CollisionDetection = (args) => {
    const targets = args.droppableContainers.filter(
      (c) => String(c.id).startsWith('pill:') || c.data.current?.listId === activeListId,
    )
    const scoped = { ...args, droppableContainers: targets }
    const onPill = pointerWithin(scoped).filter((c) => String(c.id).startsWith('pill:'))
    return onPill.length ? onPill : closestCenter(scoped)
  }

  const onDragStart = ({ active }: DragStartEvent) => setDraggingId(String(active.id))

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null)
    lastDragEnd.current = Date.now()
    if (!over || active.id === over.id) return
    const cardId = String(active.id)
    const toListId = over.data.current?.listId as string | undefined
    if (!toListId) return
    if (String(over.id).startsWith('pill:')) {
      const from = board.lists.find((l) => l.cards.some((c) => c.id === cardId))
      if (from?.id !== toListId) dispatch({ type: 'moveCard', cardId, toListId })
      return
    }
    const toIndex = board.lists.find((l) => l.id === toListId)?.cards.findIndex((c) => c.id === over.id)
    dispatch({ type: 'moveCard', cardId, toListId, toIndex })
  }

  // A drop can be followed by a click on the same card; don't open the sheet for it.
  const openCardSheet = (cardId: string) => {
    if (Date.now() - lastDragEnd.current > 300) setOpenCardId(cardId)
  }

  // One list per screen: the horizontal scroll position says which list is showing.
  const onScroll = () => {
    const el = strip.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  const goTo = (i: number, behavior: ScrollBehavior = 'smooth') => {
    const el = strip.current
    el?.scrollTo({ left: i * el.clientWidth, behavior })
  }

  // After adding a list, show it.
  useEffect(() => {
    if (!jumpTo) return
    const i = board.lists.findIndex((l) => l.id === jumpTo)
    if (i >= 0) goTo(i)
    setJumpTo(null)
  }, [jumpTo, board.lists])

  const openList = board.lists.find((l) => l.cards.some((c) => c.id === openCardId))
  const openCard = openList?.cards.find((c) => c.id === openCardId)
  const menuList = board.lists.find((l) => l.id === menuListId)
  const draggingCard = board.lists.flatMap((l) => l.cards).find((c) => c.id === draggingId)

  return (
    <div className="board-bg flex h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggingId(null)}
        autoScroll={{ threshold: { x: 0, y: 0.2 } }}
      >
      <ListSwitcher
        lists={board.lists}
        active={active}
        onPick={goTo}
        onAddList={() => setAddingList(true)}
      />

      <div
        ref={strip}
        onScroll={onScroll}
        className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto"
      >
        {board.lists.map((list) => (
          <div key={list.id} className="flex w-full shrink-0 snap-center flex-col px-4 pt-2 pb-4">
            <ListColumn
              list={list}
              onOpenCard={(card) => openCardSheet(card.id)}
              onAddCard={(title) => dispatch({ type: 'addCard', listId: list.id, title })}
              onRename={(title) => dispatch({ type: 'renameList', listId: list.id, title })}
              onOpenMenu={() => setMenuListId(list.id)}
            />
          </div>
        ))}
        {board.lists.length === 0 && (
          <div className="flex w-full shrink-0 items-center justify-center px-8 text-center text-white/60">
            No lists. Tap + at the top to add one.
          </div>
        )}
      </div>

      <DragOverlay>{draggingCard && <CardFace card={draggingCard} lifted />}</DragOverlay>
      </DndContext>

      <VersionLine onSwitchApp={onSwitchApp} />

      {openCard && openList && (
        <CardSheet
          key={openCard.id}
          card={openCard}
          list={openList}
          lists={board.lists}
          onSave={(title, description) => dispatch({ type: 'updateCard', cardId: openCard.id, title, description })}
          onMove={(toListId) => dispatch({ type: 'moveCard', cardId: openCard.id, toListId })}
          onDelete={() => dispatch({ type: 'deleteCard', cardId: openCard.id })}
          onClose={() => setOpenCardId(null)}
        />
      )}

      {menuList && (
        <ListMenuSheet
          key={menuList.id}
          list={menuList}
          onRename={(title) => dispatch({ type: 'renameList', listId: menuList.id, title })}
          onDelete={() => dispatch({ type: 'deleteList', listId: menuList.id })}
          onClose={() => setMenuListId(null)}
        />
      )}

      {addingList && (
        <NewListSheet
          onAdd={(title) => {
            const id = crypto.randomUUID()
            dispatch({ type: 'addList', id, title })
            setJumpTo(id)
          }}
          onClose={() => setAddingList(false)}
        />
      )}
    </div>
  )
}
