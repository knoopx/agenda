{
	const path = require("path")
	const { merge, mergeWith } = require('lodash')
	const luxon = require("luxon")
	const { DateTime, Duration, Interval } = luxon

	const types = require("./types")
	const { Frequency, Recurrence, MonthNames, MonthNamesShort, WeekDayNames, WeekDayNamesShort } = types

	function mergeWithArray(initial, ...rest){
		return mergeWith(initial, ...rest, (a, b) => {
			if (Array.isArray(a) && Array.isArray(b)){
				return Array.from(new Set(a.concat(b)))
			}
		})
	}

	const {
		now = DateTime.now(),
		hours = {
			morning: 9,
			afternoon: 15,
			evening: 18,
			night: 22,
		},
		months = {
			winter: 9,
			spring: 15,
			summer: 18,
			autumn: 22,
		},
	} = options
}

Root
	= _* head:Expr tail:(_ Expr)* _* { return merge(head, ...tail.map(t => t[1])) }
	/ _* { return {} }

Expr
	= ContextOrTagExpr / NaturalTimeExpr / Subject

_ "space"
	= [ ]+ { }

Subject
	= Word (_ !(Context / Tag / NaturalTimeExpr) Word)* { return { subject: text() } }

ContextOrTagExpr
	= head:(Context / TagExpr ) tail:(_ (Context / TagExpr))* { return mergeWithArray(head, ...tail.map(t => t[1])) }

Context
	= "@" tail:(!"@" Char)* { return { contexts: [tail.map(x => x[1]).join("")] } }

Tag
	= "#" tail:(!"#" Char)* { return { tags: [tail.map(x => x[1]).join("")] } }

TagExpr
	= head:Tag tail:(_ Tag)*  {
		return { tags: [...head.tags, ...tail.flatMap(t => t[1].tags)] }
	}

Number "number"
	= [0-9]+ { return Number(text()) }

NumberOneTextual = "one"i { return 1 }
NumberTwoTextual = "two"i { return 2 }
NumberThreeTextual = "three"i { return 3 }
NumberFourTextual = "four"i { return 4 }
NumberFiveTextual = "five"i { return 5 }
NumberSixTextual = "six"i { return 6 }
NumberSevenTextual = "seven"i { return 7 }
NumberEightTextual = "eight"i { return 8 }
NumberNineTextual = "nine"i { return 9 }
NumberTenTextual = "ten"i { return 10 }
NumberElevenTextual = "eleven"i { return 11 }
NumberTwelveTextual = "twelve"i { return 12 }

NumberTextualExpr "one..twelve"
	= NumberOneTextual
	/ NumberTwoTextual
	/ NumberThreeTextual
	/ NumberFourTextual
	/ NumberFiveTextual
	/ NumberSixTextual
	/ NumberSevenTextual
	/ NumberEightTextual
	/ NumberNineTextual
	/ NumberTenTextual
	/ NumberElevenTextual
	/ NumberTwelveTextual

NumberExpr
	= Number
	/ NumberTextualExpr

NumberOneExpr
	= (NumberOneTextual / "1") { return  1 }

Char "char"
	= !(_) . { return text() }

Word "word"
	= Char Char* { return text() }

Sentence "sentence"
	= Word (_ Word)* { return text() }

DurationUnit
	= "minute"i { return "minutes" }
	/ "hour"i { return "hours" }
	/ "day"i { return "days" }
	/ "week"i { return "weeks" }
	/ "month"i { return "months" }
	/ "year"i { return "years" }

DurationUnitShort
	= "min"i { return "minutes" }
	/ "h"i { return "hours" }
	/ "d"i { return "days" }
	/ "w"i { return "weeks" }
	/ "mo"i { return "months" }
	/ "y"i { return "years" }

DurationUnitPlural = expr:DurationUnit "s"i { return text() }

DurationUnitExpr = DurationUnitPlural / DurationUnit / DurationUnitShort

