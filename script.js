const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const totalTodosElement = document.getElementById('totalTodos');
const completedTodosElement = document.getElementById('completedTodos');
const pendingTodosElement = document.getElementById('pendingTodos');
const clearAllBtn = document.getElementById('clearAllBtn');
const todoContainer = document.getElementById('todoContainer');
const noTodosMessage = document.getElementById('noTodosMessage');

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let totalTodos = 0;
let completedTodos = 0;

function init() {
    updateStats();
    renderTodos();

    todoInput.addEventListener('input', toggleAddButton);
    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    clearAllBtn.addEventListener('click', clearAllTodos);
    loadTodosFromStorage();
    toggleAddButton();
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

function toggleAddButton() {
    addBtn.disabled = todoInput.value.trim() === '';
}

function addTodo() {
    const todoText = todoInput.value.trim();

    if (todoText === '') {
        showNotification('Please enter a task before adding!', 'error');
        return;
    }

    const todo = {
        id: Date.now(),
        text: todoText,
        completed: false,
        createdAt: new Date().toISOString()
    };

    todos.push(todo);
    saveTodosToStorage();
    todoInput.value = '';
    toggleAddButton();
    updateStats();
    renderTodos();
    showNotification('Task added successfully!', 'info');
}

function renderTodos() {
    todoList.innerHTML = '';

    if (todos.length === 0) {
        todoContainer.classList.add('no-todos');
        return;
    }

    todoContainer.classList.remove('no-todos');

    todos.forEach(todo => {
        const todoItem = document.createElement('li');
        todoItem.className = 'todo-item';
        todoItem.id = `todo-${todo.id}`;

        if (todo.completed) {
            todoItem.classList.add('completed');
        }

        todoItem.innerHTML = `
            <span class="todo-text">${todo.text}</span>
            <div class="todo-actions">
                <button class="action-btn complete-btn" data-id="${todo.id}" title="${todo.completed ? 'Mark as Incomplete' : 'Mark as Complete'}">
                    <i class="fas ${todo.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
                </button>
                <button class="action-btn edit-btn" data-id="${todo.id}" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${todo.id}" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        todoList.appendChild(todoItem);
    });

    addTodoEventListeners();
}

function addTodoEventListeners() {
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            toggleCompleteTodo(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            deleteTodo(id);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            editTodo(id);
        });
    });
}

function toggleCompleteTodo(id) {
    const todoIndex = todos.findIndex(todo => todo.id === id);

    if (todoIndex !== -1) {
        todos[todoIndex].completed = !todos[todoIndex].completed;
        saveTodosToStorage();
        updateStats();
        renderTodos();

        const status = todos[todoIndex].completed ? 'completed' : 'marked as incomplete';
        showNotification(`Task ${status}!`, 'info');
    }
}

function deleteTodo(id) {
    const todoIndex = todos.findIndex(todo => todo.id === id);

    if (todoIndex !== -1) {
        const taskText = todos[todoIndex].text;
        const todoItem = document.getElementById(`todo-${id}`);

        if (todoItem) {
            todoItem.classList.add('fade-out');

            setTimeout(() => {
                todos.splice(todoIndex, 1);
                saveTodosToStorage();
                updateStats();
                renderTodos();

                showNotification(`Task deleted: "${taskText.substring(0, 30)}${taskText.length > 30 ? '...' : ''}"`, 'warning');
            }, 300);
        }
    }
}

function editTodo(id) {
    const todoIndex = todos.findIndex(todo => todo.id === id);

    if (todoIndex === -1) return;

    const todoItem = document.getElementById(`todo-${id}`);
    const todoText = todos[todoIndex].text;

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = todoText;

    const todoTextElement = todoItem.querySelector('.todo-text');
    todoTextElement.replaceWith(editInput);

    editInput.focus();
    editInput.select();

    const editBtn = todoItem.querySelector('.edit-btn');
    editBtn.innerHTML = '<i class="fas fa-save"></i>';
    editBtn.title = 'Save Changes';

    const newEditBtn = editBtn.cloneNode(true);
    editBtn.replaceWith(newEditBtn);

    newEditBtn.addEventListener('click', function () {
        saveTodoEdit(id, editInput.value);
    });

    editInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            saveTodoEdit(id, editInput.value);
        }
    });

    editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            renderTodos();
        }
    });
}

function saveTodoEdit(id, newText) {
    const todoIndex = todos.findIndex(todo => todo.id === id);

    if (todoIndex !== -1 && newText.trim() !== '') {
        todos[todoIndex].text = newText.trim();
        saveTodosToStorage();
        renderTodos();
        showNotification('Task updated successfully!', 'info');
    } else if (newText.trim() === '') {
        showNotification('Task cannot be empty!', 'error');
        editTodo(id);
    }
}

function clearAllTodos() {
    if (todos.length === 0) {
        showNotification('No tasks to clear!', 'info');
        return;
    }

    const todoItems = document.querySelectorAll('.todo-item');
    todoItems.forEach(item => {
        item.classList.add('fade-out');
    });

    setTimeout(() => {
        todos = [];
        saveTodosToStorage();
        updateStats();
        renderTodos();
        showNotification('All tasks cleared!', 'warning');
    }, 300);
}

function updateStats() {
    totalTodos = todos.length;
    completedTodos = todos.filter(todo => todo.completed).length;
    const pendingTodos = totalTodos - completedTodos;

    totalTodosElement.textContent = totalTodos;
    completedTodosElement.textContent = completedTodos;
    pendingTodosElement.textContent = pendingTodos;
}

function saveTodosToStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodosFromStorage() {
    const storedTodos = JSON.parse(localStorage.getItem('todos'));

    if (storedTodos && storedTodos.length > 0) {
        todos = storedTodos;
        updateStats();
        renderTodos();
    }
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
