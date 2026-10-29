import {
  ArrowLeftRight, ArrowRight, Bell, Calendar, Camera, ChartLine, CircleCheck, Clock, Globe,
  Heart, Lightbulb, Link, Rocket, Shield, Smartphone, Smile, SquareCheck, SquarePlay, Star,
  StickyNote, Trash2, Zap, type LucideIcon,
} from 'lucide-react'

// Icons are stored by name so the board stays plain JSON in storage.
export const icons: Record<string, LucideIcon> = {
  ArrowLeftRight, ArrowRight, Bell, Calendar, Camera, ChartLine, CircleCheck, Clock, Globe,
  Heart, Lightbulb, Link, Rocket, Shield, Smartphone, Smile, SquareCheck, SquarePlay, Star,
  StickyNote, Trash2, Zap,
}

export function Icon({ name, className }: { name?: string; className?: string }) {
  // Not an icon name but an emoji, e.g. '😀': show it as the real, colored emoji.
  if (name && !icons[name] && /\p{Extended_Pictographic}/u.test(name)) {
    return <span className={`${className ?? ''} grid place-items-center text-[18px] leading-none`} aria-hidden>{name}</span>
  }
  const C = (name && icons[name]) || StickyNote
  // The star is filled, as in the reference.
  return <C className={`${className ?? ''} ${name === 'Star' ? 'fill-current' : ''}`} aria-hidden />
}
