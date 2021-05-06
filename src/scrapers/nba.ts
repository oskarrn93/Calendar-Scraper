import axios from 'axios'
import subDays from 'date-fns/subDays'
import addHours from 'date-fns/addHours'
import { parseFromTimeZone } from 'date-fns-timezone'
import _ from 'lodash'
import { Event, NBASchedule } from '../interfaces'

const url =
  'http://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2020/league/00_full_schedule.json'

const teams = ['Celtics', 'Lakers', 'Warriors', 'Nets']

export const scrapeNBA = async (DEBUG = false) => {
  const response = await axios.get(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'calendar-scraper',
    },
  })
  const { data } = response

  const parsedGames = parseNBA(data, DEBUG)
  return parsedGames
}

const parseNBA = ({ lscd }: NBASchedule, DEBUG: boolean): Event[] => {
  const dateTreshold = subDays(Date.now(), 1)

  const events: Event[][] = lscd.map(
    ({ mscd: { g } }) =>
      g
        .map(({ etm, ac, an, as, h, v }) => {
          if (etm == 'TBD') {
            return null
          }

          if (
            !teams.some(
              (team) =>
                team.toLowerCase() === v.tn.toLowerCase() ||
                team.toLowerCase() === h.tn.toLowerCase(),
            )
          ) {
            return null
          }

          const start = parseFromTimeZone(etm, {
            timeZone: 'America/New_York',
          })

          if (dateTreshold > start) {
            return null
          }

          const end = addHours(start, 2.5)

          const homeTeam = `${h.tc} ${h.tn}` //e.g. Boston Celtics
          const visitingTeam = `${v.tc} ${v.tn}`
          const location = `${an}, ${ac}, ${as}` //e.g. Capital One Arena, Washington, DC

          const summary = `${visitingTeam} - ${homeTeam}`
          const description = `${location}

        https;//nba.com`

          const result: Event = {
            summary,
            description,
            start,
            end,
          }

          return result
        })
        .filter((element) => element !== null) as Event[],
  )

  const result = _.flatten(events)
  return result
}
