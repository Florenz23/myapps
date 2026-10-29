import { useState } from 'react'
import {
  DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from './restrict'
import { CSS } from '@dnd-kit/utilities'
import { ArrowRight, Menu, Plus, X } from 'lucide-react'
import { listMsg, useApp } from '../ctx'
import { addToList, deleteItem, editItem, moveToMain, reorder, toggleDone } from '../logic'
import type { Item, ListName } from '../types'

/** One list's rows: drag handle (long-press on touch), text edited in place, delete with Undo. */
export function ItemList({ list }: { list: ListName }) {
  const { state, update, withUndo, toast } = useApp()
  const items = state[list]
  const [draft, setDraft] = useState('')

  // Touch: hold the handle ~300 ms, then drag. A quick swipe still scrolls the page.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) update((s) => reorder(s, list, String(active.id), String(over.id)))
  }

  const add = () => {
    const text = draft.trim()
    if (!text) return
    if (!update((s) => addToList(s, list, text))) toast(`“${text}” is already on the list`)
    setDraft('')
  }

  return (
    <div className="overflow-hidden rounded-[12px] bg-card">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <Row
              key={item.id}
              item={item}
              list={list}
              onDelete={() => withUndo((s) => deleteItem(s, list, item.id), () => `“${item.text}” deleted`)}
              onEdit={(text) => update((s) => editItem(s, list, item.id, text))}
              onToggle={() => update((s) => toggleDone(s, item.id))}
              onMove={() => {
                const n = update((s) => moveToMain(s, list, [item.id]))
                toast(n ? listMsg(n, 0) : `“${item.text}” is already on the main list`)
              }}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div className="flex h-12 items-center gap-3 pr-4 pl-4">
        <Plus size={22} className="shrink-0 rounded-full bg-fill p-0.5 text-label2" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          onBlur={add}
          placeholder="Add item"
          enterKeyHint="done"
          className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-label3"
        />
      </div>
    </div>
  )
}

function Row({ item, list, onDelete, onEdit, onToggle, onMove }: {
  item: Item
  list: ListName
  onDelete: () => void
  onEdit: (text: string) => void
  onToggle: () => void
  onMove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [editing, setEditing] = useState(false)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative flex min-h-12 items-center bg-card ${isDragging ? 'z-10 rounded-[10px] shadow-lg' : ''}`}
    >
      <button
        aria-label={`Move ${item.text}`}
        {...attributes}
        {...listeners}
        className="no-callout flex h-12 w-11 shrink-0 cursor-grab touch-manipulation items-center justify-center text-label3 active:cursor-grabbing"
      >
        <Menu size={20} />
      </button>
      {list === 'main' && (
        <button
          role="checkbox"
          aria-checked={!!item.done}
          aria-label={`Bought ${item.text}`}
          onClick={onToggle}
          className="-ml-1 flex h-12 w-10 shrink-0 items-center justify-center"
        >
          <span className={`h-[22px] w-[22px] rounded-[6px] border-[1.5px] ${item.done ? 'border-black bg-black' : 'border-label3'}`}>
            {item.done && (
              <svg viewBox="0 0 24 24" className="h-full w-full text-white" fill="none" stroke="currentColor" strokeWidth="3.2">
                <path d="M6 12.5l4 4 8-9" />
              </svg>
            )}
          </span>
        </button>
      )}
      <div className="flex min-h-12 min-w-0 flex-1 items-center border-b border-sep">
        {editing ? (
          <input
            autoFocus
            defaultValue={item.text}
            enterKeyHint="done"
            onBlur={(e) => {
              setEditing(false)
              onEdit(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="h-12 min-w-0 flex-1 bg-transparent pl-2 outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`min-h-12 min-w-0 flex-1 truncate pl-2 text-left text-[17px] ${item.done ? 'text-label2 line-through' : ''}`}
          >
            {item.text}
          </button>
        )}
        {list !== 'main' && (
          <button aria-label={`${item.text} to the main list`} onClick={onMove} className="flex h-12 w-11 shrink-0 items-center justify-center text-accent-ink">
            <ArrowRight size={20} />
          </button>
        )}
        <button aria-label={`Delete ${item.text}`} onClick={onDelete} className="mr-1 flex h-12 w-11 shrink-0 items-center justify-center text-label2">
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
