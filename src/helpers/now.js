import { DateTime } from "luxon"
import { _isComputingDerivation } from "mobx"
import { fromResource } from "mobx-utils"

function createIntervalTicker(interval) {
  let subscriptionHandle
  return fromResource(
    (sink) => {
      sink(DateTime.now())
      subscriptionHandle = setInterval(() => sink(DateTime.now()), interval)
    },
    () => {
      clearInterval(subscriptionHandle)
    },
    DateTime.now(),
  )
}
function createAnimationFrameTicker() {
  const frameBasedTicker = fromResource(
    (sink) => {
      sink(DateTime.now())
      function scheduleTick() {
        window.requestAnimationFrame(() => {
          sink(DateTime.now())
          if (frameBasedTicker.isAlive()) scheduleTick()
        })
      }
      scheduleTick()
    },
    () => {},
    DateTime.now(),
  )
  return frameBasedTicker
}

const tickers = {}

export function now(interval = 1000) {
  if (!_isComputingDerivation()) {
    return DateTime.now()
  }
  if (!tickers[interval]) {
    if (typeof interval === "number")
      tickers[interval] = createIntervalTicker(interval)
    else tickers[interval] = createAnimationFrameTicker()
  }
  return tickers[interval].current()
}
