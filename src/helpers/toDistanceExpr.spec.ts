import { inspect } from "util";

import { expect, it } from "vitest";
import { DateTime } from "luxon";

import { toDistanceExpr } from ".";

const Now = DateTime.local(2021, 1, 1);

function testtoDistanceExpr(offset: any, expected: any) {
  it(`${inspect(offset)} ${inspect(expected)}`, () => {
    expect(toDistanceExpr(Now, Now.plus(offset))).toEqual(expected);
  });
}

testtoDistanceExpr({ minutes: 1 }, "in 1 min.");
testtoDistanceExpr({ minutes: -1 }, "1 min. ago");

testtoDistanceExpr({ hours: 1 }, "in 1 hr.");
testtoDistanceExpr({ hours: -1 }, "1 hr. ago");

testtoDistanceExpr({ days: 1 }, "tomorrow");
testtoDistanceExpr({ hours: 16 }, "in 16 hr.");

testtoDistanceExpr({ days: 2 }, "Sun");
testtoDistanceExpr({ days: 15 }, "in 2 wk.");

testtoDistanceExpr({ months: 1 }, "next month");
testtoDistanceExpr({ months: 1, days: 5 }, "Feb 6");

testtoDistanceExpr({ years: 1 }, "next Jan");
testtoDistanceExpr({ years: 1, days: 5 }, "next Jan 6");

testtoDistanceExpr({ years: 3 }, "in 3 yr.");

// Test for next weekday (line 67-68)
testtoDistanceExpr({ days: 7 }, "in 1 wk."); // Jan 1, 2021 + 7 days = Jan 8, 2021

// Test for next weekday future (line 69-71)
testtoDistanceExpr({ days: 8 }, "next Sat"); // Jan 1 Fri + 8 days = Jan 9 Sat

// Test for next weekday past (line 69-71)
testtoDistanceExpr({ days: -8 }, "past Thu"); // Jan 1 Fri - 8 days = Dec 24 Thu

// Test for months > 1 (line 74-76)
testtoDistanceExpr({ months: 2 }, "Mar 1"); // Jan 1 + 2 months = Mar 1
testtoDistanceExpr({ months: 3 }, "Apr 1"); // Jan 1 + 3 months = Apr 1
testtoDistanceExpr({ months: -2 }, "Nov 1"); // Jan 1 - 2 months = Nov 1
