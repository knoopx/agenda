{
	const path = require("path")
	const { merge, mergeWith } = require('lodash')
	const { DateTime, Duration, Interval } = require("luxon")

	const MonthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

	const { Frequency, Recurrency } = require("./types")

	function mergeWithArray(initial, ...rest){
		return mergeWith(initial, ...rest, (a, b) => {
			if (Array.isArray(a) && Array.isArray(b)){
				return Array.from(new Set(a.concat(b)))
			}
		})
	}

	const Now = options.now ?? DateTime.now()
}

Root
	= NaturalTimeExpr
	/ head:Word tail:(_ (NaturalTimeExpr / Word))* {
		let words = []
		return tail.reduce((acc, [,x]) => {
			if (typeof x == "object") {
				return { ...acc, ...x }
			} else {
				words.push(x)
				return { ...acc, subject: [head, ...words].join(" ") }
			}
		}, { subject: head })
	}

_ "space"
	= [ ]+ { }

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
	= (NumberOneTextual / NumberTwoTextual / NumberThreeTextual / NumberFourTextual / NumberFiveTextual / NumberSixTextual / NumberSevenTextual / NumberEightTextual / NumberNineTextual / NumberTenTextual / NumberElevenTextual / NumberTwelveTextual)

NumberExpr
	= Number
	/ NumberTextualExpr

NumberOneExpr = (NumberOneTextual / "1") { return  1 }

OcurrenceTextualExpr "once..thrice"
	= "once"i { return 1 }
    / "twice"i { return 2 }
    / "thrice"i { return 3 }

OccurenceNumericExpr "(n) time(s)"
	// one time, 1 time
	=  NumberOneExpr _ "time"i { return 1 }
	// 5 times
	/ expr:NumberExpr _ "times"i { return expr }

OccurrenceExpr
	// 1 time, twice, 3 times
	= OccurenceNumericExpr / OcurrenceTextualExpr

Char "char"
	= !(_) . { return text() }

Word "word"
	= (Char Char*) { return text() }

Sentence "sentence"
	= Word (_ Word)* { return text() }

TimeUnit
	= "minute"i { return "minutes" }
	/ "hour"i { return "hours" }
	/ "day"i { return "days" }
	/ "week"i { return "weeks" }
	/ "month"i { return "months" }
	/ "year"i { return "years" }

TimeUnitShort
	= "min"i { return "minutes" }
	/ "h"i { return "hours" }
	/ "d"i { return "days" }
	/ "w"i { return "weeks" }
	/ "mo"i { return "months" }
	/ "y"i { return "years" }

TimeUnitPlural = expr:TimeUnit "s"i { return text() }

TimeUnitExpr = TimeUnitPlural / TimeUnit / TimeUnitShort

NaturalDueExpr
	= expr:InExpr forExpr:(_ ForExpr)? {
		return {
			...expr,
			...(forExpr && {
				start: forExpr[1],
			})
		}
	}

NaturalTimeExpr
	// every wednesday (at 11) for 1h starting tomorrow
	= NaturalRecurringExpr
	// tomorrow at 1h, 23/12/2022 at 20:50
    / NaturalDateTimeExpr
	// after work, morning
	/ NaturalTimeOfTheDayExpr
	// at 5h
    / NaturalAtTimeExpr
	// in 5m, in 5 minutes
	/ NaturalDueExpr

NaturalDateTimeExpr
	= start:DateExpr at:(_ AtTimeSubExpr)? forExpr:(_ ForExpr)? {
		if (at) start = start.set(at[1])
		return Recurrency.onceAt(start, forExpr && forExpr[1])
	}

NaturalTimeOfTheDayExpr
	= at:TimeOfTheDayExpr {
		return Recurrency.onceAt(Now.set(at))
	}

NaturalAtTimeExpr
	= at:AtTimeSubExpr forExpr:(_ ForExpr)? {
		return Recurrency.onceAt(Now.set(at), forExpr && forExpr[1])
	}

NaturalRecurringExpr
	// every wednesday (at 11) for 1h starting tomorrow
	= expr:RecurringSubExpr _ forExpr:ForExpr _ start:StartingExpr { return { ...expr, start,...forExpr } }
	// every wednesday (at 11) starting tomorrow
	/ expr:RecurringSubExpr _ start:StartingExpr { return { ...expr, start } }
	// every wednesday (at 11) for 1h
	/ expr:RecurringSubExpr _ forExpr:ForExpr { return { ...expr, ...forExpr} }
	// every wednesday (at 11)
	/ RecurringSubExpr

RecurringSubExpr
	// every monday and wednesday at 11
	= EveryManyAtTimeExpr
	// every wednesday at 11
	/ EveryAtTimeExpr
	// every wednesday
	/ EveryExpr
	// 2 times a week
	/ RecurrencyExpr

