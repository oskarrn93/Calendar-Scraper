import axios from 'axios'
import cheerio from 'cheerio'
import parse from 'date-fns/parse'
import addHours from 'date-fns/addHours'
import { parseFromTimeZone } from 'date-fns-timezone'
import { Event } from '../interfaces'

const url = 'https://www.tvmatchen.nu/'
const teams = [
  'Sverige',
  'Real Madrid',
  'Malmö FF',
  'Manchester United',
  'PSG',
  'FC Bayern München',
  'Manchester City',
  'Barcelona',
  'Chelsea',
  'AC Milan',
]

export const scrapeTvMatchen = async (DEBUG = false) => {
  const response = await axios.get(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'calendar-scraper',
    },
  })
  const { data } = response

  const parsedGames = parseTvmatchen(data, DEBUG)
  return parsedGames
}

const parseTvmatchen = (data: string, DEBUG: boolean) => {
  const $ = cheerio.load(data)

  const games = $('.match-list > div')

  if (DEBUG) console.log(`games length: ${games.length}`)

  const result: Event[] = games
    .map((index, game) => {
      const summary = $(game).find('.match-detail h3').first().text().trim()

      if (!teams.some((team) => summary.toLowerCase().includes(team.toLowerCase()))) {
        return null
      }

      const description = $(game)
        .find('.match-channels li a img')
        .map((index, channel) => {
          return $(channel).attr('alt')?.trim()
        })
        .get()
        .filter((element) => element)
        .join(', ')

      const time = $(game).find('.match-time').first().text().trim()
      const date = $(game).parent().parent().data('date')

      const parsedDate = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date())

      const start = parseFromTimeZone(parsedDate.toISOString(), {
        timeZone: 'Europe/Berlin',
      })

      const end = addHours(start, 2)

      const event: Event = {
        summary,
        description,
        start,
        end,
      }

      return event
    })
    .get()
    .filter((element) => element !== null)

  return result
}
