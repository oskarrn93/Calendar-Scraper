import axios from 'axios'
import cheerio from 'cheerio'
import parse from 'date-fns/parse'
import addHours from 'date-fns/addHours'
import { parseFromTimeZone } from 'date-fns-timezone'
import { Event } from '../interfaces'

const url = 'https://www.tvmatchen.nu/fotboll'
const teams = [
  'Sverige',
  'Real Madrid',
  'Malmö FF',
  'Manchester United',
  'PSG',
  'Manchester City',
  'Chelsea',
]

const blacklistKeywordRegex = /u\d\d|dam|women|youth/gi

export const scrapeTvMatchen = async (DEBUG = false) => {
  const response = await axios.get<string>(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'calendar-scraper',
    },
  })
  const { data } = response

  return parseTvmatchen(data, DEBUG)
}

const parseTvmatchen = (data: string, DEBUG: boolean): Event[] => {
  const $ = cheerio.load(data)

  const games = $('.match-list > div')

  if (DEBUG) console.log(`games length: ${games.length}`)

  return games
    .map((_index, game) => {
      const summary = $(game).find('.match-detail h3').first().text().trim()

      if (!teams.some((team) => summary.toLowerCase().includes(team.toLowerCase()))) {
        return null
      }

      if (blacklistKeywordRegex.test(summary)) {
        return null
      }

      const tournament = $(game).find('.match-detail p a').first().text().trim()
      if (blacklistKeywordRegex.test(tournament)) {
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

      return {
        summary,
        description,
        start,
        end,
      }
    })
    .get()
    .filter((element) => element !== null)
}
