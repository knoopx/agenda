{
	const path = require("path")
	const { DateTime, Duration, Interval } = require("luxon")

	const DayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ]
	const WeekDays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
	const MonthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

	const { Frequency, Recurrency } = require("./types")

	// 1 is Monday and 7 is Sunday
	function getWeekDayByName(name) {
		return WeekDays[DayNames.indexOf(name)]
	}

	function getMonthByName(name){
		return MonthNames.indexOf(name.toLowerCase()) + 1
	}

	const Now = options.now ?? DateTime.now()
}

Root
	= TimeConstructExpr
	/ head:Word tail:(_ (TimeConstructExpr / Word))* {
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
	= [0-9]+ { return parseInt(text(), 10) }

TextualOne = "one"i { return 1 }
TextualTwo = "two"i { return 2 }
TextualThree = "three"i { return 3 }
TextualFour = "four"i { return 4 }
TextualFive = "five"i { return 5 }
TextualSix = "six"i { return 6 }
TextualSeven = "seven"i { return 7 }
TextualEight = "eight"i { return 8 }
TextualNine = "nine"i { return 9 }
TextualTen = "ten"i { return 10 }
TextualEleven = "eleven"i { return 11 }
TextualTwelve = "twelve"i { return 12 }

TextualNumber "one..twelve"
	= (TextualOne / TextualTwo / TextualThree / TextualFour / TextualFive / TextualSix / TextualSeven / TextualEight / TextualNine / TextualTen / TextualEleven / TextualTwelve)

NumberExpr
	= Number
	/ TextualNumber

OneExpr = (TextualOne / "1") { return  1 }

NumericOccurenceExpr "% times"
	// 1 time
	=  OneExpr _ { return 1 }
	// 5 times
	/value:NumberExpr { return value }

TextualOcurrenceExpr "once..thrice"
	= "once" { return 1 }
    / "twice" { return 2 }
    / "thrice" { return 3 }

CountExpr
	// 1 time, twice, 3 times
	= value:(NumericOccurenceExpr / TextualOcurrenceExpr) { return  value }

// 2 times a week, once a day
RecurrencyExpr
	// an hour
	= expr:CountExpr _ "an"i _ "hour"i { return Recurrency.hourly() }
	// a day, week, month, year
	/ value:CountExpr _ "a"i _ unit:UnitTimeExpr {
		return Recurrency.fromDurationLike({ value, unit })
	}

Char "char"
	= !(_) . { return text() }

Word "word"
	= (Char Char*) { return text() }

Sentence "sentence"
	= Word (_ Word)* { return text() }

UnitMinute = "minute"i { return "minutes" }
UnitHour = "hour"i { return "hours" }
UnitDay = "day"i { return "days" }
UnitWeek = "week"i { return "weeks" }
UnitMonth = "month"i { return "months" }
UnitYear = "year"i { return "years" }

UnitTime = UnitMinute / UnitHour / UnitDay / UnitWeek / UnitMonth / UnitYear

UnitTimeShort
	= "m"i { return "minutes" }
	/ "h"i { return "hours" }
	/ "d"i { return "days" }
	/ "w"i { return "weeks" }
	/ "y"i { return "years" }

UnitTimePlural = expr:UnitTime "s"i { return text() }

UnitTimeExpr = UnitTimePlural / UnitTime / UnitTimeShort

TimeConstructExpr
	// every wednesday at 1 for 1h starting tomorrow
	= expr:RecurringExpr _for:(_ ForExpr)? start:(_ StartingExpr)? {
		return {
			...expr,
			...(start && {
					start: start[1]
				}),
			...(_for && _for[1] )
		}
	}
	// tomorrow at 1h, 23/12/2022 at 20:50
    / start:DateExpr at:(_ AtTimeExpr)? _for:(_ ForExpr)? {
		const forExp = _for && _for[1]
		if (at) return {
			...forExp,
			start: start.set(at[1]),
		}
		return {
			...forExp,
			start,
		}
	}

	// after work, morning
	/ at:TimeOfTheDayExpr {
		return {
			start: Now.set(at),
		}
	}

	// at 5h
    / at:AtTimeExpr _for:(_ ForExpr)? {
		return {
			start: Now.set(at),
		}
	}

	// in 5m, in 5 minutes
	/ expr:InExpr _for:(_ ForExpr)? {
		return {
			...expr,
			...(_for && {
				start: _for[1],
			})
		}
	}

RecurringExpr
	// every wednesday at 1
	= every:EveryExpr at:(_ RecurringAtTimeExpr)? {
		return {
			...every,
			...(at && at[1])
		}
	}
	// 2 times a week
	/ RecurrencyExpr

EveryExpr
	= "every"i _ expr:EverySubExpr { return expr }
	/ "everyday"i { return Recurrency.daily() }

EveryDateSpecifierExpr
	// every 29 december
	= expr:DateShort {
		return Recurrency.yearly({
			byMonthOfYear: [expr.month],
			byDayOfMonth: [expr.day],
			byHourOfDay: [0],
			byMinuteOfHour: [0],
		})
	}
    // every weekend
	/ "weekend"i { return Recurrency.weekly({ byDayOfWeek: ["SA"] }) }
	// every 2 tuesdays
	/ interval:NumberExpr _ expr:DayName "s" {
		return Recurrency.weekly({
			interval,
			byDayOfWeek: [getWeekDayByName(expr)],
		})
	}
	// every monday
	/ expr:DayName {
		return Recurrency.weekly({
			byDayOfWeek: [getWeekDayByName(expr)],
		})
	}
	// every january, february, march, april, may, june, july, august, september, october, november, december
	/ expr:MonthName exprs:("and" _ MonthName)* {
		return Recurrency.monthly({
			byMonthOfYear: [getMonthByName(expr)],
			byDayOfMonth: [1],
		})
	}
	// every end of january, february, march, april, may, june, july, august, september, october, november, december
	/ "end" _ "of" _ expr:MonthName {
		return Recurrency.monthly({
			byMonthOfYear: [getMonthByName(expr)],
			byDayOfMonth: [-1],
		})
	}

EveryTimeSpecifierExpr
	// every morning
	= expr:TimeOfTheDayExpr {
		return Recurrency.daily({
			byHourOfDay: [expr.hour],
			byMinuteOfHour: [expr.minute],
		})
	}
	// every 5 minutes
	/ expr:Period
	// every minute hour, day, week, month, year
	/ unit:UnitTime { return Recurrency.fromDurationLike({ unit }) }

EverySubExpr
	= EveryDateSpecifierExpr / EveryTimeSpecifierExpr


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
	// morning, at night
	= ("at"i _)? expr:TimeOfTheDayExpr { return expr }
	// at 5h
	/ "at"i _ expr:AtTimeSubExpr { return expr }

AtTimeSubExpr
	= TimeExpr
	/ expr:TimeOfTheDayExpr { return Now.set(expr)  }

RecurringAtTimeExpr
	= time:AtTimeExpr expr:(_ "and" _ MonthName)* {
		return {
			byHourOfDay: [time.hour],
			byMinuteOfHour: [time.minute]
		}
	}

OnExpr
	= "on"i _ expr:DateShort { return expr }

ForExpr
	= "for"i _ expr:Duration { return { duration: expr } }

DateRelative "relative date"
	= "today"i { return Now.startOf("day") }
    / "tomorrow"i { return Now.startOf("day").plus({ days: 1 }) }
    / "weekend"i {
		return Now.set({ weekday: [6, 7] })
		// let current = Now.startOf("day")
		// while (![6,7].include(current.weekday)) {
		// 	current = current.plus({days: 1})
		// }
		// return current
	}
	/ NextDateExpr

NextDateExpr
	// next monday
	= ("next"i / "on"i) _ expr:NextDateSubExpr { return expr }

NextDateSubExpr
    = "week" { return Now.plus({ weeks: 1 }).startOf("week") }
    / "month" { return Now.plus({ months: 1 }).startOf("month") }
    / "quarter" { return Now.plus({ months: 4 }).startOf("month") }
    / "year" { return Now.plus({ years: 1 }).startOf("year") }

	// next monday
	/ dayName:DayName {
		return Now.plus({ weeks: 1 }).startOf("week").set({ weekday: DayNames.indexOf(dayName)  })
		// let start, current = Now.startOf("day")
		// const weekDay = getWeekDayByName(dayName)

		// if (typeof weekDay !== "number")
		// 	return null

		// if (!(weekDay > 0 && weekDay < 7))
		// 	return null

		// while (current.weekday !== weekDay) {
		// 	current = current.plus({ days: 1 })
		// 	if (end.diff(start).days > 7){
		// 		return null
		// 	}
		// }
		// return current
	 }

DateShort
	// 25/12
	= day:DayNumber "/" month:MonthNumber { return Now.set({ month, day }) }
	// 25 december
	/ day:DayNumber _ monthName:MonthName { return Now.set({ month: getMonthByName(monthName), day }) }

DateFull
	= day:DayNumber "/" month:MonthExpr "/" year:YearFull  { return DateTime.local(year, month, day)  }

DateExpr
	= DateRelative
    / DateFull
	/ DateShort

DayNumber "0..31"
	= ("3" [0-1] / [0-2] [0-9] / [0-9]) { return parseInt(text(), 10) }

DayName "monday...sunday"
	= name:("monday"i / "tuesday"i / "wednesday"i / "thursday"i / "friday"i / "saturday"i / "sunday"i) { return name }

MonthNumber "0..12"
	= ("1"[0-2] / [0-9]) {  return parseInt(text(), 10) }

MonthName "february..december"
	= name:("january"i / "february"i / "march"i / "april"i / "may"i / "june"i / "july"i / "august"i / "september"i / "october"i / "november"i / "december"i) { return name }

MonthExpr
	= monthName:MonthName { return getMonthByName(monthName) }
	/ MonthNumber

YearFull "year number"
	= [0-9][0-9][0-9][0-9] { return parseInt(text(), 10) }

TimeHour "0..24"
	= ("2"[0-4] / ("0"?"1"[0-9]/[0-9])) { return parseInt(text(), 10) }

TimeMinute "00..59"
	= ([1-5][0-9] / "0"[0-9] ) { return parseInt(text(), 10) }

TimeOfTheDayExpr
	= ("morning"i / "after" _ "wake" _ "up" / "this" _ "morning") { return { hour: 9, minute: 0 } }
	/ ("afternoon"i / "after"i _ "lunch"i / "this"i _ "afternoon"i) { return { hour: 15, minute: 0 } }
	/ ("evening"i / "after"i _ "work"i / "this"i _ "evening"i) { return { hour: 18, minute: 0 } }
	/ ("night"i / "after" _ "diner"i / "tonight"i) { return { hour: 22, minute: 0 } }

TimeShort "%m/h/d/w/y"
	// 0h
	= hour:TimeHour _?"h"?  { return { hour, minute: 0 } }

TimeLong "0..24:0..59"
	// 00:00
	= hour:TimeHour ":" minute:TimeMinute { return { hour, minute } }

TimeExpr
	= TimeLong / TimeShort

DurationLike "% minute..year(s)"
	// 1 week
	= value:TextualOne _ unit:UnitTime  { return { value, unit } }
	// 5 min, 5 minutes
	/ value:NumberExpr _ unit:UnitTimePlural  { return { value, unit } }
	// 30m
	/ value:NumberExpr unit:UnitTimeShort  { return { value, unit } }

Duration "% minute..year(s)"
	= duration:DurationLike  { return Duration.fromDurationLike({ [duration.unit]: duration.value }) }

Period
	= duration:DurationLike { return Recurrency.fromDurationLike(duration) }
