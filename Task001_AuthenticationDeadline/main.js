
const USERS_KEY = "auth_demo_users";

async function hashValue(value) {
  const enc = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }

}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return getUsers().find((u) => u.email === normalized) || null;
}

async function createUser({ name, email, password, securityQuestion, securityAnswer }) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashValue(password),
    securityQuestion,
    securityAnswerHash: await hashValue(securityAnswer.trim().toLowerCase()),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);
  return user;
}

async function verifyCredentials(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  const hash = await hashValue(password);
  return hash === user.passwordHash ? user : null;
}

async function verifySecurityAnswer(email, answer) {
  const user = findUserByEmail(email);
  if (!user) return false;
  const hash = await hashValue(answer.trim().toLowerCase());
  return hash === user.securityAnswerHash;
}

async function updatePassword(email, newPassword) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === email.trim().toLowerCase());
  if (idx === -1) throw new Error("Account not found.");
  users[idx].passwordHash = await hashValue(newPassword);
  saveUsers(users);
}

/* ============================ SESSIONS ============================ */

const SESSION_KEY = "auth_demo_session";
const SESSION_DURATION_MS = { short: 10 * 60 * 1000, remembered: 7 * 24 * 60 * 60 * 1000 };

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function createSession(user, remember) {
  const now = Date.now();
  const duration = remember ? SESSION_DURATION_MS.remembered : SESSION_DURATION_MS.short;
  const session = {
    token: generateToken(),
    email: user.email,
    name: user.name,
    issuedAt: now,
    expiresAt: now + duration,
    remember: !!remember,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  if (!session.expiresAt || Date.now() > session.expiresAt) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return session;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
}



const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_RE.test(email.trim());
}

function checkPasswordStrength(password) {
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(rules).filter(Boolean).length;

  let level = 0, label = "";
  if (password.length === 0) { level = 0; label = ""; }
  else if (passed <= 2) { level = 1; label = "Weak"; }
  else if (passed === 3) { level = 2; label = "Fair"; }
  else if (passed === 4) { level = 3; label = "Good"; }
  else { level = 4; label = "Strong"; }

  return { level, label, rules };
}

function isPasswordAcceptable(password) {
  const { rules } = checkPasswordStrength(password);
  const classes = [rules.upper, rules.lower, rules.number, rules.special].filter(Boolean).length;
  return rules.length && classes >= 3;
}

function showFieldError(inputEl, message) {
  inputEl.setAttribute("aria-invalid", "true");
  const errorEl = document.getElementById(inputEl.dataset.errorFor);
  if (errorEl) { errorEl.textContent = message; errorEl.classList.add("show"); }
}

function clearFieldError(inputEl) {
  inputEl.removeAttribute("aria-invalid");
  const errorEl = document.getElementById(inputEl.dataset.errorFor);
  if (errorEl) { errorEl.textContent = ""; errorEl.classList.remove("show"); }
}

/* ============================ UI HELPERS ============================ */

function ensureToastStack() {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    stack.setAttribute("role", "status");
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = "info", duration = 3500) {
  const stack = ensureToastStack();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function setButtonLoading(button, isLoading) {
  button.disabled = isLoading;
  button.classList.toggle("loading", isLoading);
}

function wirePasswordToggle(toggleBtn, input) {
  toggleBtn.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    toggleBtn.textContent = isHidden ? "Hide" : "Show";
    toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
}

/* ============================ VIEW ROUTER ============================ */
/* Single-page app: one view visible at a time, swapped via .active class. */

function showView(name) {
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(`view-${name}`).classList.add("active");

  if (name === "forgot") resetForgotFlow();
  if (name === "dashboard") renderDashboard();
}

function resetForgotFlow() {
  document.getElementById("fp-step-1").style.display = "";
  document.getElementById("fp-step-2").style.display = "none";
  document.getElementById("fp-step-3").style.display = "none";
  ["fp-indicator-1", "fp-indicator-2", "fp-indicator-3"].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove("active", "done");
    if (i === 0) el.classList.add("active");
  });
}


document.addEventListener("DOMContentLoaded", () => {
  // Nav links (data-nav="login" / "register" / "forgot-1")
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showView(el.dataset.nav.split("-")[0]); // "
    });
  });

   id>")
  document.querySelectorAll(".toggle-visibility").forEach((btn) => {
    const input = document.getElementById(btn.dataset.toggleTarget);
    if (input) wirePasswordToggle(btn, input);
  });

  wireLoginView();
  wireRegisterView();
  wireForgotView();
  wireDashboardView();

 
  showView(getSession() ? "dashboard" : "login");
});

