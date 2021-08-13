import arg from 'arg'

import { generateCalendar } from './calendar'

const args = arg({
  '--cs': Boolean,
  '--nba': Boolean,
  '--football': Boolean,
})

if (!args['--cs'] && !args['--nba'] && !args['--football']) {
  console.log(`Please provide a valid argument!

--cs, --nba, --football`)
}

if (args['--cs']) {
  ;(async () => {
    const result = await generateCalendar('CS')
    console.log('result', result)
  })()
}

if (args['--nba']) {
  ;(async () => {
    const result = await generateCalendar('NBA')
    console.log('result', result)
  })()
}

if (args['--football']) {
  ;(async () => {
    const result = await generateCalendar('Football')
    console.log('result', result)
  })()
}