RecurrencyExpr
	// twice an hour
	= expr:OccurrenceExpr _ "an"i _ "hour"i { return Recurrency.hourly() }
	// three times a day
	/ value:OccurrenceExpr _ "a"i _ unit:TimeUnitExpr { return Recurrency.fromDurationLike({ value, unit }) }

EveryExpr
	= "every"i _ expr:EverySubExpr { return expr }
	/ "everyday"i { return Recurrency.daily() }

EveryWeekDay
	= expr:DayNameAsShort { return Recurrency.weekly({ byDayOfWeek: [expr] }) }

EveryMonth
	= head:MonthNameAsNumber tail:(_ "and" _ MonthNameAsNumber)* {
		return Recurrency.monthly({
			byMonthOfYear: [head, ...tail.map(([,,,t]) => t)],
			byDayOfMonth: [1],
		})
	}

EveryDate
	= expr:DateShort { return Recurrency.yearly({
			byMonthOfYear: [expr.month],
			byDayOfMonth: [expr.day],
			byHourOfDay: [0],
			byMinuteOfHour: [0],
		})
	}

EveryWeekend = "weekend"i { return Recurrency.weekly({ byDayOfWeek: ["SA"] }) }
EveryInterval = interval:NumberExpr _ expr:DayNameAsShort "s" { return Recurrency.weekly({ interval, byDayOfWeek: [expr] }) }

EveryDateSpecifierSubExpr
	// every 29 december
	= EveryDate
    // every weekend
	/ EveryWeekend
	// every 2 tuesdays
	/ EveryInterval
	// every monday, every january
	/ EveryRepeatableExpr

EveryRepeatableExpr
	// every january, february, march, april, may, june, july, august, september, october, november, december
	= EveryMonth
	// every monday
	/EveryWeekDay

ManyEveryRepeatableExpr
	= head:EveryRepeatableExpr tail:(_ "and"i _ EveryRepeatableExpr)* {
		return mergeWithArray(head, ...tail.map(t => t[3]))
	}

EveryManyAtTimeExpr
	= every:EveryExpr _ at:ManyEveryAtTimeExpr { return { ...every, ...at } }

EverySubExpr
	// every
	= ManyEveryRepeatableExpr
	/ EveryTimeSpecifierSubExpr

EveryTimeOfTheDayExpr
	= expr:TimeOfTheDayExpr {
		return Recurrency.daily({
			byHourOfDay: [expr.hour],
			byMinuteOfHour: [expr.minute],
		})
	}
EveryTimeSpecifierSubExpr
	// every morning
	= EveryTimeOfTheDayExpr
	// every 5 minutes
	/ Period
	// every minute hour, day, week, month, year
	/ unit:TimeUnit { return Recurrency.fromDurationLike({ unit }) }


// in 5 minutes, in 1w
InExpr
	//"in ..."
	= "in"i _ duration:Duration {
		return {
			start: Now.plus(duration),
		}
	}

StartingExpr
	= "starting"i _ expr:DateExpr { return expr }

UntilExpr
	= "until"i _ expr:DateExpr { return expr }

AtTimeExpr
	= TimeOfTheDayExpr
	/ "at"i _ expr:AtTimeSubExpr { return expr }

AtTimeSubExpr "at..."
	// morning, at night
	= TimeOfTheDayExpr
	// at 5h
	/ AtTimeExpr
	// 22h, 22:00
	/ TimeExpr
	// morning
	/ expr:TimeOfTheDayExpr { return Now.set(expr)  }

EveryAtTimeExpr
	= time:AtTimeSubExpr {
		return {
			byHourOfDay: [time.hour],
			byMinuteOfHour: [time.minute]
		}
	}

ManyEveryAtTimeExpr
	= head:EveryAtTimeExpr tail:(_ "and"i _ EveryAtTimeExpr)* {
		return mergeWithArray(head, ...tail.map(t => t[3]))
	}

ForExpr "for..."
	= "for"i _ expr:Duration { return { duration: expr } }

OnExpr "on..."
	= "on"i _ expr:DateShort { return expr }

NextExpr "next..."
	// next monday
	= "next"i _ expr:NextSubExpr { return expr }

NextSubExpr
	= NextPeriodExpr
	/ NextWeekDayExpr

NextPeriodExpr
    = "week"i { return Now.plus({ weeks: 1 }).startOf("week") }
    / "month"i { return Now.plus({ months: 1 }).startOf("month") }
    / "quarter"i { return Now.plus({ months: 4 }).startOf("month") }
    / "year"i { return Now.plus({ years: 1 }).startOf("year") }

