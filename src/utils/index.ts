import crypto from 'crypto'

import type { ICalEventData } from 'ical-generator'
import type { Event } from '../interfaces'
import { Action } from '../types'

export const createCalendarEvents = (games: Event[]): ICalEventData[] => {
  return games.map(({ start, end, summary, description }) => {
    const uid = crypto.randomBytes(20).toString('hex')

    return {
      start,
      end,
      summary,
      description,
      uid,
    }
  })
}

export const getResponseHeaders = (id: Action) => ({
  'Content-Type': 'text/calendar',
  'Content-Disposition': `attachment; filename="${id.toLowerCase()}.ics"`,
})
