// day-keyed storage
const STORAGE_KEY = "todos-by-day";

export const HISTORY_DAYS = 7;

const pad = (n) => String(n).padStart(2, "0");

export const iso = (date) =>
  date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());

const todayKey = () => iso(new Date());

const cutoffKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - HISTORY_DAYS);
  return iso(d);
};

const isPast = (day) => day < todayKey();

const listeners = new Set();

let todosByDay = loadTodos();
let selectedDay = todayKey();

function loadTodos() {
  let data = {};

  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    data = {};
  }

  if (typeof data !== "object" || Array.isArray(data)) data = {};

  const cutoff = cutoffKey();
  let changed = false;

  Object.keys(data).forEach((day) => {
    if (!Array.isArray(data[day]) || day < cutoff) {
      delete data[day];
      changed = true;
    }
  });

  if (changed) saveTodos(data);

  return data;
}

function saveTodos(data = todosByDay) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

function emit(type) {
  listeners.forEach((listener) => listener(type));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSelectedDay() {
  return selectedDay;
}

export function setSelectedDay(day) {
  if (day === selectedDay) return;

  selectedDay = day;
  emit("selected");
}

export function getTodos(day) {
  return todosByDay[day] ?? [];
}

export function addTodo(day, text) {
  if (isPast(day)) return null;

  // per-day todos
  const todo = { id: crypto.randomUUID(), text, completed: false };

  todosByDay[day] = [...getTodos(day), todo];

  saveTodos();
  emit("todos");

  return todo;
}

export function toggleTodo(day, id) {
  if (isPast(day)) return;

  todosByDay[day] = getTodos(day).map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );

  saveTodos();
  emit("todos");
}

// edit todo
export function editTodo(day, id, text) {
  if (isPast(day)) return;

  todosByDay[day] = getTodos(day).map((todo) =>
    todo.id === id ? { ...todo, text } : todo,
  );

  saveTodos();
  emit("todos");
}

//delete todo
export function removeTodo(day, id) {
  if (isPast(day)) return;

  todosByDay[day] = getTodos(day).filter((todo) => todo.id !== id);

  saveTodos();
  emit("todos");
}

export function pruneOldTodos() {
  const cutoff = cutoffKey();
  let changed = false;

  Object.keys(todosByDay).forEach((day) => {
    if (day < cutoff) {
      delete todosByDay[day];
      changed = true;
    }
  });

  if (changed) {
    saveTodos();
    emit("prune");
  }
}

// sync across tabs
window.addEventListener("storage", (e) => {
  if (e.key !== STORAGE_KEY && e.key !== null) return;

  todosByDay = loadTodos();
  emit("sync");
});