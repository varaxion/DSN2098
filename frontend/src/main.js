import './style.css';
import Chart from 'chart.js/auto';

const API_URL = 'http://localhost:5000/api';
const fetchOptions = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

const AppState = {
  isLoggedIn: false,
  username: '',
  transactions: [],
  totalMonth: 0,
  totalOverall: 0,
  isDevMode: false,
  currentView: 'dashboard' // 'dashboard' or 'history'
};

let categoryChartInstance = null;

async function checkAuthStatus() {
  try {
    const res = await fetch(`${API_URL}/auth/status`, { credentials: 'include' });
    const data = await res.json();
    AppState.isLoggedIn = data.loggedIn;
    AppState.username = data.username || '';
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

async function fetchTransactions() {
  if (AppState.isDevMode) return;
  try {
    const res = await fetch(`${API_URL}/transactions`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      AppState.transactions = data.transactions;
      AppState.totalMonth = data.totalMonth;
      AppState.totalOverall = data.totalOverall;
    }
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
  }
}

function renderNav() {
  const navLinks = document.getElementById('navLinks');
  if (AppState.isLoggedIn) {
    navLinks.innerHTML = `
      <a id="navDashboard" style="${AppState.currentView === 'dashboard' ? 'color: var(--primary-accent)' : ''}">Dashboard</a>
      <a id="navHistory" style="${AppState.currentView === 'history' ? 'color: var(--primary-accent)' : ''}">History</a>
      <span style="opacity:0.5; margin: 0 1rem;">|</span>
      <span>${AppState.username}</span>
      <a id="logoutBtn" style="color: var(--danger)">Logout</a>
    `;
    document.getElementById('navDashboard').addEventListener('click', () => switchView('dashboard'));
    document.getElementById('navHistory').addEventListener('click', () => switchView('history'));
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  } else {
    navLinks.innerHTML = `
      <a id="showLoginBtn">Login</a>
      <a id="showSignupBtn">Sign Up</a>
    `;
    document.getElementById('showLoginBtn')?.addEventListener('click', () => renderAuthView('login'));
    document.getElementById('showSignupBtn')?.addEventListener('click', () => renderAuthView('signup'));
  }
}

function switchView(view) {
  AppState.currentView = view;
  render();
}

async function handleLogout() {
  if (!AppState.isDevMode) {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', ...fetchOptions });
  }
  AppState.isLoggedIn = false;
  AppState.username = '';
  AppState.currentView = 'dashboard';
  render();
}

function renderAuthView(type) {
  const mainContent = document.getElementById('mainContent');
  const isLogin = type === 'login';
  
  mainContent.innerHTML = `
    <div class="authContainer glassCard">
      <h2>${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <div id="authMessage"></div>
      
      <div class="toggleContainer">
        <label class="toggleSwitch">
          <input type="checkbox" id="devModeToggle" ${AppState.isDevMode ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span style="font-size: 0.9rem; opacity: 0.8;">Dev Mode (Bypass DB)</span>
      </div>

      <form id="authForm">
        ${!isLogin ? `
          <div class="formGroup">
            <label>First Name</label>
            <input type="text" id="firstName" required />
          </div>
          <div class="formGroup">
            <label>Last Name</label>
            <input type="text" id="lastName" required />
          </div>
          <div class="formGroup">
            <label>Email</label>
            <input type="email" id="email" required />
          </div>
        ` : ''}
        <div class="formGroup">
          <label>Username</label>
          <input type="text" id="username" required />
        </div>
        <div class="formGroup">
          <label>Password</label>
          <input type="password" id="password" required />
        </div>
        <button type="submit" class="btn">${isLogin ? 'Login' : 'Sign Up'}</button>
      </form>
    </div>
  `;

  document.getElementById('devModeToggle').addEventListener('change', (e) => {
    AppState.isDevMode = e.target.checked;
  });

  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msgDiv = document.getElementById('authMessage');

    if (AppState.isDevMode) {
      AppState.isLoggedIn = true;
      AppState.username = username || 'DevUser';
      render();
      return;
    }

    try {
      if (isLogin) {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          ...fetchOptions,
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
          AppState.isLoggedIn = true;
          AppState.username = data.username;
          render();
        } else {
          msgDiv.innerHTML = `<p class="errorMsg">${data.error}</p>`;
        }
      } else {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          ...fetchOptions,
          body: JSON.stringify({ firstName, lastName, email, username, password })
        });
        const data = await res.json();
        if (res.ok) {
          msgDiv.innerHTML = `<p class="successMsg">Registration successful! Please login.</p>`;
          setTimeout(() => renderAuthView('login'), 2000);
        } else {
          msgDiv.innerHTML = `<p class="errorMsg">${data.error}</p>`;
        }
      }
    } catch (err) {
      msgDiv.innerHTML = `<p class="errorMsg">Network error occurred.</p>`;
    }
  });
}

