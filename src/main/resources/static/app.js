const app = document.querySelector("#app");
const toastRegion = document.querySelector("#toastRegion");
const state = { user: null, page: "dashboard", complaints: [], filters: { q: "", status: "", category: "", priority: "" }, detailId: null, authMode: "login", requestId: 0 };

const categoryLabels = {
    ELECTRICAL: "Electrical issues", WIFI: "Wi-Fi & internet problems", CLASSROOM: "Classroom maintenance", HOSTEL: "Hostel facilities",
    PLUMBING: "Plumbing", CLEANING: "Cleaning", OTHER: "Other issues"
};
const statusLabels = {
    PENDING: "Pending", UNDER_REVIEW: "Under review", IN_PROGRESS: "In progress", RESOLVED: "Resolved", REJECTED: "Rejected"
};
const priorityLabels = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };
const icons = {
    dashboard: "bi-grid-1x2", complaints: "bi-inbox", submit: "bi-plus-circle", management: "bi-kanban",
    search: "bi-search", bell: "bi-bell", bolt: "bi-lightning-charge", check: "bi-check2-circle",
    clipboard: "bi-clipboard-check", clock: "bi-clock-history", warning: "bi-exclamation-triangle",
    review: "bi-eye", arrow: "bi-arrow-up-right", calendar: "bi-calendar3", pin: "bi-geo-alt",
    category: "bi-grid", back: "bi-arrow-left", send: "bi-send", user: "bi-person",
    lock: "bi-lock", envelope: "bi-envelope", menu: "bi-list", logout: "bi-box-arrow-right",
    chart: "bi-bar-chart", filter: "bi-sliders", sparkle: "bi-stars", chevron: "bi-chevron-right"
};
const icon = (name, extra = "") => `<i class="bi ${icons[name] || name} ${extra}" aria-hidden="true"></i>`;
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
const statusClass = (status) => status.toLowerCase().replaceAll("_", "-");
const niceStatus = (status) => statusLabels[status] || status;
const niceCategory = (category) => categoryLabels[category] || category;
const nicePriority = (priority) => priorityLabels[priority] || priority;
const dateTime = (date) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
const shortDate = (date) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));

async function api(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });
    const text = await response.text();
    const payload = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
    if (!response.ok) {
        const detail = payload.errors ? Object.values(payload.errors).join(". ") : payload.message;
        throw new Error(detail || `Request failed (${response.status})`);
    }
    return payload;
}

function notify(message, type = "success") {
    const node = document.createElement("div");
    node.className = `toast-message${type === "error" ? " error" : ""}`;
    node.innerHTML = `${icon(type === "error" ? "bi-exclamation-circle" : "bi-check-circle")}<span>${safe(message)}</span>`;
    toastRegion.append(node);
    setTimeout(() => node.remove(), 3700);
}

async function loadCurrentUser() {
    try {
        state.user = await api("/api/auth/me");
        state.page = "dashboard";
        renderShell();
        await navigate("dashboard");
    } catch (error) {
        state.user = null;
        renderAuth();
    }
}

