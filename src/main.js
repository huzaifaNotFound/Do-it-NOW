import "./style.css";
import {
  addTodo as addTodoToStore,
  editTodo as editTodoInStore,
  getSelectedDay,
  getTodos,
  iso,
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
const statusLine = document.querySelector("#status");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// past days are read-only
const isPastDay = () => getSelectedDay() < iso(new Date());

function updateComposer() {
  const locked = isPastDay();

  input.disabled = locked;
  btn.disabled = locked;
  input.placeholder = locked ? "Past days are read-only" : "Write a task...";
  todoContainer.classList.toggle("is-readonly", locked);
}

//enter handler
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    btn.click();
  }
});

//cards enter and click handlers
todoContainer.addEventListener("click", (e) => {
  if (e.target.closest(".empty-action")) {
    input.focus();
    return;
  }

  const todo = e.target.closest(".todo-row");

  if (!todo || !todoContainer.contains(todo)) return;
  if (isPastDay()) return;

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
  if (isPastDay()) return;

  if (e.target.closest(".todo-input, .todo-actions")) return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleTodo(todo);
  }
});

function toggleTodo(todo) {
  const wasCompleted = todo.classList.contains("is-completed");
  const completed = todo.classList.toggle("is-completed");

  todo.setAttribute("aria-checked", String(completed));

  toggleTodoInStore(getSelectedDay(), todo.dataset.id);

  if (!completed) {
    resetCelebration();
    return;
  }
  if (!wasCompleted && isAllDone()) celebrate();
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
      editTodoInStore(getSelectedDay(), row.dataset.id, next);
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

  if (!todoContainer.querySelector(".todo-row")) {
    renderTodos();
    resetCelebration();
  }
}

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

      <div class="todo-actions ml-auto mr-3 flex items-center gap-2 shrink-0 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto">

        <button
          type="button"
          class="todo-edit text-muted hover:text-ink hover:scale-110 transition-all duration-200 cursor-pointer p-1.5 active:scale-90 active:text-ink -m-0.5"
          aria-label="Edit todo"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
        </button>

        <button
          type="button"
          class="todo-delete text-muted hover:text-danger hover:scale-110 transition-all duration-200 cursor-pointer p-1.5 -m-0.5 active:scale-90 active:text-danger"
          aria-label="Delete todo"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"></path></svg>
        </button>

      </div>

    </div>
  `;
}

// empty state template
function emptyTemplate() {
  if (isPastDay()) {
    return `
      <div class="empty-state animate-enter flex w-full flex-col items-center justify-center px-6 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-chip/70 text-muted">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v4l2.5 2"></path></svg>
        </div>
        <p class="mt-4 font-display text-[17px] font-bold text-ink">A quiet day</p>
        <p class="mt-1 max-w-64 font-sans text-[13px] leading-relaxed text-muted">No tasks were logged for this day.</p>
      </div>
    `;
  }

  return `
    <div class="empty-state animate-enter flex w-full flex-col items-center justify-center px-6 text-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-chip/70 text-accent">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
      </div>
      <p class="mt-4 font-display text-[17px] font-bold text-ink">Nothing planned yet</p>
      <p class="mt-1 max-w-64 font-sans text-[13px] leading-relaxed text-muted">A clear day is a good place to start. Add one small task below.</p>
      <button
        type="button"
        class="empty-action mt-4 rounded-lg bg-chip px-3.5 py-2 font-sans text-[13px] font-semibold text-ink cursor-pointer transition-all duration-200 ease-bounce hover:bg-accent hover:text-card active:scale-95 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Add your first task
      </button>
    </div>
  `;
}

// escape task text
function escapeHtml(text) {
  const node = document.createElement("div");
  node.textContent = text;
  return node.innerHTML;
}

// render selected day
function renderTodos() {
  const todos = getTodos(getSelectedDay());

  todoContainer.innerHTML =
    todos.length === 0 ? emptyTemplate() : todos.map(todoTemplate).join("");
}

// todo add handler
btn.addEventListener("click", () => {
  if (isPastDay()) return;

  input.focus();

  const todo = input.value.trim();

  if (!todo) return;

  const capitalizedTodo = todo.charAt(0).toUpperCase() + todo.slice(1);

  const added = addTodoToStore(getSelectedDay(), capitalizedTodo);

  if (!added) return;

  todoContainer.querySelector(".empty-state")?.remove();

  todoContainer.insertAdjacentHTML("beforeend", todoTemplate(added));

  todoContainer.scrollTo({
    top: todoContainer.scrollHeight,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });

  input.value = "";

  resetCelebration();
  progressUpdate();
});

const PROGRESS_MESSAGES = [
  { min: 100, text: "All done. Enjoy the peace." },
  { min: 75, text: "Almost there, one last push." },
  { min: 50, text: "Halfway there. Keep going." },
  { min: 25, text: "Good start. Keep it rolling." },
  { min: 1, text: "First one down. Momentum!" },
];

function getProgressUpdate(percentage, total) {
  if (total === 0) return "";
  return PROGRESS_MESSAGES.find(({ min }) => percentage >= min)?.text ?? "";
}

function progressUpdate() {
  const totalTodos = todoContainer.querySelectorAll(".todo-row").length;
  const completedTodos = todoContainer.querySelectorAll(".todo-row.is-completed").length;

  const percentage = totalTodos === 0 ? 0 : (completedTodos / totalTodos) * 100;

  progressBar.style.width = `${percentage}%`;
  completedTodoCountSpan.textContent = completedTodos;
  totalTodoCountSpan.textContent = totalTodos;
  statusLine.textContent = getProgressUpdate(percentage, totalTodos);
}

const SPARK_COUNT = 16;

function isAllDone() {
  const rows = todoContainer.querySelectorAll(".todo-row");
  return (
    rows.length > 0 &&
    rows.length === todoContainer.querySelectorAll(".todo-row.is-completed").length
  );
}

function resetCelebration() {
  progressBar.classList.remove("is-complete");
  statusLine.classList.remove("is-visible");

  document.querySelectorAll(".spark").forEach((spark) => spark.remove());
}

function celebrate() {
  progressBar.classList.add("is-complete");
  statusLine.classList.add("is-visible");

  if (reduceMotion.matches) return;

  const rect = progressBar.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const colors = [
    "var(--color-accent)",
    "var(--color-ok)",
    "var(--color-btn)",
  ];

  for (let i = 0; i < SPARK_COUNT; i++) {
    const angle = (i / SPARK_COUNT) * Math.PI * 2;
    const distance = 40 + Math.random() * 50;

    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${cx}px`;
    spark.style.top = `${cy}px`;
    spark.style.backgroundColor = colors[i % colors.length];
    spark.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);

    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove(), {
      once: true,
    });
  }
}

//store sync
subscribe((type) => {
  if (type === "selected" || type === "prune") {
    updateComposer();
    renderTodos();
    resetCelebration();
  }
  progressUpdate();
});

updateComposer();
renderTodos();
progressUpdate();