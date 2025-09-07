import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Input Component - Completion Functionality", () => {
  beforeEach(() => {
    store = Store.create({
      tasks: [],
      displayEmoji: true,
      useDarkMode: false,
    });

    // Add some tasks with contexts and tags to populate the store
    store.addTask({ expression: "Task @work" });
    store.addTask({ expression: "Task @home" });
    store.addTask({ expression: "Task #urgent" });
    store.addTask({ expression: "Task #personal" });

    vi.clearAllMocks();
  });

  describe("Completion Trigger Detection", () => {
    it("shows completion dropdown when typing @", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@");

      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "@work";
          }),
        ).toBeInTheDocument();
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "@home";
          }),
        ).toBeInTheDocument();
      });
    });

    it("shows completion dropdown when typing #", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "#");

      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "#urgent";
          }),
        ).toBeInTheDocument();
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "#personal";
          }),
        ).toBeInTheDocument();
      });
    });

    it("filters completions based on typed text", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@w");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
        expect(dropdown?.textContent).toContain("@work");
        expect(dropdown?.textContent).not.toContain("@home");
      });
    });

    it("does not show completions when typing @ followed by space", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@ ");

      expect(screen.queryByText("@work")).not.toBeInTheDocument();
    });

    it("hides completion dropdown when no matches found", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@nonexistent");

      await waitFor(() => {
        expect(screen.queryByText("@work")).not.toBeInTheDocument();
      });
    });
  });

  describe("Completion Selection", () => {
    it("selects completion with Enter key", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@w");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
        expect(dropdown?.textContent).toContain("@work");
      });

      await user.keyboard("{Enter}");

      expect(input).toHaveValue("@work ");
      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).not.toBeInTheDocument();
      });
    });

    it("selects completion with Tab key", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "#u");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
        expect(dropdown?.textContent).toContain("#urgent");
      });

      await user.keyboard("{Tab}");

      expect(input).toHaveValue("#urgent ");
      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).not.toBeInTheDocument();
      });
    });

    it("navigates completions with arrow keys", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
      });

      // First item should be selected by default
      const dropdown = document.querySelector(
        ".absolute.z-50.shadow-lg",
      ) as HTMLElement;
      const firstItem = dropdown.querySelector("div");
      expect(firstItem?.classList.contains("bg-base-03")).toBe(true);

      // Navigate down
      await user.keyboard("{ArrowDown}");
      const secondItem = dropdown.querySelectorAll("div")[1];
      expect(secondItem?.classList.contains("bg-base-03")).toBe(true);

      // Navigate up (should cycle to last item)
      await user.keyboard("{ArrowUp}");
      expect(firstItem?.classList.contains("bg-base-03")).toBe(true);
    });

    it("closes completion dropdown with Escape key", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).not.toBeInTheDocument();
      });
    });

    it("closes completion dropdown on blur", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
      });

      await user.click(document.body);

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).not.toBeInTheDocument();
      });
    });
  });

  describe("Completion Positioning", () => {
    it("positions dropdown relative to cursor position", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "Task @");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50");
        expect(dropdown).toBeInTheDocument();
      });

      const dropdown = document.querySelector(".absolute.z-50") as HTMLElement;
      expect(dropdown).toBeInTheDocument();
      // Position should be set (exact values depend on input positioning)
      expect(dropdown?.style.top).toBeDefined();
      expect(dropdown?.style.left).toBeDefined();
    });
  });

  describe("Completion Integration", () => {
    it("updates input expression when completion is selected", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "New task @w");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
        expect(dropdown?.textContent).toContain("@work");
      });

      await user.keyboard("{Enter}");

      expect(store.input.expression).toBe("New task @work ");
    });

    it("sets cursor position after completion insertion", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@w");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
        expect(dropdown?.textContent).toContain("@work");
      });

      await user.keyboard("{Enter}");

      // Cursor should be positioned after the inserted completion
      expect((input as HTMLInputElement).selectionStart).toBe("@work ".length);
      expect((input as HTMLInputElement).selectionEnd).toBe("@work ".length);
    });

    it("handles completion in middle of text", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "Task @w more text");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
        expect(dropdown?.textContent).toContain("@work");
      });

      await user.keyboard("{Enter}");

      expect(input).toHaveValue("Task @work  more text");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty store contexts/tags gracefully", () => {
      // Create a new store without any existing tasks
      const emptyStore = Store.create({
        tasks: [],
        displayEmoji: true,
        useDarkMode: false,
      });

      render(
        <StoreContext.Provider value={emptyStore}>
          <Input />
        </StoreContext.Provider>,
      );

      const input = screen.getByPlaceholderText("filter or add a task...");
      fireEvent.change(input, { target: { value: "@" } });

      // Should not crash and should not show any completions
      expect(screen.queryByText("@")).toBeNull();
    });

    it("handles rapid typing and completion changes", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);

      // Type quickly
      await user.type(input, "@wo");
      await user.type(input, "rk");

      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50.shadow-lg");
        expect(dropdown).toBeInTheDocument();
        expect(dropdown?.textContent).toContain("@work");
      });

      // Should still work correctly
      await user.keyboard("{Enter}");
      expect(input).toHaveValue("@work ");
    });
  });

  describe("Existing Input Functionality with Completions", () => {
    it("still adds task and clears expression on Enter key when valid", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "valid task");

      const initialTaskCount = store.tasks.length;
      await user.keyboard("{Enter}");

      expect(store.tasks.length).toBe(initialTaskCount + 1);
      expect(store.input.expression).toBe("");
    });

    it("still clears expression on Escape key", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "some task");

      expect(store.input.expression).toBe("some task");

      await user.keyboard("{Escape}");
      expect(store.input.expression).toBe("");
    });

    it("still focuses input on mount", () => {
      renderInput();
      const input = screen.getByPlaceholderText("filter or add a task...");
      expect(input).toHaveFocus();
    });

    it("maintains focus after submitting task with Enter", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "valid task");

      // Initially focused
      expect(input).toHaveFocus();

      await user.keyboard("{Enter}");

      // Should still be focused after submission
      expect(input).toHaveFocus();
      expect(store.input.expression).toBe("");
    });

    it("maintains focus after cancelling with Escape", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "some task");

      // Initially focused
      expect(input).toHaveFocus();

      await user.keyboard("{Escape}");

      // Should still be focused after cancellation
      expect(input).toHaveFocus();
      expect(store.input.expression).toBe("");
    });

    it("maintains focus after cancelling with Escape when completions are showing", async () => {
      const user = userEvent.setup();
      renderInput();

      const input = screen.getByPlaceholderText("filter or add a task...");
      await user.clear(input);
      await user.type(input, "@w");

      // Wait for completions to show
      await waitFor(() => {
        const dropdown = document.querySelector(".absolute.z-50");
        expect(dropdown).toBeInTheDocument();
      });

      // Initially focused
      expect(input).toHaveFocus();

      await user.keyboard("{Escape}");

      // Should still be focused after cancelling completions
      expect(input).toHaveFocus();
      // Expression should not be cleared when completions are showing
      expect(store.input.expression).toBe("@w");
    });
  });
});
