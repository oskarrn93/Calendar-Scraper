import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda'

import { generateCalendar } from '../calendar'

import { Action } from '../types'
import { getResponseHeaders } from './../utils'

const genericHandler = async (id: Action, _event: APIGatewayProxyEvent) => {
  const data = await generateCalendar(id)

  return {
    statusCode: 200,
    headers: getResponseHeaders(id),
    body: data,
  }
}

export const nba: APIGatewayProxyHandler = async (event) => genericHandler('NBA', event)
export const cs: APIGatewayProxyHandler = async (event) => genericHandler('CS', event)
export const football: APIGatewayProxyHandler = async (event) => genericHandler('Football', event)