function generateTransactionTable(transactions, emptyMessage = 'No transactions found.') {
  if (!transactions || transactions.length === 0) {
    return `<p style="opacity: 0.6; padding: 1rem;">${emptyMessage}</p>`;
  }

  const rows = transactions.map(tx => `
    <tr>
      <td>${tx.date}</td>
      <td>${tx.description || '<i>No description</i>'}</td>
      <td><span style="opacity:0.7; font-size: 0.9rem;">${tx.category}</span></td>
      <td style="color: var(--danger); font-weight: 600;">-₹${parseFloat(tx.amount).toFixed(2)}</td>
      <td style="text-align: right;">
        <button class="btn btn-secondary" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="deleteTx(${tx.id})">Delete</button>
      </td>
    </tr>
  `).join('');

  return `
    <div style="overflow-x: auto;">
      <table class="transactionTable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function renderDashboardView() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="dashboardLayout">
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div class="dashboardGrid" style="margin: 0;">
          <div class="glassCard statCard">
            <h3>This Month</h3>
            <div class="statValue">₹${AppState.totalMonth.toFixed(2)}</div>
          </div>
          <div class="glassCard statCard">
            <h3>Overall Spend</h3>
            <div class="statValue">₹${AppState.totalOverall.toFixed(2)}</div>
          </div>
        </div>
        
        <div class="glassCard">
          <h3>Add Transaction</h3>
          <form id="transactionForm" style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 1rem; align-items: end;">
            <div class="formGroup" style="margin-bottom: 0;">
              <label>Amount (₹)</label>
              <input type="number" step="0.01" id="txAmount" required />
            </div>
            <div class="formGroup" style="margin-bottom: 0;">
              <label>Description (Optional)</label>
              <input type="text" id="txDesc" />
            </div>
            <div class="formGroup" style="margin-bottom: 0;">
              <label>Category</label>
              <select id="txCategory" required>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button type="submit" class="btn">Add</button>
          </form>
        </div>
      </div>

      <div class="glassCard">
        <h3>Category Breakdown</h3>
        <div class="chartContainer">
          <canvas id="categoryChart"></canvas>
        </div>
      </div>
    </div>

    <div class="glassCard">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>Recent Transactions</h3>
        <button class="btn btn-secondary" style="width: auto;" onclick="switchView('history')">View All</button>
      </div>
      <div id="transactionList">
        <!-- Injected here -->
      </div>
    </div>
  `;

  drawCategoryChart();

  document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('txAmount').value);
    const description = document.getElementById('txDesc').value;
    const category = document.getElementById('txCategory').value;

    if (AppState.isDevMode) {
      AppState.transactions.unshift({
        id: Date.now(),
        amount: amount,
        description: description,
        category: category,
        date: new Date().toISOString().split('T')[0]
      });
      AppState.totalMonth += amount;
      AppState.totalOverall += amount;
      renderDashboardView();
      return;
    }

    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      ...fetchOptions,
      body: JSON.stringify({ amount, description, category })
    });
    
    if (res.ok) {
      await fetchTransactions();
      renderDashboardView();
    }
  });

  const txList = document.getElementById('transactionList');
  // Only show the latest 5 on the dashboard
  txList.innerHTML = generateTransactionTable(AppState.transactions.slice(0, 5));
}

function renderTransactionsView() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="glassCard">
      <h3>Transaction History</h3>
      
      <div class="filterGroup">
        <div class="formGroup" style="margin-bottom: 0;">
          <label>Start Date</label>
          <input type="date" id="filterStart" />
        </div>
        <div class="formGroup" style="margin-bottom: 0;">
          <label>End Date</label>
          <input type="date" id="filterEnd" />
        </div>
        <button id="btnFilter" class="btn" style="width: auto;">Filter</button>
        <button id="btnClear" class="btn btn-secondary" style="width: auto;">Clear</button>
      </div>

      <div id="historyList">
        <!-- Injected here -->
      </div>
    </div>
  `;

  // Default: latest 10 transactions
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = generateTransactionTable(AppState.transactions.slice(0, 10));

  const startInput = document.getElementById('filterStart');
  const endInput = document.getElementById('filterEnd');

  document.getElementById('btnFilter').addEventListener('click', () => {
    const start = startInput.value ? new Date(startInput.value) : null;
    const end = endInput.value ? new Date(endInput.value) : null;

    const filtered = AppState.transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (start && txDate < start) return false;
      if (end && txDate > end) return false;
      return true;
    });

    historyList.innerHTML = generateTransactionTable(filtered, 'No transactions found in this date range.');
  });

  document.getElementById('btnClear').addEventListener('click', () => {
    startInput.value = '';
    endInput.value = '';
    historyList.innerHTML = generateTransactionTable(AppState.transactions.slice(0, 10));
  });
}

function drawCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const categoryTotals = {};
  AppState.transactions.forEach(tx => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + parseFloat(tx.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  const backgroundColors = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'
  ];

  if (labels.length === 0) {
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(255, 255, 255, 0.1)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
    return;
  }

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#f8fafc', font: { family: 'Outfit', size: 12 } }
        }
      },
      cutout: '65%'
    }
  });
}

window.deleteTx = async (id) => {
  if (AppState.isDevMode) {
    const tx = AppState.transactions.find(t => t.id === id);
    if (tx) {
      AppState.totalMonth -= parseFloat(tx.amount);
      AppState.totalOverall -= parseFloat(tx.amount);
      AppState.transactions = AppState.transactions.filter(t => t.id !== id);
      render();
    }
    return;
  }

  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    ...fetchOptions
  });
  if (res.ok) {
    await fetchTransactions();
    render();
  }
}

window.switchView = switchView;

async function render() {
  renderNav();
  if (AppState.isLoggedIn) {
    if (AppState.transactions.length === 0 && !AppState.isDevMode) {
        await fetchTransactions();
    }
    if (AppState.currentView === 'dashboard') {
      renderDashboardView();
    } else {
      renderTransactionsView();
    }
  } else {
    renderAuthView('login');
  }
}

async function initializeApp() {
  document.querySelector('#app').innerHTML = `
    <div class="backgroundOrbs">
      <div class="orb1"></div>
      <div class="orb2"></div>
    </div>
    <nav class="glassCard" style="padding: 1rem 2rem; margin-bottom: 2rem;">
      <h1 style="margin: 0; font-size: 2rem;">SmartSpend</h1>
      <div class="navLinks" id="navLinks"></div>
    </nav>
    <main id="mainContent"></main>
  `;
  
  await checkAuthStatus();
  render();
}

initializeApp();