/* ============================ LOGIN VIEW ============================ */

function wireLoginView() {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const rememberInput = document.getElementById("login-remember");
  const submitBtn = document.getElementById("login-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    if (!isValidEmail(emailInput.value)) { showFieldError(emailInput, "Enter a valid email address."); valid = false; }
    else clearFieldError(emailInput);

    if (passwordInput.value.length === 0) { showFieldError(passwordInput, "Enter your password."); valid = false; }
    else clearFieldError(passwordInput);

    if (!valid) return;

    setButtonLoading(submitBtn, true);
    const user = await verifyCredentials(emailInput.value, passwordInput.value);

    if (!user) {
      showToast("Incorrect email or password.", "error");
      showFieldError(passwordInput, "Incorrect email or password.");
      setButtonLoading(submitBtn, false);
      return;
    }

    createSession(user, rememberInput.checked);
    showToast(`Welcome back, ${user.name.split(" ")[0]}.`, "success");
    setButtonLoading(submitBtn, false);
    showView("dashboard");
  });
}

/* ============================ REGISTER VIEW ============================ */

function wireRegisterView() {
  const form = document.getElementById("register-form");
  const nameInput = document.getElementById("reg-name");
  const emailInput = document.getElementById("reg-email");
  const passwordInput = document.getElementById("reg-password");
  const confirmInput = document.getElementById("reg-confirm-password");
  const questionSelect = document.getElementById("reg-security-question");
  const answerInput = document.getElementById("reg-security-answer");
  const submitBtn = document.getElementById("register-submit");
  const strengthMeter = document.getElementById("reg-strength-meter");
  const strengthLabel = document.getElementById("reg-strength-label");

  passwordInput.addEventListener("input", () => {
    const { level, label } = checkPasswordStrength(passwordInput.value);
    strengthMeter.dataset.level = String(level);
    strengthLabel.textContent = passwordInput.value ? label : "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    if (nameInput.value.trim().length < 2) { showFieldError(nameInput, "Enter your full name."); valid = false; }
    else clearFieldError(nameInput);

    if (!isValidEmail(emailInput.value)) { showFieldError(emailInput, "Enter a valid email address."); valid = false; }
    else clearFieldError(emailInput);

    if (!isPasswordAcceptable(passwordInput.value)) {
      showFieldError(passwordInput, "Use at least 8 characters, with upper/lowercase, a number, and a symbol.");
      valid = false;
    } else clearFieldError(passwordInput);

    if (confirmInput.value !== passwordInput.value || confirmInput.value === "") {
      showFieldError(confirmInput, "Passwords do not match.");
      valid = false;
    } else clearFieldError(confirmInput);

    if (!questionSelect.value) { showFieldError(questionSelect, "Choose a security question."); valid = false; }
    else clearFieldError(questionSelect);

    if (answerInput.value.trim().length < 2) { showFieldError(answerInput, "Provide an answer to your security question."); valid = false; }
    else clearFieldError(answerInput);

    if (!valid) return;

    setButtonLoading(submitBtn, true);
    try {
      await createUser({
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        securityQuestion: questionSelect.value,
        securityAnswer: answerInput.value,
      });
      showToast("Account created. Please sign in.", "success");
      form.reset();
      strengthMeter.dataset.level = "0";
      strengthLabel.textContent = "";
      showView("login");
    } catch (err) {
      showToast(err.message || "Could not create account.", "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ============================ FORGOT PASSWORD VIEW ============================ */

function wireForgotView() {
  let activeEmail = null;

  function goToStep(n) {
    document.getElementById("fp-step-1").style.display = n === 1 ? "" : "none";
    document.getElementById("fp-step-2").style.display = n === 2 ? "" : "none";
    document.getElementById("fp-step-3").style.display = n === 3 ? "" : "none";
    [1, 2, 3].forEach((i) => {
      const el = document.getElementById(`fp-indicator-${i}`);
      el.classList.remove("active", "done");
      if (i < n) el.classList.add("done");
      if (i === n) el.classList.add("active");
    });
  }

  // Step 1: find account
  const findForm = document.getElementById("find-account-form");
  const emailInput = document.getElementById("fp-email");
  const findSubmit = document.getElementById("find-account-submit");

  findForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isValidEmail(emailInput.value)) { showFieldError(emailInput, "Enter a valid email address."); return; }
    clearFieldError(emailInput);

    setButtonLoading(findSubmit, true);
    const user = findUserByEmail(emailInput.value);

    setTimeout(() => {
      setButtonLoading(findSubmit, false);
      if (!user) {
        showFieldError(emailInput, "We couldn't find an account with that email.");
        return;
      }
      activeEmail = user.email;
      document.getElementById("fp-question-display").textContent = user.securityQuestion;
      goToStep(2);
    }, 300);
  });

  // Step 2: verify security answer
  const verifyForm = document.getElementById("verify-form");
  const answerInput = document.getElementById("fp-answer");
  const verifySubmit = document.getElementById("verify-submit");

  verifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (answerInput.value.trim().length === 0) { showFieldError(answerInput, "Enter your answer."); return; }
    clearFieldError(answerInput);

    setButtonLoading(verifySubmit, true);
    const correct = await verifySecurityAnswer(activeEmail, answerInput.value);
    setButtonLoading(verifySubmit, false);

    if (!correct) { showFieldError(answerInput, "That answer doesn't match our records."); return; }
    goToStep(3);
  });

  // Step 3: set new password
  const resetForm = document.getElementById("reset-form");
  const newPasswordInput = document.getElementById("fp-new-password");
  const confirmNewPasswordInput = document.getElementById("fp-confirm-new-password");
  const resetSubmit = document.getElementById("reset-submit");
  const strengthMeter = document.getElementById("fp-strength-meter");
  const strengthLabel = document.getElementById("fp-strength-label");

  newPasswordInput.addEventListener("input", () => {
    const { level, label } = checkPasswordStrength(newPasswordInput.value);
    strengthMeter.dataset.level = String(level);
    strengthLabel.textContent = newPasswordInput.value ? label : "";
  });

  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    if (!isPasswordAcceptable(newPasswordInput.value)) {
      showFieldError(newPasswordInput, "Use at least 8 characters, with upper/lowercase, a number, and a symbol.");
      valid = false;
    } else clearFieldError(newPasswordInput);

    if (confirmNewPasswordInput.value !== newPasswordInput.value || confirmNewPasswordInput.value === "") {
      showFieldError(confirmNewPasswordInput, "Passwords do not match.");
      valid = false;
    } else clearFieldError(confirmNewPasswordInput);

    if (!valid) return;

    setButtonLoading(resetSubmit, true);
    try {
      await updatePassword(activeEmail, newPasswordInput.value);
      showToast("Password updated. Please sign in.", "success");
      resetForm.reset();
      goToStep(1);
      showView("login");
    } catch (err) {
      showToast(err.message || "Could not update password.", "error");
    } finally {
      setButtonLoading(resetSubmit, false);
    }
  });
}

