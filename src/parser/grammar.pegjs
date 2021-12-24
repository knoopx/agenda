{
	const {
		startOfDay, startOfWeek, startOfMonth, startOfYear,
		endOfDay, endOfWeek, endOfMonth, endOfYear,
		addHours, addMinutes, addDays, addWeeks, addMonths, addYears,
		setHours, setMinutes,
		getHours, getMinutes,
		isSameMonth, isSameWeek,
		nextDay
	} = require('date-fns')

	const RRule = require("rrule").default

	function addTime(date, time = {}) {
		const { hour = 0, minute = 0 } = time
		return addHours(addMinutes(date, minute), hour)
	}

	function setTime(date, time = {}) {
		const { hour = 0, minute = 0 } = time
		return setHours(setMinutes(date, minute), hour)
	}

	function getWeekDayByName(name) {
		return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(name.toLowerCase())
	}

	function getMonthByName(name){
		return ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(name.toLowerCase()) + 1
	}

	function getFreqByUnit(name){
		switch (name) {
			case "minute": return RRule.MINUTELY
			case "hour": return RRule.HOURLY
			case "day": return RRule.DAILY
			case "week": return RRule.WEEKLY
			case "month": return RRule.MONTHLY
			case "year": return RRule.YEARLY
		}
		throw new Error(`invalid time unit: ${name}`)
	}

	function now(){
		if (options.now) {
			return options.now
		}
		return new Date()
	}

	options.weekStartsOn = options.weekStartsOn || 1
}

