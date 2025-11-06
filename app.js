// Premium 1% Club Habit Tracker
// State Management
const state = {
  user: {
    selectedHabit: null,
    onboarded: false,
    quietHours: true
  },
  habit: {
    name: '',
    action: '',
    completions: [true, true, false, true, true, true, true, true, false, true, true, true, true, false, true],
    streak: 3,
    momentum: 48.5
  },
  pod: {
    members: [
      { name: 'Alex', initials: 'A', consistency: 85, completed: true, color: '#2563eb' },
      { name: 'Jordan', initials: 'J', consistency: 92, completed: true, color: '#10b981' },
      { name: 'Sam', initials: 'S', consistency: 71, completed: false, color: '#f59e0b' },
      { name: 'Casey', initials: 'C', consistency: 88, completed: true, color: '#ec4899' }
    ]
  },
  analytics: {
    events: [
      { type: 'app_open', time: '09:00' },
      { type: 'habit_complete', time: '09:15' },
      { type: 'pod_join', time: '14:30' },
      { type: 'report_view', time: '20:00' },
      { type: 'paywall_shown', time: '15:45' }
    ]
  }
};

const habits = {
  meditation: { name: 'Meditation', action: '5-minute meditation', emoji: '🧘' },
  reading: { name: 'Reading', action: '10 pages today', emoji: '📚' },
  exercise: { name: 'Exercise', action: '15-min workout', emoji: '💪' },
  journaling: { name: 'Journaling', action: '3-line entry', emoji: '📝' },
  learning: { name: 'Learning', action: '10-min lesson', emoji: '🧠' },
  stretching: { name: 'Stretching', action: '5-min routine', emoji: '🤸' }
};

// Screen Management
function showScreen(screenName) {
  const screens = document.querySelectorAll('.app-screen');
  const navItems = document.querySelectorAll('.nav-item');
  
  screens.forEach(screen => {
    screen.classList.remove('active');
  });
  
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  
  const targetScreen = document.getElementById(`${screenName}View`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
  
  const targetNav = document.querySelector(`[data-screen="${screenName}"]`);
  if (targetNav) {
    targetNav.classList.add('active');
  }
  
  // Special actions for certain screens
  if (screenName === 'daily') {
    setTimeout(() => {
      drawCompoundingCurve();
      updateDailyStats();
    }, 100);
  }
  
  if (screenName === 'report') {
    setTimeout(() => {
      drawWeekChart();
    }, 100);
  }
  
  logEvent(`screen_view_${screenName}`);
}

// Navigation Setup
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const screen = item.dataset.screen;
    showScreen(screen);
  });
});

// Onboarding Flow
const habitCards = document.querySelectorAll('.habit-card');
const habitPreview = document.getElementById('habitPreview');
const startJourneyBtn = document.getElementById('startJourneyBtn');

habitCards.forEach(card => {
  card.addEventListener('click', () => {
    habitCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    const habitKey = card.dataset.habit;
    state.user.selectedHabit = habitKey;
    
    habitPreview.style.display = 'block';
    habitPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    logEvent(`habit_selected_${habitKey}`);
  });
});

if (startJourneyBtn) {
  startJourneyBtn.addEventListener('click', () => {
    if (state.user.selectedHabit) {
      state.user.onboarded = true;
      const habitData = habits[state.user.selectedHabit];
      state.habit.name = habitData.name;
      state.habit.action = habitData.action;
      
      // Update daily view with selected habit
      document.getElementById('habitTitle').textContent = `${habitData.emoji} ${habitData.name}`;
      document.getElementById('actionText').textContent = habitData.action;
      
      showScreen('daily');
      logEvent('onboarding_complete');
    }
  });
}

