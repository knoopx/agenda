import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateTime, Settings } from "luxon";
import { Store } from "../models";
import { StoreContext } from "../hooks/useStore";
import Input from "./Input";

// Set up timezone and mock time
Settings.defaultZone = "Europe/Madrid";
const mockNow = DateTime.local(2024, 1, 15, 10, 0, 0);
Settings.now = () => mockNow.toMillis();

// Global store variable for tests
let store: any;

// Mock icons
vi.mock("~icons/mdi/update.jsx", () => ({
  default: ({ "data-testid": testId, ...props }: any) => (
    <span data-testid="recurring-icon" {...props} />
  ),
}));

// Mock the components
vi.mock("../Agenda/Task/TimeLabel", () => ({
  TimeLabel: ({ date }: { date: DateTime }) => (
    <span data-testid="time-label">{date.toFormat("HH:mm")}</span>
  ),
}));

vi.mock("../Agenda/Task/DurationLabel", () => ({
  DurationLabel: ({ duration }: { duration: any }) => (
    <span data-testid="duration-label">{duration.toHuman()}</span>
  ),
}));

vi.mock("../Agenda/Task/DateLabel", () => ({
  DateLabel: ({ date }: { date: DateTime }) => (
    <span data-testid="date-label">{date.toFormat("MMM dd")}</span>
  ),
}));

vi.mock("../Calendar/Indicator", () => ({
  default: ({ color }: { color: string }) => (
    <div data-testid="indicator" style={{ backgroundColor: color }} />
  ),
}));

const renderInput = () => {
  return render(
    <StoreContext.Provider value={store}>
      <Input />
    </StoreContext.Provider>,
  );
};

describe("Input Component", () => {
  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
    });
    vi.clearAllMocks();
  });

  it("renders input field", () => {
    renderInput();
    const input = screen.getByPlaceholderText("filter or add a task...");
    expect(input).toBeInTheDocument();
  });

  it("displays context indicator when context is present", () => {
    store.input.setExpression("@work task");

    renderInput();

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeInTheDocument();
  });

  it("displays emojis when displayEmoji is enabled", () => {
    // displayEmoji is already true from beforeEach, no need to toggle
    store.input.setExpression("task #home");

    renderInput();

    // The emoji should be extracted from the #home tag (👪 for home/family)
    const emojiElement = screen.getByText("👪");
    expect(emojiElement).toBeInTheDocument();
  });

  it("displays recurring icon when task is recurring", () => {
    store.input.setExpression("every day task");

    renderInput();

    const recurringIcon = screen.getByTestId("recurring-icon");
    expect(recurringIcon).toBeInTheDocument();
  });

  it("displays time label when nextAt is present", () => {
    store.input.setExpression("task at 1pm");

    renderInput();

    if (store.input.nextAt) {
      const timeLabel = screen.getByTestId("time-label");
      expect(timeLabel).toBeInTheDocument();
    }
  });

  it("displays duration label when duration is present", () => {
    store.input.setExpression("task for 2h");

    renderInput();

    if (store.input.duration) {
      const durationLabel = screen.getByTestId("duration-label");
      expect(durationLabel).toBeInTheDocument();
    }
  });

  it("displays date label when nextAt is present", () => {
    store.input.setExpression("task tomorrow");

    renderInput();

    if (store.input.nextAt) {
      const dateLabel = screen.getByTestId("date-label");
      expect(dateLabel).toBeInTheDocument();
    }
  });

  it("shows invalid state styling when expression is invalid", () => {
    store.input.setExpression("@@invalid@@");

    renderInput();

    const container = screen.getByPlaceholderText(
      "filter or add a task...",
    ).parentElement;
    expect(container).toHaveClass("border-base-08/50");
  });

  it("updates expression on input change", () => {
    renderInput();
    const input = screen.getByPlaceholderText("filter or add a task...");

    fireEvent.change(input, { target: { value: "new task" } });

    expect(input).toHaveValue("new task");
  });

  it("focuses input on mount", () => {
    renderInput();
    const input = screen.getByPlaceholderText("filter or add a task...");
    expect(input).toHaveFocus();
  });

  it("clears expression on Escape key", () => {
    renderInput();
    const input = screen.getByPlaceholderText("filter or add a task...");

    fireEvent.change(input, { target: { value: "some task" } });
    expect(store.input.expression).toBe("some task");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(store.input.expression).toBe("");
  });

  it("adds task and clears expression on Enter key when valid", () => {
    renderInput();
    const input = screen.getByPlaceholderText("filter or add a task...");

    fireEvent.change(input, { target: { value: "valid task" } });
    expect(store.input.expression).toBe("valid task");

    const initialTaskCount = store.tasks.length;
    fireEvent.keyDown(input, { key: "Enter" });

    expect(store.tasks.length).toBe(initialTaskCount + 1);
    expect(store.input.expression).toBe("");
  });

  it("does not add task on Enter key when invalid", () => {
    renderInput();
    const input = screen.getByPlaceholderText("filter or add a task...");

    fireEvent.change(input, { target: { value: "invalid @@" } });
    expect(store.input.expression).toBe("invalid @@");

    const initialTaskCount = store.tasks.length;
    fireEvent.keyDown(input, { key: "Enter" });

    expect(store.tasks.length).toBe(initialTaskCount);
    expect(store.input.expression).toBe("invalid @@");
  });
});
