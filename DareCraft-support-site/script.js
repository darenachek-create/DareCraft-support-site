document.addEventListener("DOMContentLoaded", () => {
    const yearEl = document.getElementById("year");
    const scrollProgress = document.getElementById("scrollProgress");
    const menuToggle = document.getElementById("menuToggle");
    const navigation = document.getElementById("navigation");
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));

    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    const updateProgress = () => {
        if (!scrollProgress) return;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0;
        scrollProgress.style.width = `${ratio}%`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    if (menuToggle && navigation) {
        menuToggle.addEventListener("click", () => {
            const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!isOpen));
            navigation.classList.toggle("is-open", !isOpen);
        });

        navLinks.forEach((link) => {
            link.addEventListener("click", () => {
                menuToggle.setAttribute("aria-expanded", "false");
                navigation.classList.remove("is-open");
            });
        });
    }

    // Пустой список по умолчанию — без выдуманных карточек
    const STORAGE_KEY = "darecraft_user_reports_v2";

    const loadReports = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const saveReports = (list) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {
            // Игнорируем ошибку переполнения storage
        }
    };

    let reports = loadReports();
    let currentFilter = "all";

    const form = document.getElementById("supportReportForm");
    const authorInput = document.getElementById("ticketAuthor");
    const categorySelect = document.getElementById("ticketCategory");
    const versionInput = document.getElementById("bugVersion");
    const platformSelect = document.getElementById("bugPlatform");
    const whatInput = document.getElementById("bugWhatHappened");
    const stepsInput = document.getElementById("bugSteps");
    const previewEl = document.getElementById("reportPreview");
    const feedbackEl = document.getElementById("supportFeedback");
    const fillSampleBtn = document.getElementById("fillSampleBtn");
    const downloadReportBtn = document.getElementById("downloadReportBtn");
    const ticketIdBadge = document.getElementById("ticketIdBadge");
    const communityGrid = document.getElementById("communityGrid");
    const communitySection = document.getElementById("community-bugs");
    const countAllEl = document.getElementById("countAll");
    const filterButtons = Array.from(document.querySelectorAll(".pill-btn"));

    const generateCode = () => `DC-${Math.floor(100 + Math.random() * 900)}`;
    let nextTicketCode = generateCode();

    if (ticketIdBadge) {
        ticketIdBadge.textContent = `#${nextTicketCode}`;
    }

    const buildReportText = () => {
        const author = authorInput?.value.trim() || "Анонимный игрок";
        const category = categorySelect?.value || "Баг в игре";
        const version = versionInput?.value.trim() || "0.1";
        const platform = platformSelect?.value || "ПК (Windows)";
        const what = whatInput?.value.trim() || "(не заполнено)";
        const steps = stepsInput?.value.trim() || "(не указано)";

        return [
            `DareCraft поддержка [${nextTicketCode}]`,
            `Автор: ${author}`,
            `Тип: ${category}`,
            `Версия сборки: ${version}`,
            `Устройство: ${platform}`,
            `Описание: ${what}`,
            `Как повторить: ${steps}`
        ].join("\n");
    };

    const syncPreview = () => {
        if (previewEl) {
            previewEl.textContent = buildReportText();
        }
    };

    const escapeHtml = (str) => String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const renderCommunityReports = () => {
        if (!communityGrid) return;
        if (countAllEl) {
            countAllEl.textContent = String(reports.length);
        }

        const filtered = currentFilter === "all"
            ? reports
            : reports.filter((item) => item.category === currentFilter);

        communityGrid.innerHTML = "";

        if (filtered.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = currentFilter === "all"
                ? "Пока нет отправленных обращений. Заполните форму выше и нажмите «Отправить»."
                : `В категории «${currentFilter}» пока нет отправленных обращений.`;
            communityGrid.appendChild(empty);
            return;
        }

        filtered.forEach((item) => {
            const card = document.createElement("article");
            card.className = `bug-report-card${item.isNew ? " is-new" : ""}`;

            const stepsBlock = item.steps && item.steps !== "(не указано)"
                ? `<div class="bug-card-steps"><strong>Как повторить:</strong> ${escapeHtml(item.steps)}</div>`
                : "";

            card.innerHTML = `
                <div class="bug-card-top">
                    <span class="bug-code">#${escapeHtml(item.id)} · ${escapeHtml(item.category)}</span>
                    <span class="bug-status-pill">${escapeHtml(item.status || "Новое")}</span>
                </div>
                <p class="bug-card-title">${escapeHtml(item.description)}</p>
                ${stepsBlock}
                <div class="bug-card-footer">
                    <span>${escapeHtml(item.author)} · v${escapeHtml(item.version)} · ${escapeHtml(item.platform)}</span>
                    <button type="button" class="upvote-btn${item.voted ? " is-voted" : ""}" data-id="${escapeHtml(item.id)}" aria-label="Подтвердить">
                        ▲ <span>${Number(item.votes) || 1}</span>
                    </button>
                </div>
            `;

            const voteBtn = card.querySelector(".upvote-btn");
            voteBtn?.addEventListener("click", () => {
                if (item.voted) return;
                item.voted = true;
                item.votes = (Number(item.votes) || 1) + 1;
                saveReports(reports);
                renderCommunityReports();
            });

            communityGrid.appendChild(card);
        });
    };

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            currentFilter = btn.dataset.filter || "all";
            filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
            renderCommunityReports();
        });
    });

    [authorInput, categorySelect, versionInput, platformSelect, whatInput, stepsInput].forEach((el) => {
        el?.addEventListener("input", syncPreview);
        el?.addEventListener("change", syncPreview);
    });

    fillSampleBtn?.addEventListener("click", () => {
        if (categorySelect) categorySelect.value = "Баг в игре";
        if (versionInput) versionInput.value = "0.1";
        if (whatInput) whatInput.value = "Ошибка в текстурах они прозрачные";
        if (stepsInput) stepsInput.value = "Просто зайти в мир";
        syncPreview();
        if (feedbackEl) {
            feedbackEl.textContent = "Пример подставлен — нажмите «Отправить», чтобы добавить в список.";
        }
    });

    downloadReportBtn?.addEventListener("click", () => {
        const text = buildReportText();
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `DareCraft-Support-${nextTicketCode}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        if (feedbackEl) {
            feedbackEl.textContent = `Файл DareCraft-Support-${nextTicketCode}.txt сохранён!`;
        }
    });

    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const descriptionText = whatInput?.value.trim() || "";
        if (!descriptionText) {
            if (feedbackEl) {
                feedbackEl.textContent = "Пожалуйста, опишите проблему или идею перед отправкой.";
            }
            whatInput?.focus();
            return;
        }

        const newReport = {
            id: nextTicketCode,
            author: authorInput?.value.trim() || "Анонимный игрок",
            category: categorySelect?.value || "Баг в игре",
            version: versionInput?.value.trim() || "0.1",
            platform: platformSelect?.value || "ПК (Windows)",
            description: descriptionText,
            steps: stepsInput?.value.trim() || "",
            status: "Новое обращение",
            votes: 1,
            voted: true,
            isNew: true
        };

        reports.forEach((r) => { r.isNew = false; });
        reports.unshift(newReport);
        saveReports(reports);

        currentFilter = "all";
        filterButtons.forEach((b) => b.classList.toggle("active", b.dataset.filter === "all"));
        renderCommunityReports();

        if (feedbackEl) {
            feedbackEl.textContent = `Отчёт #${newReport.id} отправлен и добавлен в раздел «Баги, которые написали другие пользователи»!`;
        }

        if (whatInput) whatInput.value = "";
        if (stepsInput) stepsInput.value = "";
        nextTicketCode = generateCode();
        if (ticketIdBadge) ticketIdBadge.textContent = `#${nextTicketCode}`;
        syncPreview();

        communitySection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    syncPreview();
    renderCommunityReports();
});
