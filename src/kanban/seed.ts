import type { Board, Card } from './types'

const card = (title: string, icon: string, description = ''): Card => ({
  id: crypto.randomUUID(),
  title,
  description,
  icon,
})

// The board from the previous video, as the first-start content.
export const seedBoard = (): Board => ({
  title: 'Platform Enhancements',
  lists: [
    {
      id: crypto.randomUUID(), title: 'Ideas', accent: '#60a5fa', icon: 'Lightbulb',
      cards: [
        card('Photo gallery support', 'Camera'),
        card('Starred cards', 'Star', 'Star important cards so they show up at the top of your personal view.'),
        card('Customizable links', 'Link'),
        card('More language options', 'Globe'),
        card('Video embedding', 'SquarePlay'),
        card('Emoji support', '😀'),
      ],
    },
    {
      id: crypto.randomUUID(), title: 'Future', accent: '#a78bfa', icon: 'Rocket',
      cards: [card('Power-Ups', 'Zap'), card('Card syncing across boards', 'ArrowLeftRight')],
    },
    {
      id: crypto.randomUUID(), title: 'Next', accent: '#fb923c', icon: 'ArrowRight',
      cards: [
        card('Mark cards as done', 'SquareCheck'),
        card('Custom Emoji', 'Smile'),
        card('Additional sticker packs', 'Smile'),
        card('Delete permissions', 'Trash2'),
        card('3rd party calendar support', 'Calendar'),
      ],
    },
    {
      id: crypto.randomUUID(), title: 'Now', accent: '#4ade80', icon: 'Clock',
      cards: [
        card('Expand notifications', 'Bell'),
        card('Assign checklist items', 'SquareCheck'),
        card('2FA', 'Shield'),
        card('Reporting', 'ChartLine'),
      ],
    },
    {
      id: crypto.randomUUID(), title: 'Done', accent: '#cbd5e1', icon: 'CircleCheck',
      cards: [card('“Heart” comments', 'Heart'), card('Mobile app', 'Smartphone')],
    },
  ],
})
