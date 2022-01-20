{
	const path = require("path")
	const { merge, mergeWith } = require('lodash')
	const { DateTime, Duration, Interval } = require("luxon")

	const { Frequency, Recurrence, MonthNames, WeekDayNames } = require("./types")

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
	= _* head:Subject _ tail:NaturalTimeExpr _ context:Context _* { return merge(head, tail, context) }
	/ _* head:Subject _ tail:NaturalTimeExpr _* { return merge(head, tail) }
	/ _* expr:NaturalTimeExpr _* { return expr }
	/ _* head:Subject _ context:Context _* {  return merge(head, context) }
	/ _* context:Context _* {  return context }
	/ _* head:Subject _*  { return head }
	/ _* { return {} }

_ "space"
	= [ ]+ { }

Subject
	= Word (_ !(NaturalTimeExpr / Context) Word)* { return { subject: text() } }

Context
	= "@" expr:Word { return { context: expr } }

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

NaturalTimeExpr
	// every wednesday
	= EveryExpr
	// tomorrow at 10, 23/12/2022 at 10
	/ start:DateExpr _ _for:ForExpr { return Recurrence.onceAt(start, _for) }
	// tomorrow, 23/12/2022
	/ start:DateExpr { return Recurrence.onceAt(start) }
	// after work, morning
	/ at:TimeOfTheDayExpr { return Recurrence.onceAt(now.set(at)) }
	// in 2 days
	/ InExpr
	// at 5h
    / at:AtTimeExpr { return Recurrence.onceAt(now.set(at)) }
	// this
	/ ThisExpr { return Recurrence.onceAt(now.set(at)) }
	// for 4h
	/ ForExpr

EveryExpr
	= "every"i _ expr:EverySubExpr { return expr }

EverySubExpr
	= head:EverySubExprExpr _ tail:EveryExprEnd { return { ...head, ...tail } }
	/ EverySubExprExpr

EveryExprEnd
	// at B for C starting D
	= a:EveryExprEndAtTimeOrForExpr _ b:StartingSubExpr { return { ...a, ...b } }
	// at A for B
	/ EveryExprEndAtTimeOrForExpr
	// starting A at B for C
	/ left:StartingSubExpr _ right:EveryExprEndAtTimeOrForExpr { return { ...left, ...right } }
	// starting Y until Z
 	/ left:StartingSubExpr _ right:UntilSubExpr { return { ...left, ...right } }
	// starting Y for Z
 	/ a:StartingSubExpr _ b:ForExpr { return { ...a, ...b } }
	/ StartingSubExpr
	/ UntilSubExpr
	/ ForExpr

EveryExprEndAtTimeExpr
	= head:EveryAfterTimeExpr tail:(_ "and"i _ EveryAfterTimeExpr)* { return mergeWithArray(head, ...tail.map(t => t[3])) }
	/ head:EveryTimeOfTheDayExpr tail:(_ "and"i _ EveryTimeOfTheDayExpr)* { return mergeWithArray(head, ...tail.map(t => t[3])) }
	/ "at"i _ expr:EveryAtTimeSubExprListExpr { return expr }

EveryAtTimeSubExprListExpr
	= head:EveryAtTimeSubExpr tail:(_ "and"i _ EveryAtTimeSubExpr)* { return mergeWithArray(head, ...tail.map(t => t[3])) }
	/ EveryAtTimeSubExpr

EveryAfterTimeExpr
	= expr:AfterTimeExpr {
		return {
			byHourOfDay: [expr.hour],
			byMinuteOfHour: [expr.minute]
		}
	}

EveryTimeOfTheDayExpr
	= expr:TimeOfTheDayExpr {
		return Recurrence.daily({
			byHourOfDay: [expr.hour],
			byMinuteOfHour: [expr.minute]
		})
	}

EveryAtTimeSubExpr
	= expr:AtTimeSubExpr {
		return {
			byHourOfDay: [expr.hour],
			byMinuteOfHour: [expr.minute]
		}
	}

EveryExprEndAtTimeOrForExpr
	= a:EveryExprEndAtTimeExpr _ b:ForExpr { return { ...a, ...b } }
	/ a:EveryExprEndAtTimeExpr

EverySubExprExpr
	// every morning and afternoon
	= head:EveryTimeOfTheDayExpr tail:(_ "and"i _ EveryTimeOfTheDayExpr)* { return mergeWithArray(head, ...tail.map(t => t[3])) }
	// every morning
	/ EveryTimeOfTheDayExpr
	// monday (and tuesday)
	/ EverySubExprListExpr
	// monday, 10 july
	/ EveryTimeExtendableSubExpr
	// every 5 minutes
	/ Period

EveryTimeExtendableSubExpr
	// wednesday, january, 29 december
	= EverySubExprListSubExpr
	// 10 august, 10/8/2020
	/ EveryDateSubExpr

EveryWeekDaySubExpr
	= expr:DayNameAsShort { return Recurrence.weekly({ byDayOfWeek: [expr] }) }

EveryMonthSubExpr
	= head:MonthNameAsNumber tail:(_ "and" _ MonthNameAsNumber)* {
		return Recurrence.monthly({
			byMonthOfYear: [head, ...tail.map(([,,,t]) => t)],
			byDayOfMonth: [1],
		})
	}

EveryDate
	= expr:DateShort { return Recurrence.yearly({
			byMonthOfYear: [expr.month],
			byDayOfMonth: [expr.day],
			byHourOfDay: [0],
			byMinuteOfHour: [0],
		})
	}

EveryWeekend = "weekend"i { return Recurrence.weekly({ byDayOfWeek: ["SA"] }) }
EveryInterval = interval:NumberExpr _ expr:DayNameAsShort "s" { return Recurrence.weekly({ interval, byDayOfWeek: [expr] }) }
EveryTimeUnit = expr:TimeUnitExpr { return Recurrence.fromDurationLike({ unit: expr }) }

EveryDateSubExpr
	// every monday, every january and february
	= EverySubExprListExpr
    // every weekend
	/ EveryWeekend
	// every month
	/ EveryTimeUnit
	// every 2 tuesdays
	/ EveryInterval

EverySubExprListExpr
	= head:EverySubExprListSubExpr tail:(_ "and"i _ EverySubExprListSubExpr)* {
		return mergeWithArray(head, ...tail.map(t => t[3]))
	}

EverySubExprListSubExpr
	// every 29 december
	= EveryDate
	// every january, february, march, april, may, june, july, august, september, october, november, december
	/ EveryMonthSubExpr
	// every monday
	/ EveryWeekDaySubExpr

InExpr
	// in 5 minutes, in 1w
	= "in"i _ duration:Duration { return { start: now.plus(duration) } }

StartingSubExpr
	// starting tomorrow, starting in 2w, starting next week
	= "starting"i _ start:DateExpr { return { start } }

UntilSubExpr
	= "until"i _ end:DateExpr { return { end } }

ThisExpr
	= "this"i _ expr:ThisSubExpr { return expr }

ThisSubExpr
	= "weekend"i { return now.startOf("week").set({ weekday: 6 }) }

TimeOfTheDayExpr
	= "morning"i { return { hour: hours.morning, minute: 0 } }
	/ "afternoon"i { return { hour: hours.afternoon, minute: 0 } }
	/ "evening"i { return { hour: hours.evening, minute: 0 } }
	/ "night"i { return { hour: hours.night, minute: 0 } }

AfterTimeExpr "after..."
	= "after"i _ "wake up"i { return { hour: hours.morning, minute: 0 } }
	/ "after"i _ "lunch"i { return { hour: hours.afternoon, minute: 0 } }
	/ "after"i _ "work"i  { return { hour: hours.evening, minute: 0 } }
	/ "after"i _ "diner"i { return { hour: hours.night, minute: 0 } }

AtTimeExpr
	= AfterTimeExpr
	/ TimeOfTheDayExpr
	/ "at"i _ expr:AtTimeSubExpr { return expr }

AtTimeSubExpr
	// morning, night
	= TimeOfTheDayExpr
	// 22h, 22:00
	/ TimeExpr

ForExpr
	= "for"i _ expr:Duration { return { duration: expr } }

OnExpr "on..."
	= "on"i _ expr:DateShort { return expr }

NextExpr "next..."
	// next monday
	= "next"i _ expr:NextSubExpr { return expr }

Season
	= "winter"i  { return now.set({ month: months.winter }).startOf("month") }
	/ "spring"i  { return now.set({ month: months.spring }).startOf("month") }
	/ "summer"i  { return now.set({ month: months.summer }).startOf("month") }
	/ "autumn"i  { return now.set({ month: months.autumn }).startOf("month") }

NextSubExpr
	= NextPeriodExpr
	/ NextWeekDayExpr
	/ Season

NextPeriodExpr
    = "week"i { return now.plus({ weeks: 1 }).startOf("week") }
    / "month"i { return now.plus({ months: 1 }).startOf("month") }
    / "quarter"i { return now.plus({ months: 4 }).startOf("month") }
    / "year"i { return now.plus({ years: 1 }).startOf("year") }

NextWeekDayExpr
	// next monday
	= number:DayNameAsNumber {
		let current = now
		while (current.weekday !== number) {
			current = current.plus({ days: 1 })
		}
		return current.startOf("day")
	 }

TodayAsDate
	= "today"i { return now.startOf("day") }

TomorrowAsDate
	= "tomorrow"i { return now.startOf("day").plus({ days: 1 }) }

DateShort
	// 25/12
	= day:DayNumber "/" month:MonthNumber { return now.set({ month, day }).startOf("day") }
	// 25 december
	/ day:DayNumber _ month:MonthNameAsNumber { return now.set({ month, day }).startOf("day") }

Date
	// 25/12/2020
	= day:DayNumber "/" month:MonthExpr "/" year:Number4Digit  { return DateTime.local(year, month, day).startOf("day")  }

DateExpr
	= left:DateExprLeft _ right:AtTimeExpr { return left.set(right) }
	/ expr:DateExprLeft

DateExprLeft
	= TodayAsDate
	/ ThisExpr
    / TomorrowAsDate
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
	= name:DayName { return WeekDayNames.indexOf(name) + 1 }

MonthNumber "0..12"
	= ("1" [0-2] / "0"? [0-9]) {  return Number(text()) }

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

TimeExpr
	= TimeLong12 / TimeLong24 / Hour12 / Hour24Abbr

DurationLike
	// one day, 2 weeks, 3 months
	= value:NumberOneExpr _ unit:TimeUnit  { return { value, unit } }
	// 5 minutes
	/ value:NumberExpr _ unit:TimeUnitPlural  { return { value, unit } }
	// 30min, 2mo
	/ value:NumberExpr _* unit:TimeUnitShort  { return { value, unit } }

Duration
	= duration:DurationLike  { return Duration.fromDurationLike({ [duration.unit]: duration.value }) }

Period
	= duration:DurationLike { return Recurrence.fromDurationLike(duration) }
