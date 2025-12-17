// ==================== DOM 요소 선택 ====================
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const timeInput = document.getElementById('timeInput');
const todoList = document.getElementById('todoList');
const progressCount = document.getElementById('progressCount');
const progressBar = document.getElementById('progressBar');
const themeToggle = document.getElementById('themeToggle');
const currentDate = document.getElementById('currentDate');
const clearCompleted = document.getElementById('clearCompleted');
const exportExcel = document.getElementById('exportExcel');
const tabBtns = document.querySelectorAll('.tab-btn');
const todoViewBtn = document.getElementById('todoViewBtn');
const statsViewBtn = document.getElementById('statsViewBtn');
const weeklyStats = document.getElementById('weeklyStats');
const todoListElement = document.getElementById('todoList');
const copyBtn = document.getElementById('copyBtn');
const pasteBtn = document.getElementById('pasteBtn');
const sortByTime = document.getElementById('sortByTime');
const prevWeek = document.getElementById('prevWeek');
const nextWeek = document.getElementById('nextWeek');
const currentWeekDisplay = document.getElementById('currentWeek');
const saveWeek = document.getElementById('saveWeek');
const saveMonth = document.getElementById('saveMonth');
const saveYear = document.getElementById('saveYear');
const loadData = document.getElementById('loadData');

// ==================== 상태 관리 ====================
let todos = [];
let currentCategory = 'monday';
let copiedTodos = [];
let isSortedByTime = false;
let currentWeekStart = null;  // 현재 주의 시작일 (월요일)
let selectedDate = null;      // 현재 선택된 날짜

// ==================== 초기화 ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeWeek();
    loadTodos();
    loadTheme();
    displayDate();
    setCurrentDayTab();
    updateDateDisplay();
    renderTodos();
    updateWeeklyStats();
});

// ==================== 날짜 유틸리티 함수 ====================
function initializeWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일로 조정
    currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + diff);
    currentWeekStart.setHours(0, 0, 0, 0);
}

function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
    }
    return dates;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

function updateDateDisplay() {
    const weekDates = getWeekDates(currentWeekStart);

    // 주간 범위 표시 업데이트
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();

    currentWeekDisplay.textContent = `${startYear}년 ${startMonth}월 ${startDay}일 - ${endMonth}월 ${endDay}일`;

    // 각 요일 탭의 날짜 업데이트
    tabBtns.forEach((btn, index) => {
        const dateSpan = btn.querySelector('.tab-date');
        if (dateSpan) {
            dateSpan.textContent = formatDateDisplay(weekDates[index]);

            // 오늘 날짜 강조
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const btnDate = new Date(weekDates[index]);
            btnDate.setHours(0, 0, 0, 0);

            if (btnDate.getTime() === today.getTime()) {
                btn.classList.add('today');
            } else {
                btn.classList.remove('today');
            }
        }
    });

    // 현재 선택된 날짜 업데이트
    const dayIndex = parseInt(document.querySelector('.tab-btn.active')?.getAttribute('data-day') || '0');
    selectedDate = formatDate(weekDates[dayIndex]);
}

// ==================== 데이터 불러오기 ====================
loadData.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loadedTodos = JSON.parse(event.target.result);
                if (!Array.isArray(loadedTodos)) {
                    throw new Error('올바른 할 일 목록 파일이 아닙니다.');
                }

                // 날짜 필드 마이그레이션
                const migratedTodos = loadedTodos.map(todo => {
                    if (!todo.date) {
                        // 날짜가 없는 경우 현재 주의 해당 요일로 설정
                        const dayMap = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
                        const dayIndex = dayMap[todo.category] || 0;
                        const weekDates = getWeekDates(currentWeekStart);
                        todo.date = formatDate(weekDates[dayIndex]);
                    }
                    return todo;
                });

                if (todos.length > 0) {
                    if (confirm('기존 할 일 목록이 있습니다. 기존 데이터를 유지하고 새 데이터를 추가하시겠습니까?\n\n확인: 추가\n취소: 기존 데이터 삭제 후 불러오기')) {
                        todos = [...todos, ...migratedTodos];
                    } else {
                        todos = migratedTodos;
                    }
                } else {
                    todos = migratedTodos;
                }

                saveTodos();
                renderTodos();
                updateWeeklyStats();

                alert(`✅ 할 일을 불러왔습니다!\n\n총 ${loadedTodos.length}개`);
            } catch (error) {
                alert('파일을 불러오는 중 오류가 발생했습니다: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
});
// ==================== 현재 요일 탭 자동 선택 ====================
function setCurrentDayTab() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayMap = {
        0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
        4: 'thursday', 5: 'friday', 6: 'saturday'
    };
    currentCategory = dayMap[dayOfWeek];
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === currentCategory) {
            btn.classList.add('active');
        }
    });
}