NaturalTimeExpr
	// every wednesday
	= EveryExpr
	// tomorrow at 10, 23/12/2022 at 10
	/ start:DateTimeExpr _ _for:ForExpr { return Recurrence.onceAt(start, _for) }
	// tomorrow, 23/12/2022
	/ start:DateTimeExpr { return Recurrence.onceAt(start) }
	// after work, morning
	/ at:TimeOfTheDay { return Recurrence.onceAt(now.set(at)) }
	// in 2 days
	/ InExpr
	// at 5h
    / at:AtTimeExpr { return Recurrence.onceAt(now.set(at)) }
	// this weekend
	/ "this"i _ "weekend" { return Recurrence.onceAt(now.set(at)) }
	// for 4h
	/ ForExpr

EveryExpr
	= "every"i _ expr:EverySubExpr { return expr }

EverySubExpr
	= head:RecurringExpr _ tail:RecurringExprSpecifierExpr { return { ...head, ...tail } }
	/ RecurringExpr

RecurringExpr
	// 29 december
	= RecurringDateExpr
	// morning
	/ expr:RecurringTimeOfTheDayExpr { return { ...expr, frequency: Frequency.DAILY } }
	// january
	/ RecurringMonthExpr
	// monday
	/ RecurringDayOfTheWeekExpr
    // weekend
	/ RecurringWeekend
	// month
	/ RecurringDurationUnit
	// 2 tuesdays
	/ RecurringDayOfTheWeekInterval
	// 5 minutes
	/ RecurringDurationExpr

RecurringExprSpecifierExpr
	// at A for B starting C until D
	= at:AtRecurringTimeExpr _ for_:ForExpr _ starting:StartingExpr _ until:UntilExpr { return merge(at, for_, starting, until) }
	// at A for B starting C
	/ at:AtRecurringTimeExpr _ for_:ForExpr _ starting:StartingExpr { return merge(at, for_, starting) }
	// at A for B
	/ at:AtRecurringTimeExpr _ for_:ForExpr { return merge(at, for_) }
	// for A starting B until C
	/ for_:ForExpr _ starting:StartingExpr _ until:UntilExpr { return merge(for_, starting, until) }
	// for A starting B
	/ for_:ForExpr _ starting:StartingExpr { return merge(for_, starting) }
	// starting A until B
	/ starting:StartingExpr _ until:UntilExpr { return merge(starting, until) }
	// starting A
	/ StartingExpr
	// until A
	/ UntilExpr
	// for a
	/ ForExpr
	// at A
	/ AtRecurringTimeExpr

AtRecurringTimeExpr
	= "at"i _ expr:RecurringTimeExpr { return expr }
	/ RecurringAfterTimeOfTheDayExpr
	/ RecurringTimeOfTheDayExpr

RecurringAfterTimeOfDay
	= expr:AfterTimeOfTheDay {
		return {
			byHourOfDay: [expr.hour],
			byMinuteOfHour: [expr.minute]
		}
	}

RecurringAfterTimeOfTheDayExpr
 	= head:RecurringAfterTimeOfDay tail:(_ "and"i _ RecurringAfterTimeOfDay)* { return mergeWithArray(head, ...tail.map(t => t[3])) }

RecurringTimeOfTheDay
	= expr:TimeOfTheDay {
		return {
			byHourOfDay: [expr.hour],
			byMinuteOfHour: [expr.minute]
		}
	}

RecurringTimeOfTheDayExpr
	= head:RecurringTimeOfTheDay tail:(_ "and"i _ RecurringTimeOfTheDay)* { return mergeWithArray(head, ...tail.map(t => t[3])) }

RecurringTime
	= expr:TimeExpr {
		return {
			byHourOfDay: [expr.hour],
			byMinuteOfHour: [expr.minute]
		}
	}

RecurringTimeExpr
	= head:RecurringTime tail:(_ "and"i _ RecurringTime)* { return mergeWithArray(head, ...tail.map(t => t[3])) }

RecurringDayOfTheWeek
	= dayName:DayOfTheWeek { return Recurrence.weekly({ byDayOfWeek: [WeekDayNamesShort[WeekDayNames.indexOf(dayName)]] }) }

RecurringDayOfTheWeekExpr
	= head:RecurringDayOfTheWeek tail:(_ "and"i _ RecurringDayOfTheWeek)* {
		return mergeWithArray(head, ...tail.map(t => t[3]))
	}

RecurringMonth
	= head:MonthNameAsNumber tail:(_ "and" _ MonthNameAsNumber)* {
		return Recurrence.monthly({
			byMonthOfYear: [head, ...tail.map(([,,,t]) => t)],
			byDayOfMonth: [1],
		})
	}