function renderAuth() {
    state.authMode = state.authMode === "register" ? "register" : "login";
    const registering = state.authMode === "register";
    app.innerHTML = `
        <main class="auth-layout">
            <section class="auth-visual" aria-label="About CampusFix">
                <div class="auth-brand"><span class="brand-mark">${icon("bolt")}</span><div>CampusFix<small>SMARTER CAMPUS CARE</small></div></div>
                <div class="visual-copy"><span class="eyebrow">A better campus starts here</span>
                    <h1>Small fixes.<br><span>Better days.</span></h1>
                    <p>One simple place to report campus issues, follow every update, and help make your community a little better every day.</p>
                </div>
                <div class="visual-note">Built for students. Powered by your campus community.</div>
            </section>
            <section class="auth-main">
                <div class="auth-form">
                    <div class="auth-mobile-brand"><span class="brand-mark">${icon("bolt")}</span>CampusFix</div>
                    <h2>${registering ? "Create your account" : "Welcome back"}</h2>
                    <p class="auth-subtitle">${registering ? "Join your campus community and help make a difference." : "Sign in to your campus workspace to continue."}</p>
                    <form id="authForm" novalidate>
                        ${registering ? `<div class="mb-3"><label class="form-label" for="authName">Full name</label><div class="field-icon">${icon("user")}<input class="form-control" id="authName" name="name" autocomplete="name" placeholder="Your full name" maxlength="100" required></div></div>` : ""}
                        <div class="mb-3"><label class="form-label" for="authEmail">Email address</label><div class="field-icon">${icon("envelope")}<input class="form-control" id="authEmail" name="email" type="email" autocomplete="email" placeholder="you@college.edu" maxlength="160" required></div></div>
                        <div class="mb-3"><label class="form-label" for="authPassword">Password</label><div class="field-icon">${icon("lock")}<input class="form-control" id="authPassword" name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" placeholder="${registering ? "At least 8 characters" : "Enter your password"}" minlength="${registering ? 8 : 1}" maxlength="72" required></div></div>
                        <button class="btn btn-primary w-100 mt-2" type="submit" id="authSubmit">${registering ? "Create account" : "Sign in"} <span class="ms-1">${icon("chevron")}</span></button>
                    </form>
                    <div class="auth-footer">${registering ? "Already have an account?" : "New to CampusFix?"} <button id="switchAuth">${registering ? "Sign in" : "Create an account"}</button></div>
                    ${registering ? "" : `<div class="demo-box"><div class="demo-box-head"><span>Try a demo account</span><span>${icon("sparkle")} Ready to explore</span></div><div class="demo-options"><button type="button" class="demo-option" data-demo="student@campusfix.edu"><i class="bi bi-mortarboard"></i>Student<span>View your dashboard</span></button><button type="button" class="demo-option" data-demo="admin@campusfix.edu"><i class="bi bi-shield-check"></i>Admin<span>Manage campus issues</span></button></div></div>`}
                </div>
            </section>
        </main>`;

    document.querySelector("#switchAuth").addEventListener("click", () => {
        state.authMode = registering ? "login" : "register";
        renderAuth();
    });
    document.querySelectorAll("[data-demo]").forEach((button) => button.addEventListener("click", () => {
        document.querySelector("#authEmail").value = button.dataset.demo;
        document.querySelector("#authPassword").value = button.dataset.demo.startsWith("admin") ? "Admin@123" : "Student@123";
        document.querySelector("#authEmail").focus();
    }));
    document.querySelector("#authForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const button = document.querySelector("#authSubmit");
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${registering ? "Creating account…" : "Signing in…"}`;
        const values = Object.fromEntries(new FormData(form));
        try {
            if (registering) {
                await api("/api/auth/register", { method: "POST", body: JSON.stringify(values) });
                notify("Your account is ready. Sign in to get started.");
                state.authMode = "login";
                renderAuth();
                document.querySelector("#authEmail").value = values.email;
                return;
            }
            state.user = await api("/api/auth/login", { method: "POST", body: JSON.stringify(values) });
            state.page = "dashboard";
            renderShell();
            await navigate("dashboard");
        } catch (error) {
            notify(error.message, "error");
            button.disabled = false;
            button.innerHTML = `${registering ? "Create account" : "Sign in"} <span class="ms-1">${icon("chevron")}</span>`;
        }
    });
}

function renderShell() {
    const admin = state.user.role === "ADMIN";
    app.innerHTML = `
        <div class="app-shell">
            <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
            <aside class="sidebar" id="sidebar">
                <a class="sidebar-brand text-decoration-none" href="#" data-page="dashboard"><span class="brand-mark">${icon("bolt")}</span>CampusFix</a>
                <div class="sidebar-caption">Workspace</div>
                <button class="side-link" data-page="dashboard">${icon("dashboard")} Overview</button>
                <div class="sidebar-caption">${admin ? "Operations" : "My campus"}</div>
                ${admin
                    ? `<button class="side-link" data-page="management">${icon("management")} Complaint management</button>`
                    : `<button class="side-link" data-page="complaints">${icon("complaints")} My complaints</button><button class="side-link" data-page="submit">${icon("submit")} Report an issue</button>`}
                <div class="sidebar-bottom">
                    ${admin ? `<div class="help-card"><strong>Every report matters</strong><p>Acknowledging issues early helps everyone enjoy a better campus.</p></div>` : `<div class="help-card"><strong>Make a difference ✨</strong><p>Something on campus needs attention? Send it our way and we’ll take it from here.</p></div>`}
                    <div class="profile-row"><div class="avatar">${safe(initials(state.user.name))}</div><div class="profile-text"><strong>${safe(state.user.name)}</strong><span>${admin ? "Campus administrator" : "Student account"}</span></div><button class="icon-button" id="logoutButton" aria-label="Sign out" title="Sign out">${icon("logout")}</button></div>
                </div>
            </aside>
            <main class="main-area">
                <header class="topbar">
                    <div class="breadcrumb-line"><button class="mobile-menu" id="mobileMenu" aria-label="Open menu">${icon("menu")}</button><span class="breadcrumb-root">Workspace</span>${icon("chevron")}<strong id="breadcrumbCurrent">Overview</strong></div>
                    <div class="topbar-right"><span class="topbar-chip">${icon("check")} Campus care, connected</span><span class="icon-circle" aria-label="Connected">${icon("bell")}<span class="live-dot"></span></span><div class="avatar">${safe(initials(state.user.name))}</div></div>
                </header>
                <section id="pageContent" class="page-content"></section>
            </main>
        </div>`;
    document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", (event) => {
        event.preventDefault();
        if (button.dataset.page === "dashboard" && state.page === "dashboard") return;
        navigate(button.dataset.page);
    }));
    document.querySelector("#logoutButton").addEventListener("click", logout);
    document.querySelector("#mobileMenu").addEventListener("click", toggleSidebar);
    document.querySelector("#sidebarBackdrop").addEventListener("click", toggleSidebar);
}

function toggleSidebar() {
    document.querySelector("#sidebar")?.classList.toggle("open");
    document.querySelector("#sidebarBackdrop")?.classList.toggle("show");
}

function activatePage(page) {
    state.page = page;
    const names = { dashboard: "Overview", complaints: "My complaints", submit: "Report an issue", management: "Complaint management", detail: "Complaint details" };
    document.querySelector("#breadcrumbCurrent").textContent = names[page] || "Overview";
    document.querySelectorAll(".side-link").forEach((link) => link.classList.toggle("active", link.dataset.page === page || (page === "detail" && link.dataset.page === "management")));
    document.querySelector("#sidebar")?.classList.remove("open");
    document.querySelector("#sidebarBackdrop")?.classList.remove("show");
}

async function navigate(page) {
    const isAdmin = state.user?.role === "ADMIN";
    if ((page === "management" && !isAdmin) || (page === "submit" && isAdmin)) page = "dashboard";
    activatePage(page);
    const container = document.querySelector("#pageContent");
    if (page === "submit") {
        renderSubmit(container);
        return;
    }
    container.innerHTML = `<div class="loading-screen"><span class="spinner-border" role="status"></span> Loading your campus updates…</div>`;
    const requestId = ++state.requestId;
    try {
        if (isAdmin && page === "dashboard") {
            const [stats, complaints] = await Promise.all([api("/api/admin/stats"), api("/api/complaints")]);
            if (requestId !== state.requestId) return;
            state.complaints = complaints;
            renderDashboard(container, complaints, stats);
        } else if (page === "dashboard" || page === "complaints" || page === "management") {
            const list = await api("/api/complaints");
            if (requestId !== state.requestId) return;
            state.complaints = list;
            if (page === "dashboard") renderDashboard(container, list);
            else renderComplaints(container, list, page === "management");
        } else if (page === "detail") {
            const complaint = await api(`/api/complaints/${state.detailId}`);
            if (requestId !== state.requestId) return;
            renderDetail(container, complaint);
        }
    } catch (error) {
        if (requestId === state.requestId) {
            container.innerHTML = `<div class="panel empty-state"><div class="empty-state-icon">${icon("bi-cloud-exclamation")}</div><strong>We couldn’t load this page</strong><p>${safe(error.message)}</p><button class="btn btn-light-soft" data-retry>Try again</button></div>`;
            container.querySelector("[data-retry]")?.addEventListener("click", () => navigate(page));
        }
    }
}

function pageHeading(title, subtitle, action = "") {
    return `<div class="page-head"><div><h1>${title}</h1><p>${subtitle}</p></div>${action ? `<div class="page-head-actions">${action}</div>` : ""}</div>`;
}

function formatStatus(status) {
    return `<span class="badge-status ${statusClass(status)}">${safe(niceStatus(status))}</span>`;
}

function formatPriority(priority) {
    return `<span class="priority-mark ${safe(priority.toLowerCase())}"><span class="priority-dot"></span>${safe(nicePriority(priority))}</span>`;
}

function categoryOptions(selected = "") {
    return Object.entries(categoryLabels).map(([key, label]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${safe(label)}</option>`).join("");
}

