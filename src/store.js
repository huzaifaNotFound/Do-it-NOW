// day-keyed storage
const STORAGE_KEY = "todos-by-day";

const pad = (n) => String(n).padStart(2, "0");

export const iso = (date) =>
  date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())

const todayKey = () => iso(new Date());

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

  // prune old days
  const today = todayKey();
  let changed = false;

  Object.keys(data).forEach((day) => {
    if (!Array.isArray(data[day]) || day < today) {
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
    //storage unavailabl
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

export function hasTodos(day) {
  return getTodos(day).length > 0;
}

export function addTodo(day, text) {
  if (day < todayKey()) return null;

  //per-day todos
  const todo = { id: crypto.randomUUID(), text, completed: false };

  todosByDay[day] = [...getTodos(day), todo];

  saveTodos();
  emit("todos");

  return todo;
}

export function toggleTodo(day, id) {
  todosByDay[day] = getTodos(day).map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );

  saveTodos();
  emit("todos");
}

//edit todoo
export function editTodo(day, id, text) {
  todosByDay[day] = getTodos(day).map((todo) =>
    todo.id === id ? { ...todo, text } : todo,
  );

  saveTodos();
  emit("todos");
}

//delete todo
export function removeTodo(day, id) {
  todosByDay[day] = getTodos(day).filter((todo) => todo.id !== id);

  saveTodos();
  emit("todos");
}

export function pruneOldTodos() {
  const today = todayKey();
  let changed = false;

  Object.keys(todosByDay).forEach((day) => {
    if (day < today) {
      delete todosByDay[day];
      changed = true;
    }
  });

  if (changed) {
    saveTodos();
    emit("prune");
  }
}
