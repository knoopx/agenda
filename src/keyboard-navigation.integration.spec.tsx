import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoreContext } from "./hooks/useStore";
import Store from "./models/Store";
import App from "./App";

function setupTestStore() {
  const store = Store.create({ tasks: [] });
  store.addTask({ expression: "Task 1" });
  store.addTask({ expression: "Task 2" });
  store.addTask({ expression: "Task 3" });
  return store;
}

describe("Keyboard navigation and focus cycling", () => {
  it("cycles focus between main input and tasks with ArrowUp/ArrowDown", async () => {
    const store = setupTestStore();
    const user = userEvent.setup();
    render(
      <StoreContext.Provider value={store}>
        <App />
      </StoreContext.Provider>,
    );

    // Query main input by placeholder
    const mainInput = screen.getByPlaceholderText("filter or add a task...");
    // Query all task inputs by role and tabIndex > 1
    const taskInputs = screen
      .getAllByRole("textbox")
      .filter((el) => el !== mainInput && el.tabIndex > 1);

    // Focus main input
    mainInput.focus();
    expect(mainInput).toHaveFocus();

    // ArrowDown: should focus first task
    await user.keyboard("{ArrowDown}");
    expect(taskInputs[0]).toHaveFocus();

    // ArrowDown: should focus second task
    await user.keyboard("{ArrowDown}");
    expect(taskInputs[1]).toHaveFocus();

    // ArrowDown: should focus third task
    await user.keyboard("{ArrowDown}");
    expect(taskInputs[2]).toHaveFocus();

    // ArrowDown: should cycle back to main input
    await user.keyboard("{ArrowDown}");
    expect(mainInput).toHaveFocus();

    // ArrowUp: should focus last task
    await user.keyboard("{ArrowUp}");
    expect(taskInputs[2]).toHaveFocus();

    // ArrowUp: should focus second task
    await user.keyboard("{ArrowUp}");
    expect(taskInputs[1]).toHaveFocus();

    // ArrowUp: should focus first task
    await user.keyboard("{ArrowUp}");
    expect(taskInputs[0]).toHaveFocus();

    // ArrowUp: should cycle back to main input
    await user.keyboard("{ArrowUp}");
    expect(mainInput).toHaveFocus();
  });
});
