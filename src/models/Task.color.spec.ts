import { describe, it, expect } from "vitest";
import { Store } from ".";

describe("Task Context Colors", () => {
  it("should assign different colors to tasks with different contexts", () => {
    const store = Store.create({
      tasks: [
        { expression: "buy milk @home" },
        { expression: "meeting @work" },
        { expression: "workout @gym" },
        { expression: "dinner @home" },
      ],
    });

    const tasks = store.tasks;

    // Check that tasks have the expected contexts
    console.log(
      "Task contexts:",
      tasks.map((t) => t.context),
    );
    console.log("Store contexts:", store.contexts);

    // Get colors for each task
    const colors = tasks.map((task) => task.contextColor);
    console.log("Task colors:", colors);

    // Tasks with same context should have same color
    expect(colors[0]).toBe(colors[3]); // both @home

    // Tasks with different contexts should have different colors
    expect(colors[0]).not.toBe(colors[1]); // @home vs @work
    expect(colors[0]).not.toBe(colors[2]); // @home vs @gym
    expect(colors[1]).not.toBe(colors[2]); // @work vs @gym
  });

  it("should handle tasks without contexts", () => {
    const store = Store.create({
      tasks: [
        { expression: "task without context" },
        { expression: "buy milk @home" },
      ],
    });

    const tasks = store.tasks;

    const colorWithoutContext = tasks[0].contextColor;
    const colorWithContext = tasks[1].contextColor;

    console.log("Without context:", tasks[0].context, colorWithoutContext);
    console.log("With context:", tasks[1].context, colorWithContext);

    // Task without context should get default color
    expect(colorWithoutContext).toBe("var(--base03)");

    // Task with context should get vibrant color
    expect(colorWithContext).not.toBe(colorWithoutContext);
  });

  it("should use Store.getContextColor method directly", () => {
    const store = Store.create();

    // Test getContextColor without tasks first
    const noContextColor = store.getContextColor();
    expect(noContextColor).toBe("var(--base03)");

    // Add tasks
    store.addTask({ expression: "buy milk @home" });
    store.addTask({ expression: "meeting @work" });

    const homeColor = store.getContextColor("home");
    const workColor = store.getContextColor("work");

    expect(homeColor).not.toBe(workColor);
    expect(homeColor).toBe(store.tasks[0].contextColor);
    expect(workColor).toBe(store.tasks[1].contextColor);
  });
});
