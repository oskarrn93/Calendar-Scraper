import axios from 'axios'
import cheerio from 'cheerio'
import addHours from 'date-fns/addHours'
import { Event } from '../interfaces'

const url = 'https://www.hltv.org/matches'
const teams = ['fnatic', 'FaZe', 'NiP', 'G2', 'Astralis']

export const scrapeCS = async (DEBUG = false) => {
  const response = await axios.get(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'calendar-scraper',
    },
  })
  const { data } = response

  const parsedGames = parseHLTV(data, DEBUG)
  return parsedGames
}

const parseHLTV = (data: string, DEBUG: boolean) => {
  const $ = cheerio.load(data)

  const games = $('div.upcomingMatch')

  if (DEBUG) console.log(`games length: ${games.length}`)

  const result: Event[] = games
    .map((index, game) => {
      const start = new Date(cheerio(game).find('.matchTime').first().data('unix'))

      const team1 = cheerio(game).find('.matchTeam.team1 .matchTeamName').first().text().trim()
      const team2 = cheerio(game).find('.matchTeam.team2 .matchTeamName').first().text().trim()

      if (DEBUG) console.log(`team1: ${team1}, team2: ${team2}`)

      if (
        !teams.some(
          (team) =>
            team.toLowerCase() === team1.toLowerCase() ||
            team.toLowerCase() === team2.toLowerCase(),
        )
      ) {
        return null
      }
      const summary = `${team1} - ${team2}`
      const description = `${url}`

      const nrOfMaps = cheerio(game).find('.matchMeta').first().text().trim()
      if (DEBUG) console.log(`nrOfMaps: ${nrOfMaps}`)

      const end = (() => {
        switch (nrOfMaps) {
          case 'bo5':
            return addHours(start, 6)
          case 'bo3':
            return addHours(start, 4)
          case 'bo1':
            return addHours(start, 1)
          default:
            return addHours(start, 1)
        }
      })()

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