/* ============================ DASHBOARD VIEW ============================ */

let dashboardInterval = null;

function wireDashboardView() {
  document.getElementById("logout-btn").addEventListener("click", () => {
    logout();
    clearInterval(dashboardInterval);
    showView("login");
  });
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function renderDashboard() {
  const session = getSession();
  if (!session) { showView("login"); return; }

  const user = findUserByEmail(session.email);

  document.getElementById("welcome-name").textContent = `Welcome, ${session.name.split(" ")[0]}`;
  document.getElementById("welcome-email").textContent = session.email;
  document.getElementById("meta-name").textContent = user ? user.name : session.name;
  document.getElementById("meta-email").textContent = session.email;
  document.getElementById("meta-created").textContent = user
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";
  document.getElementById("session-token").textContent = session.token.slice(0, 16) + "…";
  document.getElementById("session-issued").textContent = new Date(session.issuedAt).toLocaleTimeString();
  document.getElementById("session-remember").textContent = session.remember ? "Yes (7-day session)" : "No (10-minute session)";

  const countdownEl = document.getElementById("session-countdown");

  clearInterval(dashboardInterval);
  function tick() {
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      showToast("Your session expired. Signing out…", "error");
      logout();
      clearInterval(dashboardInterval);
      showView("login");
      return;
    }
    countdownEl.textContent = formatRemaining(remaining);
    countdownEl.classList.toggle("warn", remaining < 60 * 1000);
  }
  tick();
  dashboardInterval = setInterval(tick, 1000);
}