NextWeekDayExpr
	// next monday
	= number:DayNameAsNumber {
		return Now.plus({ weeks: 1 }).startOf("week").set({ weekday: number })
		// let current = Now
		// while (current.weekday !== number) {
		// 	current = current.plus({ days: 1 })
		// }
		// return current
	 }

TodayAsDate
	= "today"i { return Now.startOf("day") }

TomorrowAsDate
	= "tomorrow"i { return Now.startOf("day").plus({ days: 1 }) }

WeekendAsDate
	= "weekend"i { return Now.startOf("week").set({ weekday: 6 }) }

DateShort
	// 25/12
	= day:DayNumber "/" month:MonthNumber { return Now.set({ month, day }) }
	// 25 december
	/ day:DayNumber _ month:MonthNameAsNumber { return Now.set({ month, day }) }

Date
	= day:DayNumber "/" month:MonthExpr "/" year:Number4Digit  { return DateTime.local(year, month, day)  }

DateExpr
	= TodayAsDate
    / TomorrowAsDate
    / WeekendAsDate
	/ NextExpr
	/ Date
	/ DateShort

DayNumber "0..31"
	= ("3" [0-1] / [0-2] [0-9] / [0-9]) { return Number(text()) }

DayName "monday...sunday"
	= name:("monday"i / "tuesday"i / "wednesday"i / "thursday"i / "friday"i / "saturday"i / "sunday"i) { return name }

DayNameAsShort
	= number:DayNameAsNumber { return ["MO", "TU", "WE", "TH", "FR", "SA", "SU"][number - 1] }

DayNameAsNumber
	= name:DayName { return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(name) + 1 }

MonthNumber "0..12"
	= ("1"[0-2] / [0-9]) {  return Number(text()) }

MonthName "february..december"
	= name:("january"i / "february"i / "march"i / "april"i / "may"i / "june"i / "july"i / "august"i / "september"i / "october"i / "november"i / "december"i) { return name }

MonthNameAsNumber
	= name:MonthName { return MonthNames.indexOf(name.toLowerCase()) + 1 }

MonthExpr
	= MonthNameAsNumber
	/ MonthNumber

Number4Digit "year number"
	= [0-9][0-9][0-9][0-9] { return Number(text()) }

NumberUpTo12 "0..12"
	= ("1"[0-2] / ("0"?"1"[0-9]/[0-9])) { return Number(text()) }

NumberUpTo24 "0..24"
	= ("2"[0-4] / ("0"?"1"[0-9]/[0-9])) { return Number(text()) }

NumberUpTo59 "00..59"
	= ([1-5][0-9] / "0"[0-9] ) { return Number(text()) }

TimeOfTheDayExpr
	= ("morning"i / "after" _ "wake" _ "up" / "this" _ "morning") { return { hour: 9, minute: 0 } }
	/ ("afternoon"i / "after"i _ "lunch"i / "this"i _ "afternoon"i) { return { hour: 15, minute: 0 } }
	/ ("evening"i / "after"i _ "work"i / "this"i _ "evening"i) { return { hour: 18, minute: 0 } }
	/ ("night"i / "after" _ "diner"i / "tonight"i) { return { hour: 22, minute: 0 } }

Hour24Abbr "(n)h"
	// 0h
	= hour:NumberUpTo24 _?"h"?  { return { hour, minute: 0 } }

Hour12  "(n){am,pm}"
	// 0am
	= hour:NumberUpTo12 _?"am"i  { return { hour, minute: 0 } }
	// 0pm
	/ hour:NumberUpTo12 _?"pm"i  { return { hour: hour + 12, minute: 0 } }

TimeLong24 "0..24:0..59"
	// 00:00
	= hour:NumberUpTo24 ":" minute:NumberUpTo59 { return { hour, minute } }

TimeLong12 "0..12:0..59"
	// 00:00 am
	= hour:NumberUpTo12 ":" minute:NumberUpTo59 _? "am"i { return { hour, minute } }
	// 00:00 pm
	/ hour:NumberUpTo12 ":" minute:NumberUpTo59 _? "pm"i { return { hour: hour + 12, minute } }

TimeExpr
	= TimeLong12 / TimeLong24 / Hour12 / Hour24Abbr

DurationLike "(n) minute..year(s)"
	// one day, 2 weeks, 3 months
	= value:NumberOneTextual _ unit:TimeUnit  { return { value, unit } }
	// 5 min, 5 minutes
	/ value:NumberExpr _ unit:TimeUnitPlural  { return { value, unit } }
	// 30m
	/ value:NumberExpr unit:TimeUnitShort  { return { value, unit } }

Duration "(n) minute..year(s)"
	= duration:DurationLike  { return Duration.fromDurationLike({ [duration.unit]: duration.value }) }

Period
	= duration:DurationLike { return Recurrency.fromDurationLike(duration) }