RecurringMonthExpr
	= head:RecurringMonth tail:(_ "and"i _ RecurringMonth)* {
		return mergeWithArray(head, ...tail.map(t => t[3]))
	}

RecurringDate
	= expr:DateShort { return Recurrence.yearly({
			byMonthOfYear: [expr.month],
			byDayOfMonth: [expr.day],
		})
	}

RecurringDateExpr
	= head:RecurringDate tail:(_ "and"i _ RecurringDate)* {
		return mergeWithArray(head, ...tail.map(t => t[3]))
	}

RecurringWeekend = "weekend"i { return Recurrence.weekly({ byDayOfWeek: ["SA"] }) }
RecurringDayOfTheWeekInterval = interval:NumberExpr _ dayName:DayOfTheWeek "s" { return Recurrence.weekly({ interval, byDayOfWeek: [WeekDayNamesShort[WeekDayNames.indexOf(dayName)]] }) }
RecurringDurationUnit = expr:DurationUnitExpr { return Recurrence.fromDurationLike({ unit: expr }) }

RecurringDurationExpr
	= duration:Duration { return Recurrence.fromDurationLike(duration) }

InExpr
	// in 5 minutes, in 1w
	= "in"i _ duration:DurationExpr { return { start: now.plus(duration) } }

StartingExpr
	// starting tomorrow, starting in 2w, starting next week
	= "starting"i _ start:DateTimeExpr { return { start } }

UntilExpr
	= "until"i _ end:DateTimeExpr { return { end } }

TimeOfTheDay
	= "morning"i { return { hour: hours.morning, minute: 0 } }
	/ "afternoon"i { return { hour: hours.afternoon, minute: 0 } }
	/ "evening"i { return { hour: hours.evening, minute: 0 } }
	/ "night"i { return { hour: hours.night, minute: 0 } }

AfterTimeOfTheDay "after..."
	= "after"i _ "wake up"i { return { hour: hours.morning, minute: 0 } }
	/ "after"i _ "lunch"i { return { hour: hours.afternoon, minute: 0 } }
	/ "after"i _ "work"i  { return { hour: hours.evening, minute: 0 } }
	/ "after"i _ "diner"i { return { hour: hours.night, minute: 0 } }

AtTimeExpr
	= AfterTimeOfTheDay
	/ TimeOfTheDay
	/ "at"i _ expr:TimeExpr { return expr }

TimeExpr
	// morning, night
	= TimeOfTheDay
	// 22h, 22:00
	/ Time

ForExpr
	= "for"i _ expr:DurationExpr { return { duration: expr } }

OnExpr "on..."
	= "on"i _ expr:OnSubExpr { return expr }

OnSubExpr "on..."
	= NextWeekDayExpr
	/ NextSeason

NextExpr "next..."
	// next monday
	= "next"i _ expr:NextSubExpr { return expr }

NextSubExpr
    = "week"i { return now.plus({ weeks: 1 }).startOf("week") }
    / "month"i { return now.plus({ months: 1 }).startOf("month") }
    / "quarter"i { return now.plus({ months: 4 }).startOf("month") }
    / "year"i { return now.plus({ years: 1 }).startOf("year") }
	/ NextWeekDayExpr
	/ NextSeason

NextSeason
	= "winter"i  { return now.set({ month: months.winter }).startOf("month") }
	/ "spring"i  { return now.set({ month: months.spring }).startOf("month") }
	/ "summer"i  { return now.set({ month: months.summer }).startOf("month") }
	/ "autumn"i  { return now.set({ month: months.autumn }).startOf("month") }

NextWeekDayExpr
	// monday
	= number:DayOfTheWeekAsNumber {
		let current = now
		while (current.weekday !== number) {
			current = current.plus({ days: 1 })
		}
		return current.startOf("day")
	 }

DateShort
	// 25/12
	= day:DayNumber "/" month:MonthNumber { return now.set({ month, day }).startOf("day") }
	// december 25
	/ month:MonthNameAsNumber _ day:DayNumber { return now.set({ month, day }).startOf("day") }
	// 25 december
	/ day:DayNumber _ month:MonthNameAsNumber { return now.set({ month, day }).startOf("day") }

