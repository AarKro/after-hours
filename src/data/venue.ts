export interface OpeningHours {
  days: string
  hours: string
}

export const openingHours: OpeningHours[] = [
  { days: 'Tue – Thu', hours: '17:00 – 00:00' },
  { days: 'Fri – Sat', hours: '17:00 – 02:00' },
  { days: 'Sun – Mon', hours: 'closed' },
]

export const venue = {
  name: 'after hours',
  address: 'Badenerstrasse 12, 8005 Zürich',
  email: 'hello@afterhours.ch',
  hoursSummary: 'Tue–Sat from 17:00',
}