// Daily View - Compounding Curve
function drawCompoundingCurve() {
  const canvas = document.getElementById('compoundCurve');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  
  // High DPI support
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);
  
  ctx.clearRect(0, 0, width, height);
  
  const completions = state.habit.completions;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Calculate compound scores
  const scores = [];
  let score = 0;
  completions.forEach(completed => {
    if (completed) {
      score += 1.05; // Compound growth
    } else {
      score += 0.15; // Minimal growth on miss
    }
    scores.push(score);
  });
  
  const maxScore = Math.max(...scores) * 1.1;
  const xStep = chartWidth / (scores.length - 1);
  
  // Draw grid lines
  ctx.strokeStyle = '#f3f4f6';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i * chartHeight / 4);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  
  // Draw curve with gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#10b981');
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  scores.forEach((score, i) => {
    const x = padding + (i * xStep);
    const y = height - padding - ((score / maxScore) * chartHeight);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // Draw fill area
  ctx.lineTo(width - padding, height - padding);
  ctx.lineTo(padding, height - padding);
  ctx.closePath();
  
  const fillGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  fillGradient.addColorStop(0, 'rgba(37, 99, 235, 0.1)');
  fillGradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
  ctx.fillStyle = fillGradient;
  ctx.fill();
  
  // Draw points
  scores.forEach((score, i) => {
    const x = padding + (i * xStep);
    const y = height - padding - ((score / maxScore) * chartHeight);
    
    ctx.beginPath();
    ctx.arc(x, y, completions[i] ? 4 : 3, 0, Math.PI * 2);
    ctx.fillStyle = completions[i] ? '#2563eb' : '#e5e7eb';
    ctx.fill();
    
    if (completions[i]) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// Update Daily Stats
function updateDailyStats() {
  const completions = state.habit.completions;
  const daysActive = completions.length;
  const completed = completions.filter(c => c).length;
  
  // Calculate streak
  let streak = 0;
  for (let i = completions.length - 1; i >= 0; i--) {
    if (completions[i]) {
      streak++;
    } else {
      break;
    }
  }
  
  // Calculate momentum (compound score)
  let momentum = 0;
  completions.forEach(c => {
    if (c) momentum += 1.05;
    else momentum += 0.15;
  });
  
  document.getElementById('daysActive').textContent = daysActive;
  document.getElementById('currentStreak').textContent = streak;
  document.getElementById('momentumScore').textContent = momentum.toFixed(1);
  
  // Update week progress
  const lastWeek = completions.slice(-7);
  const weekCompleted = lastWeek.filter(c => c).length;
  const weekPercent = Math.round((weekCompleted / 7) * 100);
  
  document.getElementById('weekPercent').textContent = `${weekPercent}%`;
  document.getElementById('weekProgress').style.width = `${weekPercent}%`;
  
  state.habit.streak = streak;
  state.habit.momentum = momentum;
}

// Date Display
function updateDateDisplay() {
  const now = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', options);
  const dateEl = document.getElementById('dateDisplay');
  if (dateEl) {
    dateEl.textContent = dateStr;
  }
}

// Habit Completion
const completeCheckbox = document.getElementById('completeCheckbox');
const celebrationMsg = document.getElementById('celebrationMsg');

if (completeCheckbox) {
  completeCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      // Add completion
      state.habit.completions.push(true);
      
      // Show celebration
      celebrationMsg.style.display = 'block';
      
      // Update stats and curve
      setTimeout(() => {
        updateDailyStats();
        drawCompoundingCurve();
      }, 300);
      
      // Hide celebration and reset checkbox
      setTimeout(() => {
        celebrationMsg.style.display = 'none';
        e.target.checked = false;
      }, 3000);
      
      logEvent('habit_complete');
    }
  });
}

// Quiet Hours Toggle
const quietToggle = document.getElementById('quietToggle');
if (quietToggle) {
  quietToggle.addEventListener('change', (e) => {
    state.user.quietHours = e.target.checked;
    logEvent('quiet_hours_toggled');
  });
}

// Pods View
const inviteBtn = document.getElementById('inviteBtn');
const referralCard = document.getElementById('referralCard');
const copyBtn = document.getElementById('copyBtn');

if (inviteBtn) {
  inviteBtn.addEventListener('click', () => {
    referralCard.style.display = 'block';
    logEvent('referral_generate');
  });
}

if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    const code = document.getElementById('refCode').textContent;
    
    // Visual feedback
    copyBtn.textContent = '✓';
    setTimeout(() => {
      copyBtn.textContent = '📋';
    }, 1500);
    
    logEvent('referral_copy');
  });
}

// Report View - Feelings
const feelingCards = document.querySelectorAll('.feeling-card');
const feelingFeedback = document.getElementById('feelingFeedback');

const feelingMessages = {
  calm: '😌 Wonderful! Calmness is a sign of sustainable progress.',
  energized: '⚡ Amazing! You are in the flow state.',
  pressured: '😰 That is okay. Remember: momentum over perfection.',
  neutral: '😐 Perfectly fine. Not every day needs to feel exceptional.'
};

