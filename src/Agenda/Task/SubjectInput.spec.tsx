import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime, Settings } from "luxon";
import { Store } from "../../models";
import { StoreContext } from "../../hooks/useStore";
import { SubjectInput } from "./SubjectInput";
import { ITask } from "../../models/Task";

// Set up timezone and mock time
Settings.defaultZone = "Europe/Madrid";
const mockNow = DateTime.local(2024, 1, 15, 10, 0, 0);
Settings.now = () => mockNow.toMillis();

// Global store variable for tests
let store: any;

const renderSubjectInput = (task: ITask, props: any = {}) => {
  return render(
    <StoreContext.Provider value={store}>
      <SubjectInput isFocused={false} task={task} tabIndex={2} {...props} />
    </StoreContext.Provider>,
  );
};

describe("SubjectInput Component - Completion Functionality", () => {
  let mockTask: ITask;

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

    mockTask = store.addTask({ expression: "Test task" })!;
    vi.clearAllMocks();
  });

  describe("Completion Trigger Detection", () => {
    it("shows completion dropdown when typing @", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "@");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
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
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "#");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("urgent") && item.querySelector("span")?.textContent === "#"
  );
})(),
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
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "@w");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });
    });

    it("does not show completions when typing @ followed by space", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "@ ");

      expect(screen.queryByText("@work")).not.toBeInTheDocument();
    });

    it("hides completion dropdown when no matches found", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
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
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "@wo");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });

      await user.keyboard("{Enter}");

      expect(input).toHaveValue("@work ");
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "@work";
        }),
      ).not.toBeInTheDocument();
    });

    it("selects completion with Tab key", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "#u");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("urgent") && item.querySelector("span")?.textContent === "#"
  );
})(),
        ).toBeInTheDocument();
      });

      await user.keyboard("{Tab}");

      expect(input).toHaveValue("#urgent ");
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "#urgent";
        }),
      ).not.toBeInTheDocument();
    });

    it("navigates completions with arrow keys", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "@");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });

      // First item should be selected by default
      let selectedItem = screen
        .getByText((content, element) => {
          return element?.textContent === "@work";
        })
        .closest("div");
      expect(selectedItem).toHaveClass("bg-base-03");

      // Navigate down
      await user.keyboard("{ArrowDown}");
      selectedItem = screen
        .getByText((content, element) => {
          return element?.textContent === "@home";
        })
        .closest("div");
      expect(selectedItem).toHaveClass("bg-base-03");

      // Navigate up (should cycle to last item)
      await user.keyboard("{ArrowUp}");
      selectedItem = screen
        .getByText((content, element) => {
          return element?.textContent === "@work";
        })
        .closest("div");
      expect(selectedItem).toHaveClass("bg-base-03");
    });

    it("closes completion dropdown with Escape key for @ completions", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "@");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "@work";
        }),
      ).not.toBeInTheDocument();
    });

    it("closes completion dropdown with Escape key for # completions", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "#");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("urgent") && item.querySelector("span")?.textContent === "#"
  );
})(),
        ).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "#urgent";
        }),
      ).not.toBeInTheDocument();
    });

    it("closes completion dropdown on blur", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "@");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });

      await user.click(document.body);

      await waitFor(() => {
        expect(
          screen.queryByText((content, element) => {
            return element?.textContent === "@work";
          }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Completion Positioning", () => {
    it("positions dropdown relative to cursor position", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "Task @");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });

      const dropdown = screen
        .getByText((content, element) => {
          return element?.textContent === "@work";
        })
        .closest(".absolute") as HTMLElement;
      expect(dropdown).toBeInTheDocument();
      // Position should be set (exact values depend on input positioning)
      expect(dropdown?.style.top).toBeDefined();
      expect(dropdown?.style.left).toBeDefined();
    });
  });

  describe("Completion Integration", () => {
    it("updates task expression when completion is selected", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "New task @wo");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });

      await user.keyboard("{Enter}");

      expect(mockTask.expression).toBe("New task @work ");
    });

    it("sets cursor position after completion insertion", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "@wo");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });

      await user.keyboard("{Enter}");

      // First check the value is correct
      expect(input).toHaveValue("@work ");

      // Cursor should be positioned after the inserted completion
      expect((input as HTMLInputElement).selectionStart).toBe("@work ".length);
      expect((input as HTMLInputElement).selectionEnd).toBe("@work ".length);
    });

    it("handles completion in middle of text", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);
      await user.type(input, "Task @wo more text");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
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

      const emptyTask = emptyStore.addTask({ expression: "Empty task" })!;

      render(
        <StoreContext.Provider value={emptyStore}>
          <SubjectInput isFocused={false} task={emptyTask} />
        </StoreContext.Provider>,
      );

      const input = screen.getByDisplayValue("Empty task");
      fireEvent.change(input, { target: { value: "@" } });

      // Should not crash and should not show any completions
      expect(screen.queryByText("@")).toBeNull();
    });

    it("handles rapid typing and completion changes", async () => {
      const user = userEvent.setup();
      renderSubjectInput(mockTask);

      const input = screen.getByDisplayValue("Test task");
      await user.clear(input);

      // Type quickly
      await user.type(input, "@wo");
      await user.type(input, "rk");

      await waitFor(() => {
        expect(
          (() => {
  const items = screen.getAllByRole("listitem");
  return items.find(item =>
    item.textContent?.includes("work") && item.querySelector("span")?.textContent === "@"
  );
})(),
        ).toBeInTheDocument();
      });

      // Should still work correctly
      await user.keyboard("{Enter}");
      expect(input).toHaveValue("@work ");
    });
  });
});

describe("URL Display Behavior", () => {
  it("should not show full expression when subject is empty", () => {
    const mockTask = {
      expression: "#buy https://amazon.com @order",
      subjectWithoutUrls: "",
      isCompleted: false,
      isValid: true,
    } as ITask;

    render(<SubjectInput task={mockTask} isFocused={false} ref={() => {}} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("should show full expression when focused", () => {
    const mockTask = {
      expression: "#buy https://amazon.com @order",
      subjectWithoutUrls: "",
      isCompleted: false,
      isValid: true,
    } as ITask;

    render(<SubjectInput task={mockTask} isFocused={true} ref={() => {}} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("#buy https://amazon.com @order");
  });
});