Root
	= head:Word tail:(_ (TimeConstructExpr / Word))* {
		let words = []
		return tail.reduce((acc, [,x]) => {
			if (typeof x == "object") {
				return { ...acc, ...x }
			} else {
				words.push(x)
				return { ...acc, subject: [head, ...words].join(" ") }
			}
		}, {})
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
	= expr:CountExpr _ "an hour" { return { freq: RRule.HOURLY, interval: expr} }
	// a day, week, month, year
	/ expr:CountExpr _ "a" _ freq:UnitTimeExpr { return { freq: getFreqByUnit(freq), interval: expr } }

Char "char"
	= !(_) . { return text() }

Word "word"
	= (Char Char*) { return text() }

Sentence "sentence"
	= Word (_ Word)* { return text() }

UnitMinute = "minute"i
UnitHour = "hour"i
UnitDay = "day"i
UnitWeek = "week"i
UnitMonth = "month"i
UnitYear = "year"i

UnitTime = UnitMinute / UnitHour / UnitDay / UnitWeek / UnitMonth / UnitYear

UnitTimeShort
	= "m"i { return "minute" }
	/ "h"i { return "hour" }
	/ "d"i { return "day" }
	/ "w"i { return "week" }
	/ "y"i { return "year" }

UnitTimePlural = expr:UnitTime "s"i { return expr }

UnitTimeExpr = UnitTimePlural / UnitTime / UnitTimeShort

TimeConstructExpr
	// every wednesday at 1 for 1h starting tomorrow
	= expr:RecurringExpr _for:(_ ForExpr)? start:(_ StartingExpr)? {
		return {
			...expr,
			...(start && { dtstart: start[1] }),
			...(_for && _for[1] )
		}
	}
	// tomorrow at 1h, 23/12/2022 at 20:50
    / date:DateExpr at:(_ AtTimeExpr)? _for:(_ ForExpr)? {
		const forExp = _for && _for[1]
		if (at) return { start: setTime(startOfDay(date), at[1]), ...forExp }
		return { start: date, ...forExp }
	}

	// after work, morning
	/ at:TimeOfTheDayExpr {
		return { start: setTime(now(), at) }
	}

	// at 5h
    / at:AtTimeExpr _for:(_ ForExpr)? {
		return { start: setTime(now(), at) }
	}

	// in 5min
	/ expr:InExpr _for:(_ ForExpr)? { return { ...expr, ...(_for && { start: _for[1] }) }}

RecurringExpr
	// every wednesday at 1
	= every:EveryExpr
	  at:(_ RecurringAtTimeExpr)?
	  {
		return {
			...every,
			...(at && at[1])
		}
	}
	/ RecurrencyExpr

EveryExpr
	= "every"i _ expr:EverySubExpr { return expr }
	/ "everyday"i { return { freq: RRule.DAILY } }

EverySubExpr
	// every 29 december
	= expr:DateShort { return { freq: RRule.YEARLY, byday: expr.day, bymonth: expr.month } }
    // every weekend
	/ "weekend"i { return { freq: RRule.WEEKLY, byweekday: getWeekDayByName("saturday") } }
	// every 2 tuesdays
	/ interval:NumberExpr _ expr:DayName "s" { return { freq: RRule.WEEKLY, byweekday: getWeekDayByName(expr), interval } }
	// every monday
	/ expr:DayName { return { freq: RRule.WEEKLY, byweekday: getWeekDayByName(expr)} }
	// every january, february, march, april, may, june, july, august, september, october, november, december
	/ expr:MonthName { return { freq: RRule.MONTHLY, bymonth: getMonthByName(expr) } }
	// every end of january, february, march, april, may, june, july, august, september, october, november, december
	/ "end" _ "of" _ expr:MonthName { return { freq: RRule.MONTHLY, bymonth: getMonthByName(expr), byday: -1 } }
	// every morning
	/ expr:TimeOfTheDayExpr
	// every 5 minutes
	/ expr:DurationAsInterval
	// every hour, day, week, month, year
	/ expr:UnitTime { return { freq: getFreqByUnit(expr) } }

// in 5 minutes, in 1w
InExpr
	//"in ..."
	= "in"i _ expr:Duration {
		switch (expr.unit) {
			case "minute": return { start: addMinutes(now(), expr.duration) }
			case "hour": return { start: addHours(now(), expr.duration) }
			case "day": return { start: addDays(now(), expr.duration) }
			case "week": return { start: addWeeks(now(), expr.duration) }
			case "month": return { start: addMonths(now(), expr.duration) }
			case "year": return { start: addYears(now(), expr.duration) }
			default: throw new Error(`unknown duration ${expr.duration}`)
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
	/ expr:TimeOfTheDayExpr { return setTime(startOfDay(now()), expr)  }

RecurringAtTimeExpr
	= time:AtTimeExpr {
		return Object.keys(time).reduce((res, key) => ({
			...res,
			["by" + key]: time[key]
		}), {})
	}

OnExpr
	= "on"i _ expr:DateShort { return expr }

ForExpr
	= "for"i _ expr:DurationAsMinutes { return { duration: expr } }

DateShort
	// 25/12
	= day:DayNumber "/" month:MonthNumber { return { day, month } }
	// 25 december
	/ day:DayNumber _ monthName:MonthName { return { day, month: getMonthByName(monthName) } }

DateRelative "relative date"
	= "today"i { return now() }
    / "tomorrow"i { return addHours(now(), 24) }
    / "weekend"i {
		let current = now()
		const weekDay = getWeekDayByName(dayName)
		while (!isWeekend(current)) {
			current = addHours(current, 24)
		}
		return current
	}
	/ NextDateExpr

NextDateExpr
	// next monday
	= ("next"i / "on"i) _ expr:NextDateSubExpr { return expr }

NextDateSubExpr
    = "week" { return startOfWeek(addWeeks(now(), 1), { weekStartsOn: options.weekStartsOn }) }
    / "month" { return startOfMonth(addMonths(now(), 1)) }
    / "quarter" { return startOfMonth(addMonths(now(), 4)) }
    / "year" { return startOfYear(addYears(now(), 1)) }

	// next monday
	/ dayName:DayName {
		let current = now()
		const weekDay = getWeekDayByName(dayName)
		while (current.getDay() !== weekDay) {
			current = addHours(current, 24)
		}
		return current
	 }

DateFull
	= day:DayNumber "/" month:MonthExpr "/" year:YearFull  { return new Date(year, month - 1, day)  }

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
	= ("morning" / "after wake up" / "this" _ "morning") { return { hour: 9, minute: 0 } }
	/ ("afternoon" / "after lunch" / "this" _ "afternoon") { return { hour: 15, minute: 0 } }
	/ ("evening" / "after work" / "this" _ "evening") { return { hour: 18, minute: 0 } }
	/ ("night" / "after diner" / "tonight") { return { hour: 22, minute: 0 } }

TimeShort "%m/h/d/w/y"
	// 0h
	= hour:TimeHour _?"h"?  { return { hour, minute: 0 } }

TimeLong "0..24:0..59"
	// 00:00
	= hour:TimeHour ":" minute:TimeMinute { return { hour, minute } }

TimeExpr
	= TimeLong / TimeShort

Duration "% minute..year(s)"
	// 1 week
	= duration:TextualOne _ unit:UnitTime  { return { duration, unit } }
	// 5 min, 5 minutes
	/ duration:NumberExpr _ unit:UnitTimePlural  { return { duration, unit } }
	// 30m
	/ duration:NumberExpr unit:UnitTimeShort  { return { duration, unit } }

DurationAsInterval
	= duration:Duration { return { freq: getFreqByUnit(duration.unit), interval: duration.duration } }

DurationAsMinutes "(n)mhdwy"
	// 5 minutes, 1w
	= duration:Duration {
		switch(duration.unit) {
			case "minute": return duration.duration
			case "hour": return duration.duration * 60
			case "day": return duration.duration * 60 * 24
			case "week":return duration.duration * 60 * 24 * 7
			case "month": return duration.duration * 60 * 24 * 7 * 4
			case "year": return duration.duration * 60 * 24 * 7 * 4 * 12
		}
		throw new Error("unknown time unit: " + duration.unit)
	}