Date
	// 25/12/2020
	= day:DayNumber "/" month:MonthExpr "/" year:Number4Digit  { return DateTime.local(year, month, day).startOf("day")  }
	/ day:DayNumber _ month:MonthExpr _ year:Number4Digit  { return DateTime.local(year, month, day).startOf("day")  }

DateExpr
	= NextExpr
	/ OnExpr
	/ "today"i { return now.startOf("day") }
	/ "tomorrow"i { return now.startOf("day").plus({ days: 1 }) }
	/ "this"i _ "weekend"i { return now.startOf("week").set({ weekday: 6 }) }
	/ Date
	/ DateShort

DateTimeExpr
	= left:DateExpr _ right:AtTimeExpr { return left.set(right) }
	/ expr:DateExpr

DayNumber "0..31"
	= ("3" [0-1] / [0-2] [0-9] / [0-9]) { return Number(text()) }

DayOfTheWeek "monday...sunday"
	= name:("monday"i / "tuesday"i / "wednesday"i / "thursday"i / "friday"i / "saturday"i / "sunday"i) { return name }

DayOfTheWeekAsNumber
	= name:DayOfTheWeek { return WeekDayNames.indexOf(name) + 1 }

MonthNumber "0..12"
	= ("1" [0-2] / "0"? [0-9]) {  return Number(text()) }

MonthNameShort "feb..dec"
	= name:("jan"i / "feb"i / "mar"i / "apr"i / "may"i / "jun"i / "jul"i / "aug"i / "sep"i / "oct"i / "nov"i / "dec"i) { return name }

MonthName "february..december"
	= name:("january"i / "february"i / "march"i / "april"i / "may"i / "june"i / "july"i / "august"i / "september"i / "october"i / "november"i / "december"i) { return name }

MonthNameAsNumber
	= name:MonthName { return MonthNames.indexOf(name.toLowerCase()) + 1 }
	/ name:MonthNameShort { return MonthNamesShort.indexOf(name.toLowerCase()) + 1 }

MonthExpr
	= MonthNameAsNumber
	/ MonthNumber

Number4Digit "year number"
	= [0-9][0-9][0-9][0-9] { return Number(text()) }

NumberUpTo12 "0..12"
	= ("1"[0-2] / "1" [0-9] / "0"? [0-9]) { return Number(text()) }

NumberUpTo24 "0..24"
	= ("2"[0-4] / "1"[0-9] / "0"? [0-9]) { return Number(text()) }

NumberUpTo59 "00..59"
	= ([1-5][0-9] / "0"[0-9] ) { return Number(text()) }

Hour24Abbr "(n)h"
	// 0h
	= hour:NumberUpTo24 _ "h"i { return { hour, minute: 0 } }
	/ hour:NumberUpTo24 "h"i { return { hour, minute: 0 } }
	/ hour:NumberUpTo24 { return { hour, minute: 0 } }

Hour12  "(n){am,pm}"
	// 0am
	= hour:NumberUpTo12 _? "am"i  { return { hour, minute: 0 } }
	// 0pm
	/ hour:NumberUpTo12 _? "pm"i  { return { hour: hour + 12, minute: 0 } }

TimeLong24 "0..24:0..59"
	// 00:00
	= hour:NumberUpTo24 ":" minute:NumberUpTo59 { return { hour, minute } }

TimeLong12 "0..12:0..59"
	// 00:00 am
	= hour:NumberUpTo12 ":" minute:NumberUpTo59 _? "am"i { return { hour, minute } }
	// 00:00 pm
	/ hour:NumberUpTo12 ":" minute:NumberUpTo59 _? "pm"i { return { hour: hour + 12, minute } }

Time
	= TimeLong12 / TimeLong24 / Hour12 / Hour24Abbr

Duration
	// one day, 2 weeks, 3 months
	= value:NumberOneExpr _ unit:DurationUnit  { return { value, unit } }
	// 5 minutes
	/ value:NumberExpr _ unit:DurationUnitPlural  { return { value, unit } }
	// 30min, 2mo
	/ value:NumberExpr _* unit:DurationUnitShort  { return { value, unit } }

DurationExpr
	= duration:Duration  { return Duration.fromDurationLike({ [duration.unit]: duration.value }) }
