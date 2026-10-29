export type Card = {
  id: string
  title: string
  description: string
  icon?: string
}

export type List = {
  id: string
  title: string
  accent: string
  icon: string
  cards: Card[]
}

export type Board = {
  title: string
  lists: List[]
}
