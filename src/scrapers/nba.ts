import axios from 'axios'
import subDays from 'date-fns/subDays'
import addHours from 'date-fns/addHours'
import { parseFromTimeZone } from 'date-fns-timezone'
import _ from 'lodash'
import { Event, NBASchedule } from '../interfaces'

const year = 2021
const url = `http://data.nba.com/data/10s/v2015/json/mobile_teams/nba/${year}/league/00_full_schedule.json`

const teams = ['Celtics', 'Lakers', 'Warriors', 'Nets', 'Heat', 'Grizzlies']

export const scrapeNBA = async (DEBUG = false) => {
  const response = await axios.get<NBASchedule>(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'calendar-scraper',
    },
  })
  const { data } = response

  return parseNBA(data, DEBUG)
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

          const end = addHours(start, 3)

          const homeTeam = `${h.tc} ${h.tn}` //e.g. Boston Celtics
          const visitingTeam = `${v.tc} ${v.tn}`
          const location = `${an}, ${ac}, ${as}` //e.g. Capital One Arena, Washington, DC

          const summary = `${visitingTeam} - ${homeTeam}`
          const description = `${location}

        https://nba.com`

          return {
            summary,
            description,
            start,
            end,
          }
        })
        .filter((element) => element !== null) as Event[],
  )

  return _.flatten(events)
}
