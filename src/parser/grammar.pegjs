{
	const {
		startOfDay, startOfWeek, startOfMonth, startOfYear,
		addHours, addMinutes, addDays, addWeeks, addMonths, addYears,
		setHours, setMinutes,
		getHours, getMinutes,
		isSameMonth, isSameWeek,
		nextDay
	} = require('date-fns')

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

	function now(){
		if (options.now) {
			return options.now
		}
		return new Date()
	}

	class Task {
		constructor(props = {}){
			Object.assign(this, props)
		}
	}

	class RecurringTask extends Task {
		next() {
			const { start, end, interval, time } = this
			const n = now()
			const next = addTime(start, time)
			if (next < n) {
				return this.next()
			}
			if (end && next > end) {
				return null
			}
			return next
		}
	}

	options.weekStartsOn = options.weekStartsOn || 1
}

Root
    //= subject:Sentence expr:TimeConstructExpr { return { subject, ...expr } }
	// = subject:Phrase _ expr:TimeConstructExpr { return { subject, ...expr } }
	= TimeConstructExpr

_ "space"
	= [ ]+

Integer "number"
	= digits:[0-9]+ { return parseInt(text(), 10) }

Char "char"
	// = !(_) . { return text() }
	= [^\s]+ { return text() }

Word "word"
	= (Char Char*) { return text() }

Sentence
	= Word (_ Word)* { return text() }

// Sentence "sentence"
// 	= head:Word tail:(TimeConstructExpr? / (_ Word)*)

	// / head:Word tail:(_ Word)* { return [head, ...tail.map(x => x[1])] }

TimeConstructExpr
	// every wednesday at 1 for 1h starting tomorrow
	= expr:RecurringExpr _for:(_ ForExpr)? start:(_ StartingExpr)? {
		return new RecurringTask({
			...expr,
			...(start && { start: start[1] }),
			...(_for && _for[1] )
		})
	}
	// tomorrow at 1h
    / date:DateExpr repeat:(_ AtExpr)? _for:(_ ForExpr)? {
		const forExp = _for && _for[1]
		if (repeat) return { start: setTime(startOfDay(date), repeat[1]), ...forExp }
		return new Task({ start: date, ...forExp })
	}
	/ time:TimeOfTheDay { return new Task({ start: addTime(startOfDay(now()), time) }) }
	// at 5h
    / repeat:AtExpr _for:(_ ForExpr)? {
		return new Task({ start: setTime(startOfDay(now()), repeat) })
	}

	// in 5min
	/ expr:InExpr _for:(_ ForExpr)? { return { ...expr, ...(_for && {start: _for[1]}) }}
	/ "" { return {} }

RecurringExpr
	// every wednesday at 1
	= every:EveryExpr
	  at:(_ AtExpr)?
	  {
		return {
			repeat: {
				...every,
				...at && at[1]
			}
		}
	}
	/ RecurrencyExpr

// 2 times a week, once a day
RecurrencyExpr
	// an hour
	= expr:CountExpr _ "an hour" { return {  repeat: { [frequency]: expr.interval } } }
	// a day, week, month, year
	/ expr:CountExpr _ "a" _ frequency:("day" / "week" / "month" / "year") {
		return {
			repeat: { [frequency]: expr.interval === 1 ? "*" : `*/${expr.interval}` }
		}
	}

EveryExpr
	= "every" _ value:EverySubExpr { return value }

EverySubExpr
	// every 29 december
	= expr:DateShort { return expr }
    // every weekend
	/ "weekend" { return { weekDay: 6 } }
	// every monday, tuesday, wednesday, thursday, friday, saturday, sunday
	/ expr:DayName { return { weekDay: getWeekDayByName(expr)} }
	// every january, february, march, april, may, june, july, august, september, october, november, december
	/ expr:MonthName { return { month: getMonthByName(expr) } }
	// every morning
	/ expr:TimeOfTheDay { return expr }
	// every end of month
	/ expr:Event { return expr }
	// every 5 minutes
	/ expr:Interval { return { [expr.frequency]: "*/" + expr.interval } }
	// every hour, day, week, month, year
	/ expr:UnitTime {
		switch (expr) {
			case "minute": return { minute: "*" }
			case "hour": return { hour: "*" }
			case "day": return { day: "*" }
			case "week": return { weekDay: 1 } // same as monday
			case "month": return { month: "*" }
			case "year": return { year: "*" }
			default: throw new Error("not supported")
		}
	 }

// in 5 minutes, in 1w
InExpr //"in ..."
	= "in" _ expr:Duration {
		switch (expr) {
			case "minute": return { start: addMinutes(now(), expr) }
			case "hour": return { start: addHours(now(), expr) }
			case "day": return { start: addDays(now(), expr) }
			case "week": return { start: addWeeks(now(), expr) }
			case "month": return { start: addMonths(now(), expr) }
			case "year": return { start: addYears(now(), expr) }
			default: throw new Error("not supported")
		}
	}

StartingExpr
	= "starting" _ date:DateExpr { return date }

AtExpr
	= time:TimeOfTheDay { return time }
	/ "at" _ time:TimeExpr { return time }
	/ "at" _ time:TimeOfTheDay { return setTime(startOfDay(now()), time)  }

OnExpr
	= "on" _ date:DateShort { return date }

