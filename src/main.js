import "./style.css";
import {
  addTodo as addTodoToStore,
  editTodo as editTodoInStore,
  getSelectedDay,
  getTodos,
  removeTodo as removeTodoInStore,
  subscribe,
  toggleTodo as toggleTodoInStore,
} from "./store.js";

const todoContainer = document.querySelector("#todo-container");
const btn = document.querySelector("#button");
const input = document.querySelector("#input");
const progressBar = document.querySelector("#progress");
const totalTodoCountSpan = document.querySelector("#total-todo-count");
const completedTodoCountSpan = document.querySelector("#completed-todo-count");

// enter handler
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    btn.click();
  }
});

// cards enter and click handlers
todoContainer.addEventListener("click", (e) => {
  const todo = e.target.closest(".todo-row");

  if (!todo || !todoContainer.contains(todo)) return;

  if (e.target.closest(".todo-input, .todo-actions")) {
    const editButton = e.target.closest(".todo-edit");
    const deleteButton = e.target.closest(".todo-delete");

    if (editButton) startEditing(todo);
    else if (deleteButton) deleteTodo(todo);

    return;
  }

  toggleTodo(todo);
});

todoContainer.addEventListener("keydown", (e) => {
  const todo = e.target.closest(".todo-row");

  if (!todo || !todoContainer.contains(todo)) return;

  if (e.target.closest(".todo-input, .todo-actions")) return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleTodo(todo);
  }
});

function toggleTodo(todo) {
  const completed = todo.classList.toggle("is-completed");

  todo.setAttribute("aria-checked", String(completed));

  toggleTodoInStore(getSelectedDay(), todo.dataset.id);
}

// inline editing
function startEditing(row) {
  if (row.querySelector(".todo-input")) return;

  const textEl = row.querySelector(".task-text");
  const original = textEl.textContent;

  const input = document.createElement("input");
  input.type = "text";
  input.value = original;
  input.className =
    "todo-input flex-1 min-w-0 -ml-1 bg-transparent font-sans text-[15px] font-normal text-ink outline-none border-b border-accent";
  input.setAttribute("aria-label", "Edit todo");

  textEl.replaceWith(input);
  input.focus();
  input.select();

  let done = false;

  const finish = (save) => {
    if (done) return;
    done = true;

    const value = input.value.trim();
    const next = save && value ? value : original;

    const text = document.createElement("p");
    text.className = "task-text font-sans -ml-1 text-[15px] font-normal text-ink";
    text.textContent = next;

    input.replaceWith(text);

    if (save && value && value !== original) {
      editTodoInStore(getSelectedDay(), row.dataset.id, next)
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  });

  input.addEventListener("blur", () => finish(true));
}

// delete todo
function deleteTodo(row) {
  row.remove();

  removeTodoInStore(getSelectedDay(), row.dataset.id);
}

// todo row template
function todoTemplate(todo) {
  const completedClass = todo.completed ? " is-completed" : "";

  return `
    <div
      data-id="${todo.id}"
      class="todo-row group animate-enter w-full h-13 rounded-xl bg-card flex items-center mb-2.5 cursor-pointer${completedClass}"
      role="checkbox"
      aria-checked="${todo.completed}"
      tabindex="0"
    >

      <div class="relative w-6 h-6 border-muted rounded-md border-[1.5px] mx-4 shrink-0 checkbox">

        <svg
          class="absolute w-8 h-8 -top-2 -left-1 text-ok overflow-visible"
          viewBox="0 0 32 32"
          fill="none"
        >

          <path
            class="check-path"
            d="M4 16L12 24L28 5"
            pathLength="100"
            stroke="currentColor"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

        </svg>
 
      </div>

      <p class="task-text font-sans -ml-1 text-[15px] font-normal text-ink">${escapeHtml(todo.text)}</p>

      <div class="todo-actions ml-auto mr-3 flex items-center gap-1 shrink-0 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto">

        <button
          type="button"
          class="todo-edit text-muted hover:text-ink hover:scale-110 transition-all duration-200 cursor-pointer p-1"
          aria-label="Edit todo"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
        </button>

        <button
          type="button"
          class="todo-delete text-muted hover:text-danger hover:scale-110 transition-all duration-200 cursor-pointer p-1"
          aria-label="Delete todo"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"></path></svg>
        </button>

      </div>

    </div>
  `;
}

// escape task text
function escapeHtml(text) {
  const node = document.createElement("div");
  node.textContent = text;
  return node.innerHTML;
}

// render selected dayy
function renderTodos() {
  todoContainer.innerHTML = getTodos(getSelectedDay()).map(todoTemplate).join("");
}

// todo add handler
btn.addEventListener("click", () => {
  input.focus();

  const todo = input.value.trim();

  if (!todo) return;

  const capitalizedTodo = todo.charAt(0).toUpperCase() + todo.slice(1);

  const added = addTodoToStore(getSelectedDay(), capitalizedTodo);

  if (!added) return;

  todoContainer.insertAdjacentHTML("beforeend", todoTemplate(added));

  input.value = "";

  progressUpdate();
});

function progressUpdate() {
  const totalTodos = todoContainer.querySelectorAll(".todo-row").length;
  const completedTodos = todoContainer.querySelectorAll(".todo-row.is-completed").length;

  const percentage = totalTodos === 0 ? 0 : (completedTodos / totalTodos) * 100;

  progressBar.style.width = `${percentage}%`;
  completedTodoCountSpan.textContent = completedTodos;
  totalTodoCountSpan.textContent = totalTodos;
}

// store sync
subscribe((type) => {
  if (type === "selected" || type === "prune") renderTodos();
  progressUpdate();
});

renderTodos();
progressUpdate();