feelingCards.forEach(card => {
  card.addEventListener('click', () => {
    feelingCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    const feeling = card.dataset.feeling;
    feelingFeedback.textContent = feelingMessages[feeling];
    feelingFeedback.style.display = 'block';
    
    logEvent(`mood_selected_${feeling}`);
  });
});

// Draw Week Chart
function drawWeekChart() {
  const canvas = document.getElementById('weekChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);
  
  ctx.clearRect(0, 0, width, height);
  
  const lastWeek = state.habit.completions.slice(-7);
  const padding = 40;
  const barWidth = (width - padding * 2) / 7;
  const chartHeight = height - padding * 2;
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  lastWeek.forEach((completed, i) => {
    const x = padding + (i * barWidth);
    const barH = completed ? chartHeight * 0.85 : chartHeight * 0.25;
    const y = padding + (chartHeight - barH);
    
    // Draw bar
    const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
    gradient.addColorStop(0, completed ? '#2563eb' : '#e5e7eb');
    gradient.addColorStop(1, completed ? '#10b981' : '#d1d5db');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x + barWidth * 0.15, y, barWidth * 0.7, barH);
    
    // Draw day label
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(days[i], x + barWidth / 2, height - 15);
  });
}

// Update Consistency Score
const completions = state.habit.completions;
const completed = completions.filter(c => c).length;
const consistencyPercent = Math.round((completed / completions.length) * 100);
document.getElementById('consistencyScore').textContent = `${consistencyPercent}%`;

// Save Report
const saveReportBtn = document.getElementById('saveReportBtn');
if (saveReportBtn) {
  saveReportBtn.addEventListener('click', () => {
    // Visual feedback
    saveReportBtn.textContent = '✓ Saved!';
    saveReportBtn.style.background = '#10b981';
    
    setTimeout(() => {
      saveReportBtn.textContent = 'Save Reflection';
      saveReportBtn.style.background = '';
    }, 2000);
    
    logEvent('report_saved');
  });
}

// Paywall
const startTrialBtn = document.getElementById('startTrialBtn');
const referralUnlockBtn = document.getElementById('referralUnlockBtn');

if (startTrialBtn) {
  startTrialBtn.addEventListener('click', () => {
    startTrialBtn.textContent = '🎉 Trial Started!';
    startTrialBtn.style.background = '#10b981';
    
    setTimeout(() => {
      startTrialBtn.textContent = 'Start 7-Day Free Trial';
      startTrialBtn.style.background = '';
    }, 2500);
    
    logEvent('trial_started');
  });
}

if (referralUnlockBtn) {
  referralUnlockBtn.addEventListener('click', () => {
    showScreen('pods');
    logEvent('referral_unlock_clicked');
  });
}

// Metrics Dashboard
function updateMetrics() {
  document.getElementById('retentionMetric').textContent = '72%';
  document.getElementById('completionMetric').textContent = '84%';
  document.getElementById('podJoinMetric').textContent = '65%';
  document.getElementById('totalEvents').textContent = state.analytics.events.length;
  
  const eventsList = document.getElementById('eventsList');
  if (eventsList) {
    eventsList.innerHTML = '';
    
    state.analytics.events.slice(-10).reverse().forEach(event => {
      const item = document.createElement('div');
      item.className = 'event-log-item';
      item.innerHTML = `
        <span class="event-type">${event.type}</span>
        <span class="event-time">${event.time}</span>
      `;
      eventsList.appendChild(item);
    });
  }
}

const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      refreshBtn.style.transform = '';
      updateMetrics();
    }, 400);
    
    logEvent('metrics_refresh');
  });
}

// Event Logging
function logEvent(eventType) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  state.analytics.events.push({
    type: eventType,
    time: time
  });
  
  console.log(`📊 Event: ${eventType} at ${time}`);
}

// Initialize App
function initApp() {
  updateDateDisplay();
  drawCompoundingCurve();
  updateDailyStats();
  updateMetrics();
  logEvent('app_open');
  
  console.log('🎯 1% Club initialized');
  console.log('State:', state);
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Handle window resize for canvas redraw
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const activeScreen = document.querySelector('.app-screen.active');
    if (activeScreen) {
      if (activeScreen.id === 'dailyView') {
        drawCompoundingCurve();
      } else if (activeScreen.id === 'reportView') {
        drawWeekChart();
      }
    }
  }, 250);
});