UnitMinute = ("minutes"/"minute"/"min"/"m") { return "minute" }
UnitHour = ("hours"/"hour"/"h") { return "hour" }
UnitDay = ("days"/"day"/"d") { return "day" }
UnitWeek = ("weeks"/"week"/"w") { return "week" }
UnitMonth = ("months" / "month" / "M") { return "month" }
UnitYear = ("years"/"year"/"y") { return "year" }

UnitTime = UnitMonth / UnitMinute / UnitHour / UnitDay / UnitWeek / UnitYear

ForExpr
	= "for" _ value:Duration {
      return {
          duration: value
      }
	}

DateShort
	= day:DayNumber "/" month:MonthNumber { return { ...day, ...month } }
	/ day:DayNumber _ monthName:MonthName { return { ...day, month: getMonthByName(monthName) } }

DateRelative "relative date"
	= "today" { return now() }
    / "tomorrow" { return addHours(now(), 24) }
    / "weekend" {
		let current = now()
		const weekDay = getWeekDayByName(dayName)
		while (!isWeekend(current)) {
			current = addHours(current, 24)
		}
		return current
	}
    / "next" _ "week" { return startOfWeek(addWeeks(now(), 1), { weekStartsOn: options.weekStartsOn }) }
    / "next" _ "month" { return startOfMonth(addMonths(now(), 1)) }
    / "next" _ "quarter" { return startOfMonth(addMonths(now(), 4)) }
    / "next" _ "year" { return startOfYear(addYears(now(), 1)) }

	// next monday
	/ "next" _ dayName:DayName {
		let current = now()
		const weekDay = getWeekDayByName(dayName)
		while (current.getDay() !== weekDay) {
			current = addHours(current, 24)
		}
		return current
	 }

	/ "at" _ "the" _ "end" _ "of" _ "the" _ "day" { return { end: endOfDay(now()) } }
	/ "at" _ "the" _ "end" _ "of" _ "the" _ "week" { return { end: endOfWeek(now(), { weekStartsOn: options.weekStartsOn }) } }
	/ "at" _ "the" _ "end" _ "of" _ "the" _ "month" { return { end: endOfMonth(now()) } }
	/ "at" _ "the" _ "end" _ "of" _ "the" _ "year" { return { end: endOfYear(now()) } }


Event
	= "end of month" { return { day: "L" } }
	/ "end of year" { return { month: "L" } }
	/ "end of week" { return { weekDay: "L" } }

DateFull
	= day:DayNumber "/" month:MonthExpr "/" year:Year  { return { day, month, year } }

DateExpr
	= DateRelative
    / DateFull
	/ DateShort

DayNumber "0..31"
	= "3"[0-1] { return { day: parseInt(text(), 10) } }
	/ [1-2][0-9] { return { day: parseInt(text(), 10) } }

DayName
	= name:("monday" / "tuesday" / "wednesday" / "thursday" / "friday" / "saturday" / "sunday") { return name }

MonthNumber "0..12"
	= ("1"[0-2] / [0-9]) {  return { month: parseInt(text(), 10) } }

MonthName
	= name:("january" / "february" / "march" / "april" / "may" / "june" / "july" / "august" / "september" / "october" / "november" / "december") { return name }

MonthExpr
	= monthName:MonthName { return { month: getMonthByName(monthName) } }
	/ MonthNumber

Year "[2021]"
	= [0-9][0-9][0-9][0-9] { return { year: parseInt(text(), 10) } }

Hour "[12:00, 22:00]}"
	= ("2"[0-4] / ("0"?"1"[0-9]/[0-9])) { return parseInt(text(), 10) }

Minute "{60}"
	= [1-9][0-9] / "0"[0-9]  { return parseInt(text(), 10) }

TimeOfTheDay "[time of the day]"
	= ("morning" / "after wake up" / "this morning") { return { hour: 9, minute: 0} }
	/ ("afternoon" / "after lunch" / "this afternoon") { return { hour: 15, minute: 0 } }
	/ ("evening" / "after work" / "this evening") { return { hour: 18, minute: 0 } }
	/ ("night" / "after diner" / "tonight") { return { hour: 22, minute: 0 } }

TimeShort "[1h]"
	// 0h
	= hour:Hour _?"h"?  { return { hour, minute: 0 } }

TimeLong "[00:00]"
	// 00:00
	= hour:Hour ":" minute:Minute { return { hour, minute } }

TimeExpr
	= TimeLong / TimeShort

Duration "(n)mhdwy"
	// 5 minutes, 1w
	= interval: Integer _? frequency: UnitTime {
		switch(frequency.replace(/s$/, "")) {
			case "minute": return interval
			case "hour": return interval * 60
			case "day": return interval * 60 * 24
			case "week":return interval * 60 * 24 * 7
			case "month": return interval * 60 * 24 * 7 * 4
			case "year": return interval * 60 * 24 * 7 * 4 * 12
			default: throw new Error("unknown unit: " + frequency)
		}
	}

Interval "[5m, 2 days]"
	// 5 minutes, 1w
	= interval:Integer _? frequency: UnitTime { return { frequency, interval } }

NumericCountExpr "(n) times"
	// 1 time
	= "1" _ "time" { return 1 }
	// 5 times
	/value:Integer _ "times" { return value }

TextualCountExpr "[once, twice...]"
	= "once" { return 1 }
    / "twice" { return 2 }

CountExpr
	= value:(NumericCountExpr / TextualCountExpr) { return { interval: value }}