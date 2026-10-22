
"use strict";

// =============================================
// TASKFLOW - PRODUCTIVITY TRACKER
// Datheon Internship | Task 2
// =============================================

// 1. DOM ELEMENTS
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskCategory = document.getElementById("taskCategory");
const taskDueDate = document.getElementById("taskDueDate");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const filterButtons = document.querySelectorAll(".filter-button");

// Statistics
const totalTasksElement = document.getElementById("totalTasks");
const activeTasksElement = document.getElementById("activeTasks");
const completedTasksElement = document.getElementById("completedTasks");
const progressPercentElement = document.getElementById("progressPercent");

// 2. APPLICATION STATE
const STORAGE_KEY = "taskflow_tasks";

let tasks = loadTasks();
let currentFilter = "all";
let searchQuery = "";

// 3. LOAD TASKS FROM LOCAL STORAGE
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        // Validate saved entries before using them.
        return parsedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            ["Work", "Personal", "Study"].includes(task.category) &&
            typeof task.completed === "boolean"
        ).map(task => ({
            id: task.id,
            title: task.title,
            category: task.category,
            dueDate: typeof task.dueDate === "string"
                ? task.dueDate
                : "",
            completed: task.completed,
            createdAt: typeof task.createdAt === "string"
                ? task.createdAt
                : new Date().toISOString()
        }));
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

// 4. SAVE TASKS TO LOCAL STORAGE
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);

        alert(
            "Your changes could not be saved. " +
            "Please check your browser storage settings."
        );

        return false;
    }
}

// 5. DISPLAY CURRENT DATE
function displayDate() {
    const currentDateElement = document.getElementById("currentDate");
    const currentYearElement = document.getElementById("currentYear");

    currentDateElement.textContent =
        new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });

    currentYearElement.textContent = new Date().getFullYear();
}

// 6. CREATE A NEW TASK
function addTask(event) {
    event.preventDefault();

    const title = taskInput.value.trim();
    const category = taskCategory.value;
    const dueDate = taskDueDate.value;

    if (!title) {
        alert("Please enter a task title.");
        taskInput.focus();
        return;
    }

    const newTask = {
        id: crypto.randomUUID(),
        title: title,
        category: category,
        dueDate: dueDate,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);

    if (!saveTasks()) {
        tasks.shift();
        return;
    }

    taskForm.reset();
    taskInput.focus();

    renderTasks();
}

// 7. FORMAT DUE DATE
function formatDueDate(dateString) {
    if (!dateString) {
        return "No due date";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

// 8. CREATE A TASK ELEMENT
function createTaskElement(task) {
    const item = document.createElement("li");
    item.className = "task-item";

    if (task.completed) {
        item.classList.add("completed");
    }

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
        "aria-label",
        `Mark ${task.title} as ${task.completed ? "active" : "completed"}`
    );

    checkbox.addEventListener("change", () => {
        toggleTask(task.id);
    });

    // Task content
    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const category = document.createElement("span");
    category.className = "category-badge";
    category.dataset.category = task.category;
    category.textContent = task.category;

    const dueDate = document.createElement("span");
    dueDate.textContent = `Due: ${formatDueDate(task.dueDate)}`;

    meta.append(category, dueDate);
    content.append(title, meta);

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "task-action";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);

    editButton.addEventListener("click", () => {
        editTask(task.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "task-action delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

    deleteButton.addEventListener("click", () => {
        deleteTask(task.id);
    });

    actions.append(editButton, deleteButton);
    item.append(checkbox, content, actions);

    return item;
}

// 9. FILTER AND SEARCH TASKS
function getFilteredTasks() {
    return tasks.filter(task => {
        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "active" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        const matchesSearch = task.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });
}

// 10. RENDER TASKS ON THE PAGE
function renderTasks() {
    const filteredTasks = getFilteredTasks();

    taskList.replaceChildren();

    filteredTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });

    // Show the empty state only when no tasks match.
    emptyState.classList.toggle("hidden", filteredTasks.length > 0);

    const emptyTitle = emptyState.querySelector("h3");
    const emptyMessage = emptyState.querySelector("p");

    if (tasks.length === 0) {
        emptyTitle.textContent = "No tasks yet";
        emptyMessage.textContent =
            "Add your first task to get started!";
    } else if (filteredTasks.length === 0) {
        emptyTitle.textContent = "No matching tasks";
        emptyMessage.textContent =
            "Try another filter or search term.";
    }

    updateStatistics();
}

// 11. UPDATE TASK STATISTICS
function updateStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;

    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasksElement.textContent = total;
    activeTasksElement.textContent = active;
    completedTasksElement.textContent = completed;
    progressPercentElement.textContent = `${progress}%`;
}

// 12. MARK TASK AS COMPLETED OR ACTIVE
function toggleTask(taskId) {
    const task = tasks.find(task => task.id === taskId);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    if (!saveTasks()) {
        task.completed = !task.completed;
        return;
    }

    renderTasks();
}

// 13. EDIT A TASK
function editTask(taskId) {
    const task = tasks.find(task => task.id === taskId);

    if (!task) {
        return;
    }

    const updatedTitle = prompt("Edit task title:", task.title);

    // Cancel pressed.
    if (updatedTitle === null) {
        return;
    }

    const cleanTitle = updatedTitle.trim();

    if (!cleanTitle) {
        alert("Task title cannot be empty.");
        return;
    }

    const previousTitle = task.title;
    task.title = cleanTitle;

    if (!saveTasks()) {
        task.title = previousTitle;
        return;
    }

    renderTasks();
}

// 14. DELETE A TASK
function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${tasks[taskIndex].title}"?`
    );

    if (!confirmed) {
        return;
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];

    if (!saveTasks()) {
        tasks.splice(taskIndex, 0, deletedTask);
        return;
    }

    renderTasks();
}

// 15. CHANGE TASK FILTER
function handleFilterChange(event) {
    const button = event.target.closest(".filter-button");

    if (!button) {
        return;
    }

    currentFilter = button.dataset.filter;

    filterButtons.forEach(filterButton => {
        const isActive = filterButton === button;

        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
    });

    renderTasks();
}

// 16. SEARCH TASKS
function handleSearch(event) {
    searchQuery = event.target.value.trim();
    renderTasks();
}

// 17. EVENT LISTENERS
taskForm.addEventListener("submit", addTask);

document.querySelector(".filter-buttons").addEventListener(
    "click",
    handleFilterChange
);

searchInput.addEventListener("input", handleSearch);

// 18. INITIALIZE THE APPLICATION
function initApp() {
    displayDate();
    renderTasks();
}

initApp();
