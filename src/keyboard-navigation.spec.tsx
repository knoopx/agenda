import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import React from "react";
import Task from "./Agenda/Task/Task";
import Input from "./App/Input";
import { StoreContext } from "./hooks/useStore";
import Store from "./models/Store";

let store: any;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

beforeEach(() => {
  store = Store.create({ tasks: [] });
  store.addTask({ expression: "First task" });
  store.addTask({ expression: "Second task" });
  store.addTask({ expression: "Third task" });
});

describe("Keyboard Navigation Integration", () => {
  it("should set up correct tabIndex values for main input and tasks", () => {
    render(
      <TestWrapper>
        <div>
          <Input />
          <table>
            <tbody>
              {store.tasks.map((task: any, index: number) => (
                <Task key={task.id} task={task} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </TestWrapper>,
    );

    // Check main input has tabIndex 1
    const mainInput = screen.getByPlaceholderText("filter or add a task...");
    expect(mainInput).toHaveAttribute("tabIndex", "1");

    // Check task inputs have correct tabIndex values
    const taskInputs = screen.getAllByDisplayValue(/task/);
    expect(taskInputs[0]).toHaveAttribute("tabIndex", "2"); // index 0 + 2
    expect(taskInputs[1]).toHaveAttribute("tabIndex", "3"); // index 1 + 2
    expect(taskInputs[2]).toHaveAttribute("tabIndex", "4"); // index 2 + 2
  });

  it("should allow focusing elements in tabIndex order", () => {
    render(
      <TestWrapper>
        <div>
          <Input />
          <table>
            <tbody>
              {store.tasks.map((task: any, index: number) => (
                <Task key={task.id} task={task} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </TestWrapper>,
    );

    // Get all focusable elements
    const allFocusable = Array.from(
      document.querySelectorAll("[tabindex]"),
    ).filter((el) => (el as HTMLElement).tabIndex >= 0) as HTMLElement[];

    // Should have main input + 3 task inputs = 4 elements
    expect(allFocusable).toHaveLength(4);

    // Check they are in the correct order by tabIndex
    expect(allFocusable[0]).toHaveAttribute("tabIndex", "1"); // main input
    expect(allFocusable[1]).toHaveAttribute("tabIndex", "2"); // first task
    expect(allFocusable[2]).toHaveAttribute("tabIndex", "3"); // second task
    expect(allFocusable[3]).toHaveAttribute("tabIndex", "4"); // third task
  });
});