// ==================== 날짜 표시 ====================
function displayDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    currentDate.textContent = now.toLocaleDateString('ko-KR', options);
}

// ==================== Todo 추가 ====================
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    const time = timeInput.value;
    if (text === '') return;

    const todo = {
        id: Date.now(),
        text: text,
        time: time || null,
        category: currentCategory,
        date: selectedDate,  // 현재 선택된 날짜 추가
        completed: false,
        createdAt: new Date().toISOString()
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    updateWeeklyStats();
    todoInput.value = '';
    timeInput.value = '';
    todoInput.focus();
});

// ==================== Todo 렌더링 ====================
function renderTodos() {
    todoList.innerHTML = '';
    // 요일 + 날짜로 필터링
    let filteredTodos = todos.filter(t => t.category === currentCategory && t.date === selectedDate);

    // 시간순 정렬이 활성화된 경우
    if (isSortedByTime) {
        filteredTodos = filteredTodos.sort((a, b) => {
            // 시간이 없는 항목은 맨 뒤로
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            // 시간 비교
            return a.time.localeCompare(b.time);
        });
    }

    if (filteredTodos.length === 0) {
        const categoryNames = {
            'monday': '월요일', 'tuesday': '화요일', 'wednesday': '수요일',
            'thursday': '목요일', 'friday': '금요일', 'saturday': '토요일', 'sunday': '일요일'
        };
        todoList.innerHTML = `<li style="text-align: center; padding: 2rem; color: var(--text-muted);">
            ${categoryNames[currentCategory]} 할 일을 추가해보세요! 🎯</li>`;
        updateProgress();
        return;
    }

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);
        const timeHTML = todo.time ? `<span class="todo-time">${todo.time}</span>` : '';
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} aria-label="할 일 완료 체크">
            ${timeHTML}
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="delete-btn" aria-label="할 일 삭제">✕</button>
        `;
        li.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(todo.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
        todoList.appendChild(li);
    });
    updateProgress();
}

// ==================== Todo 토글 ====================
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateWeeklyStats();
    }
}

// ==================== Todo 삭제 ====================
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
    updateWeeklyStats();
}

// ==================== 완료된 항목 삭제 ====================
clearCompleted.addEventListener('click', () => {
    const filteredTodos = todos.filter(t => t.category === currentCategory);
    const completedCount = filteredTodos.filter(t => t.completed).length;
    if (completedCount === 0) return;
    if (confirm(`완료된 ${completedCount}개의 항목을 삭제하시겠습니까?`)) {
        todos = todos.filter(t => !(t.category === currentCategory && t.completed));
        saveTodos();
        renderTodos();
        updateWeeklyStats();
    }
});

// ==================== 진행률 업데이트 ====================
function updateProgress() {
    const filteredTodos = todos.filter(t => t.category === currentCategory);
    const total = filteredTodos.length;
    const completed = filteredTodos.filter(t => t.completed).length;
    progressCount.textContent = `${completed} / ${total}`;
    const percentage = total === 0 ? 0 : (completed / total) * 100;
    progressBar.style.width = `${percentage}%`;
}

// ==================== 주간 달성률 업데이트 ====================
function updateWeeklyStats() {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let totalPercentage = 0;
    let validDays = 0;

    weekdays.forEach(day => {
        const dayTodos = todos.filter(t => t.category === day);
        const total = dayTodos.length;
        const completed = dayTodos.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        if (total > 0) {
            totalPercentage += percentage;
            validDays++;
        }

        const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
        const statBar = document.getElementById(`stat${dayCapitalized}`);
        const percentSpan = document.getElementById(`percent${dayCapitalized}`);
        if (statBar && percentSpan) {
            statBar.style.width = `${percentage}%`;
            percentSpan.textContent = `${percentage}%`;
        }
    });

    const average = validDays > 0 ? Math.round(totalPercentage / validDays) : 0;
    const averagePercent = document.getElementById('averagePercent');
    if (averagePercent) averagePercent.textContent = `${average}%`;
}

// ==================== 엑셀 Export ====================
exportExcel.addEventListener('click', () => {
    if (typeof XLSX === 'undefined') {
        alert('엑셀 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const wb = XLSX.utils.book_new();
    const categories = [
        { key: 'monday', name: '월요일' }, { key: 'tuesday', name: '화요일' },
        { key: 'wednesday', name: '수요일' }, { key: 'thursday', name: '목요일' },
        { key: 'friday', name: '금요일' }, { key: 'saturday', name: '토요일' }, { key: 'sunday', name: '일요일' }
    ];

    categories.forEach(cat => {
        const categoryTodos = todos.filter(t => t.category === cat.key);
        const data = [['시간', '할 일', '완료', '생성일']];
        categoryTodos.forEach(todo => {
            data.push([
                todo.time || '-', todo.text,
                todo.completed ? '✓' : '✗',
                new Date(todo.createdAt).toLocaleDateString('ko-KR')
            ]);
        });
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, cat.name);
    });

    const statsData = [['요일', '전체', '완료', '달성률']];
    categories.forEach(cat => {
        const categoryTodos = todos.filter(t => t.category === cat.key);
        const total = categoryTodos.length;
        const completed = categoryTodos.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        statsData.push([cat.name, total, completed, `${percentage}%`]);
    });
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, '통계');
    XLSX.writeFile(wb, `todo_${year}-${month}.xlsx`);
});

// ==================== 로컬 스토리지 ====================
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        try {
            todos = JSON.parse(stored);
            todos = todos.map(todo => {
                if (!todo.category) return { ...todo, category: 'monday' };
                if (todo.category === 'weekday') return { ...todo, category: 'monday' };
                if (todo.category === 'weekend') return { ...todo, category: 'sunday' };
                return todo;
            });
        } catch (e) {
            console.error('Failed to load todos:', e);
            todos = [];
        }
    }
}

// ==================== 테마 ====================
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// ==================== HTML 이스케이프 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 탭 전환 ====================
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category');

        // 선택된 날짜 업데이트
        const dayIndex = parseInt(btn.getAttribute('data-day'));
        const weekDates = getWeekDates(currentWeekStart);
        selectedDate = formatDate(weekDates[dayIndex]);

        renderTodos();
    });
});

// ==================== 뷰 전환 ====================
todoViewBtn.addEventListener('click', () => {
    todoViewBtn.classList.add('active');
    statsViewBtn.classList.remove('active');
    todoListElement.style.display = 'block';
    weeklyStats.style.display = 'none';
});

statsViewBtn.addEventListener('click', () => {
    statsViewBtn.classList.add('active');
    todoViewBtn.classList.remove('active');
    todoListElement.style.display = 'none';
    weeklyStats.style.display = 'block';
});

// ==================== 주간 저장 ====================
saveWeek.addEventListener('click', () => {
    try {
        const weekDates = getWeekDates(currentWeekStart);
        const startDate = formatDate(weekDates[0]);
        const endDate = formatDate(weekDates[6]);

        const weekTodos = todos.filter(t => t.date >= startDate && t.date <= endDate);

        const dataStr = JSON.stringify(weekTodos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const filename = `todo_week_${startDate}_${endDate}.json`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        alert(`✅ 현재 주의 할 일이 저장되었습니다!\n\n파일명: ${filename}\n총 ${weekTodos.length}개`);
    } catch (error) {
        alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
});

// ==================== 월간 저장 ====================
saveMonth.addEventListener('click', () => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const monthTodos = todos.filter(t => {
            if (!t.date) return false;
            const todoDate = new Date(t.date);
            return todoDate.getFullYear() === year && todoDate.getMonth() + 1 === month;
        });

        const dataStr = JSON.stringify(monthTodos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const monthStr = String(month).padStart(2, '0');
        const filename = `todo_month_${year}-${monthStr}.json`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        alert(`✅ ${year}년 ${month}월의 할 일이 저장되었습니다!\n\n파일명: ${filename}\n총 ${monthTodos.length}개`);
    } catch (error) {
        alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
});

// ==================== 연간 저장 ====================
saveYear.addEventListener('click', () => {
    try {
        const now = new Date();
        const year = now.getFullYear();

        const yearTodos = todos.filter(t => {
            if (!t.date) return false;
            const todoDate = new Date(t.date);
            return todoDate.getFullYear() === year;
        });

        const dataStr = JSON.stringify(yearTodos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const filename = `todo_year_${year}.json`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        alert(`✅ ${year}년의 할 일이 저장되었습니다!\n\n파일명: ${filename}\n총 ${yearTodos.length}개`);
    } catch (error) {
        alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
});

// ==================== 현재 요일 복사 ====================
copyBtn.addEventListener('click', () => {
    // 현재 선택된 요일 + 날짜의 할 일만 복사
    const currentTodos = todos.filter(t => t.category === currentCategory && t.date === selectedDate);

    if (currentTodos.length === 0) {
        alert('복사할 할 일이 없습니다.');
        return;
    }

    copiedTodos = currentTodos.map(todo => ({
        text: todo.text,
        time: todo.time,
        completed: false
    }));

    const categoryNames = {
        'monday': '월요일', 'tuesday': '화요일', 'wednesday': '수요일',
        'thursday': '목요일', 'friday': '금요일', 'saturday': '토요일', 'sunday': '일요일'
    };

    alert(`✅ ${categoryNames[currentCategory]}의 할 일 ${copiedTodos.length}개를 복사했습니다!\n\n다른 요일 탭으로 이동한 후 "다른 요일에 붙여넣기" 버튼을 클릭하세요.`);
});

// ==================== 다른 요일에 붙여넣기 ====================
pasteBtn.addEventListener('click', () => {
    if (copiedTodos.length === 0) {
        alert('복사된 할 일이 없습니다.\n먼저 "현재 요일 복사" 버튼을 클릭하여 할 일을 복사하세요.');
        return;
    }

    const categoryNames = {
        'monday': '월요일', 'tuesday': '화요일', 'wednesday': '수요일',
        'thursday': '목요일', 'friday': '금요일', 'saturday': '토요일', 'sunday': '일요일'
    };

    const currentCategoryName = categoryNames[currentCategory];
    // 현재 선택된 날짜의 할 일 개수 확인
    const existingCount = todos.filter(t => t.category === currentCategory && t.date === selectedDate).length;

    let message = `${currentCategoryName}에 ${copiedTodos.length}개의 할 일을 붙여넣으시겠습니까?`;
    if (existingCount > 0) {
        message += `\n\n현재 ${currentCategoryName}에는 ${existingCount}개의 할 일이 있습니다.\n복사된 할 일이 추가됩니다.`;
    }

    if (confirm(message)) {
        copiedTodos.forEach(copiedTodo => {
            const newTodo = {
                id: Date.now() + Math.random(),
                text: copiedTodo.text,
                time: copiedTodo.time,
                category: currentCategory,
                date: selectedDate,  // 현재 선택된 날짜 추가
                completed: false,
                createdAt: new Date().toISOString()
            };
            todos.push(newTodo);
        });

        saveTodos();
        renderTodos();
        updateWeeklyStats();

        alert(`✅ ${currentCategoryName}에 ${copiedTodos.length}개의 할 일을 추가했습니다!`);
    }
});

// ==================== 시간순 정렬 ====================
sortByTime.addEventListener('click', () => {
    isSortedByTime = !isSortedByTime;

    if (isSortedByTime) {
        sortByTime.classList.add('active');
        sortByTime.innerHTML = '<span class="sort-icon">🕐</span> 시간순서 정렬 (활성)';
    } else {
        sortByTime.classList.remove('active');
        sortByTime.innerHTML = '<span class="sort-icon">🕐</span> 시간순서 정렬';
    }

    renderTodos();
});

// ==================== 주간 네비게이션 ====================
prevWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    updateDateDisplay();
    renderTodos();
});

nextWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    updateDateDisplay();
    renderTodos();
});

// ==================== 키보드 단축키 ====================
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        todoInput.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        themeToggle.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportExcel.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveBtn.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        loadBtn.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.shiftKey) {
        e.preventDefault();
        copyBtn.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && e.shiftKey) {
        e.preventDefault();
        pasteBtn.click();
    }
});