function statusOptions(selected = "") {
    return Object.entries(statusLabels).map(([key, label]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${safe(label)}</option>`).join("");
}

function priorityOptions(selected = "") {
    return Object.entries(priorityLabels).map(([key, label]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${safe(label)}</option>`).join("");
}

function complaintRows(complaints, admin) {
    if (!complaints.length) return `<tr><td colspan="${admin ? 7 : 6}"><div class="empty-state"><div class="empty-state-icon">${icon("complaints")}</div><strong>${admin ? "No campus issues match these filters" : "No complaints yet"}</strong><p>${admin ? "Try adjusting your filters." : "When you submit your first report, you can track its progress here."}</p>${!admin ? `<button class="btn btn-primary" data-page="submit"><i class="bi bi-plus-lg me-1"></i>Report an issue</button>` : ""}</div></td></tr>`;
    return complaints.map((c) => `
        <tr>
            ${admin ? `<td><div class="student-cell"><span class="mini-avatar">${safe(initials(c.studentName))}</span>${safe(c.studentName)}</div></td>` : ""}
            <td><button class="btn p-0 border-0 text-start" data-detail="${c.id}"><span class="issue-name">${safe(c.title)}</span><span class="issue-code">${safe(c.complaintCode)}</span></button></td>
            <td class="category-cell">${safe(niceCategory(c.category))}</td>
            <td>${formatPriority(c.priority)}</td><td>${formatStatus(c.status)}</td>
            <td class="text-nowrap">${safe(shortDate(c.createdAt))}</td>
            <td><button class="table-action" title="View complaint details" aria-label="View ${safe(c.complaintCode)}" data-detail="${c.id}">${icon("arrow")}</button></td>
        </tr>`).join("");
}

function renderComplaints(container, complaints, admin) {
    state.filters = { q: "", status: "", category: "", priority: "" };
    const title = admin ? "Complaint management" : "My complaints";
    const subtitle = admin ? "A clear view of every issue raised across your campus." : "All your reports, their status, and the latest progress.";
    const action = admin ? "" : `<button class="btn btn-primary" data-page="submit"><i class="bi bi-plus-lg me-1"></i>Report an issue</button>`;
    container.innerHTML = `${pageHeading(title, subtitle, action)}
        <div class="filter-panel">
            <div class="search-control">${icon("search")}<input class="form-control" id="filterSearch" placeholder="${admin ? "Search by issue, student, or ID…" : "Search your reports…"}" aria-label="Search complaints"></div>
            <select class="form-select" id="filterStatus" aria-label="Filter by status"><option value="">All statuses</option>${statusOptions()}</select>
            <select class="form-select" id="filterCategory" aria-label="Filter by category"><option value="">All categories</option>${categoryOptions()}</select>
            <select class="form-select" id="filterPriority" aria-label="Filter by priority"><option value="">All priorities</option>${priorityOptions()}</select>
            <span class="filter-caption" id="resultCount">${complaints.length} reports</span>
        </div>
        <div class="panel">
            <div class="table-wrap"><table class="table"><thead><tr>${admin ? "<th>REPORTED BY</th>" : ""}<th>ISSUE</th><th>CATEGORY</th><th>PRIORITY</th><th>STATUS</th><th>SUBMITTED</th><th></th></tr></thead><tbody id="complaintRows">${complaintRows(complaints, admin)}</tbody></table></div>
            <div class="table-note">Showing the most recently submitted reports first.</div>
        </div>`;
    const search = document.querySelector("#filterSearch");
    const update = () => {
        state.filters = {
            q: search.value.trim().toLowerCase(),
            status: document.querySelector("#filterStatus").value,
            category: document.querySelector("#filterCategory").value,
            priority: document.querySelector("#filterPriority").value
        };
        const filtered = complaints.filter((c) =>
            (!state.filters.q || [c.title, c.complaintCode, c.studentName, c.studentEmail].filter(Boolean).some((value) => value.toLowerCase().includes(state.filters.q))) &&
            (!state.filters.status || c.status === state.filters.status) &&
            (!state.filters.category || c.category === state.filters.category) &&
            (!state.filters.priority || c.priority === state.filters.priority));
        document.querySelector("#complaintRows").innerHTML = complaintRows(filtered, admin);
        document.querySelector("#resultCount").textContent = `${filtered.length} report${filtered.length === 1 ? "" : "s"}`;
    };
    search.addEventListener("input", update);
    ["#filterStatus", "#filterCategory", "#filterPriority"].forEach((selector) => document.querySelector(selector).addEventListener("change", update));
    attachPageButtons(container);
    attachDetailButtons(container);
}

function renderDashboard(container, complaints, stats = null) {
    const admin = Boolean(stats);
    const total = admin ? stats.total : complaints.length;
    const resolved = admin ? stats.resolved : complaints.filter((c) => c.status === "RESOLVED").length;
    const progress = admin ? stats.inProgress : complaints.filter((c) => c.status === "IN_PROGRESS").length;
    const pending = admin ? stats.pending : complaints.filter((c) => c.status === "PENDING" || c.status === "UNDER_REVIEW").length;
    const high = admin ? stats.highPriority : complaints.filter((c) => c.priority === "HIGH" && c.status !== "RESOLVED" && c.status !== "REJECTED").length;
    const statsCards = [
        { label: "Total reports", value: total, icon: "clipboard", tone: "tone-blue", foot: admin ? `${stats.lastSevenDays} submitted this week` : "Reports you've shared with campus" },
        { label: "Awaiting attention", value: pending, icon: "clock", tone: "tone-amber", foot: "Pending or under review" },
        { label: admin ? "In progress" : "Being worked on", value: progress, icon: "review", tone: "tone-purple", foot: admin ? "Issues currently being addressed" : "Our team is on it" },
        { label: "Successfully resolved", value: resolved, icon: "check", tone: "tone-green", foot: "Campus improvements delivered" }
    ];
    const days = [];
    for (let offset = 6; offset >= 0; offset--) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - offset);
        const count = complaints.filter((c) => new Date(c.createdAt).toDateString() === date.toDateString()).length;
        const resolvedCount = complaints.filter((c) => c.history.some((entry) =>
            entry.status === "RESOLVED" && new Date(entry.changedAt).toDateString() === date.toDateString())).length;
        days.push({ label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date), count, resolvedCount });
    }
    const maxCount = Math.max(1, ...days.flatMap((day) => [day.count, day.resolvedCount]));
    const activeIssues = [...complaints].filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length;
    const recent = [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    container.innerHTML = `
        ${pageHeading(admin ? "Campus overview" : `Good ${greeting()}, ${safe(state.user.name.split(" ")[0])} 👋`, admin ? "Here’s what’s happening across your campus right now." : "Here’s the latest on making your campus a better place.", admin ? `<button class="btn btn-primary" data-page="management"><i class="bi bi-kanban me-1"></i>Manage reports</button>` : `<button class="btn btn-primary" data-page="submit"><i class="bi bi-plus-lg me-1"></i>Report an issue</button>`)}
        <div class="stat-grid">${statsCards.map((item) => `<article class="stat-card"><div class="stat-top"><span class="stat-title">${item.label}</span><span class="stat-icon ${item.tone}">${icon(item.icon)}</span></div><div class="stat-value">${item.value}</div><div class="stat-foot">${item.foot}</div></article>`).join("")}</div>
        <div class="dashboard-grid">
            <section class="panel"><div class="panel-heading"><div><h2>Reports over time</h2><p>A snapshot of new reports in the last seven days</p></div><select class="form-select" id="chartPeriod" aria-label="Chart period"><option>Last 7 days</option></select></div>
                <div class="chart-area"><div class="bar-chart">${days.map((day) => `<div class="chart-day" title="${day.count} new · ${day.resolvedCount} resolved"><div class="bar-stack"><span class="bar" style="height:${Math.max(3, (day.count / maxCount) * 100)}%"></span><span class="bar accent" style="height:${Math.max(3, (day.resolvedCount / maxCount) * 100)}%"></span></div><span class="chart-label">${day.label}</span></div>`).join("")}</div>
                <div class="chart-legend"><span><i class="legend-dot"></i>New reports</span><span><i class="legend-dot accent"></i>Resolved</span></div></div>
            </section>
            <section class="panel"><div class="panel-heading"><div><h2>Issue status</h2><p>Where things stand today</p></div><span class="stat-icon tone-blue">${icon("chart")}</span></div>
                <div class="status-list">
                    ${[["PENDING", admin ? stats.pending : complaints.filter((c) => c.status === "PENDING").length, "pending"], ["UNDER_REVIEW", admin ? stats.underReview : complaints.filter((c) => c.status === "UNDER_REVIEW").length, "review"], ["IN_PROGRESS", progress, "progress"], ["RESOLVED", resolved, "resolved"], ...(admin ? [["REJECTED", stats.rejected, "rejected"]] : [])].map(([status, count, cls]) => `<div class="status-row"><span class="status-label"><i class="status-indicator ${cls}"></i>${niceStatus(status)}</span><span class="status-count">${count}</span></div>`).join("")}
                    <div class="status-row"><span class="status-label">${icon("warning", "text-danger")} High priority, still active</span><span class="status-count">${high}</span></div>
                </div>
            </section>
        </div>
        <section class="panel">
            <div class="section-heading"><h2>${admin ? "Recently reported issues" : "Your recent reports"}</h2><button class="btn btn-link p-0 text-decoration-none" data-page="${admin ? "management" : "complaints"}">View all ${icon("arrow")}</button></div>
            <div class="table-wrap"><table class="table"><thead><tr>${admin ? "<th>REPORTED BY</th>" : ""}<th>ISSUE</th><th>CATEGORY</th><th>PRIORITY</th><th>STATUS</th><th>SUBMITTED</th><th></th></tr></thead><tbody>${complaintRows(recent, admin)}</tbody></table></div>
            ${recent.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">${icon("sparkle")}</div><strong>${admin ? "It’s quiet on campus" : "Let’s get started"}</strong><p>${admin ? "New campus reports will appear here as soon as they're submitted." : "Your first report can help make campus better for everyone."}</p>${!admin ? `<button class="btn btn-primary" data-page="submit"><i class="bi bi-plus-lg me-1"></i>Report an issue</button>` : ""}</div>` : ""}
        </section>`;
    attachPageButtons(container);
    attachDetailButtons(container);
}

function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

function renderSubmit(container) {
    container.innerHTML = `
        ${pageHeading("Report an issue", "A few details are all we need to get the right people on it.", `<button class="btn btn-light-soft" id="cancelReport">${icon("back")}<span class="ms-1">Back</span></button>`)}
        <section class="panel form-panel">
            <div class="form-section-title">Tell us what’s going on</div><div class="form-section-subtitle">Your report goes directly to your campus facilities team.</div>
            <form id="complaintForm">
                <div class="mb-3"><label class="form-label" for="complaintTitle">What needs fixing?</label><input class="form-control" id="complaintTitle" name="title" placeholder="e.g. Broken lights in the study lounge" maxlength="140" required><div class="field-hint">A short, clear title helps us understand your issue at a glance.</div></div>
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label" for="complaintCategory">Issue category</label><select class="form-select" id="complaintCategory" name="category" required><option value="" selected disabled>Choose a category</option>${categoryOptions()}</select></div>
                    <div class="col-md-6"><label class="form-label" for="complaintPriority">How urgent is it?</label><select class="form-select" id="complaintPriority" name="priority" required><option value="LOW">Low — whenever possible</option><option value="MEDIUM" selected>Medium — needs attention soon</option><option value="HIGH">High — urgent issue</option></select></div>
                </div>
                <div class="mt-3"><label class="form-label" for="complaintLocation">Where on campus?</label><input class="form-control" id="complaintLocation" name="location" placeholder="Building, floor, room, or a nearby landmark" maxlength="200" required></div>
                <div class="mt-3"><label class="form-label" for="complaintDescription">Describe what’s happening</label><textarea class="form-control" id="complaintDescription" name="description" placeholder="Tell us what you noticed and when it started…" maxlength="4000" required></textarea><div class="field-hint">More detail helps our team resolve things faster. Please include anything useful.</div></div>
                <div class="form-footer"><button type="button" class="btn btn-light-soft" id="discardReport">Cancel</button><button type="submit" class="btn btn-primary" id="submitReport">${icon("send")}<span class="ms-1">Submit report</span></button></div>
            </form>
        </section>`;
    for (const id of ["cancelReport", "discardReport"]) document.querySelector(`#${id}`).addEventListener("click", () => navigate("dashboard"));
    document.querySelector("#complaintForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const button = document.querySelector("#submitReport");
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Sending report…`;
        try {
            const complaint = await api("/api/complaints", {
                method: "POST",
                body: JSON.stringify(Object.fromEntries(new FormData(form)))
            });
            state.detailId = complaint.id;
            notify(`Your report ${complaint.complaintCode} has been received.`);
            await navigate("detail");
        } catch (error) {
            notify(error.message, "error");
            button.disabled = false;
            button.innerHTML = `${icon("send")}<span class="ms-1">Submit report</span>`;
        }
    });
}

function renderDetail(container, complaint) {
    const admin = state.user.role === "ADMIN";
    const history = [...complaint.history].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    container.innerHTML = `
        ${pageHeading("Complaint details", "Follow updates and see what’s happening with this report.", `<button class="btn btn-light-soft" id="backToList">${icon("back")}<span class="ms-1">Back to ${admin ? "management" : "my complaints"}</span></button>`)}
        <div class="details-grid">
            <div class="d-grid gap-3">
                <section class="panel">
                    <div class="p-3 p-md-4">
                        <div class="d-flex flex-wrap gap-2 align-items-center">${formatStatus(complaint.status)}${formatPriority(complaint.priority)}<span class="detail-code ms-auto">${safe(complaint.complaintCode)}</span></div>
                        <h2 class="detail-title">${safe(complaint.title)}</h2>
                        <p class="detail-description">${safe(complaint.description)}</p>
                        <div class="detail-meta">
                            <div><div class="meta-label">${icon("pin")} Location</div><div class="meta-value">${safe(complaint.location)}</div></div>
                            <div><div class="meta-label">${icon("category")} Category</div><div class="meta-value">${safe(niceCategory(complaint.category))}</div></div>
                            <div><div class="meta-label">${icon("calendar")} Submitted</div><div class="meta-value">${safe(dateTime(complaint.createdAt))}</div></div>
                            ${admin ? `<div><div class="meta-label">${icon("user")} Reported by</div><div class="meta-value">${safe(complaint.studentName)}<span class="d-block fw-normal text-secondary">${safe(complaint.studentEmail)}</span></div></div>` : ""}
                        </div>
                    </div>
                    ${complaint.resolutionRemarks ? `<div class="mx-3 mx-md-4 mb-4 p-3 rounded-3 bg-light"><div class="meta-label">${icon("check")} Resolution update</div><div class="meta-value fw-normal mt-1">${safe(complaint.resolutionRemarks)}</div></div>` : ""}
                </section>
                <section class="panel"><div class="section-heading"><h2>Progress history</h2><span class="text-secondary small">${history.length} update${history.length === 1 ? "" : "s"}</span></div>
                    ${history.length ? `<div class="history-list">${history.map((item) => `<article class="history-item"><div class="d-flex justify-content-between gap-2 align-items-center"><span class="history-status">${formatStatus(item.status)}</span><span class="history-time">${safe(dateTime(item.changedAt))}</span></div>${item.remarks ? `<div class="history-remark">${safe(item.remarks)}</div>` : ""}<div class="history-time">Updated by ${safe(item.changedBy)}</div></article>`).join("")}</div>` : `<div class="empty-state"><p>Progress updates will appear here.</p></div>`}
                </section>
            </div>
            ${admin ? `<aside class="panel align-self-start"><div class="section-heading"><h2>Update this report</h2></div>
                    <form id="statusForm" class="admin-action pt-0"><label class="form-label" for="updateStatus">Status</label><select class="form-select mb-3" id="updateStatus" name="status">${statusOptions(complaint.status)}</select><label class="form-label" for="resolutionRemarks">Update for the student <span class="fw-normal text-secondary">(optional)</span></label><textarea class="form-control mb-3" id="resolutionRemarks" name="remarks" rows="3" maxlength="2000" placeholder="Add a note about progress or next steps…">${safe(complaint.resolutionRemarks || "")}</textarea><button class="btn btn-primary w-100" type="submit" id="saveStatus">Save status update</button></form>
                    <form id="priorityForm" class="admin-action"><label class="form-label" for="updatePriority">Priority level</label><select class="form-select mb-3" id="updatePriority" name="priority">${priorityOptions(complaint.priority)}</select><button class="btn btn-light-soft w-100" type="submit">Update priority</button></form>
                </aside>` : ""}
        </div>`;
    document.querySelector("#backToList").addEventListener("click", () => navigate(admin ? "management" : "complaints"));
    if (admin) {
        document.querySelector("#statusForm").addEventListener("submit", (event) => updateComplaint(event, `/api/admin/complaints/${complaint.id}/status`, () => navigate("detail"), "Status update saved."));
        document.querySelector("#priorityForm").addEventListener("submit", (event) => updateComplaint(event, `/api/admin/complaints/${complaint.id}/priority`, () => navigate("detail"), "Priority updated."));
    }
}

async function updateComplaint(event, endpoint, refresh, successMessage) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const oldContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Saving…`;
    try {
        await api(endpoint, { method: "PATCH", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        notify(successMessage);
        await refresh();
    } catch (error) {
        notify(error.message, "error");
        button.disabled = false;
        button.innerHTML = oldContent;
    }
}

function attachDetailButtons(container) {
    container.querySelectorAll("[data-detail]").forEach((button) => button.addEventListener("click", () => {
        state.detailId = button.dataset.detail;
        navigate("detail");
    }));
}

function attachPageButtons(container) {
    container.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.page)));
}

async function logout() {
    try {
        await api("/api/auth/logout", { method: "POST" });
        state.user = null;
        state.page = "dashboard";
        state.authMode = "login";
        renderAuth();
        notify("You’ve been signed out.");
    } catch (error) {
        notify(error.message, "error");
    }
}

loadCurrentUser();
