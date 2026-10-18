
const attendanceForm = document.getElementById("attendance-form");
const conductedInput = document.getElementById("conducted");
const attendedInput = document.getElementById("attended");
const formError = document.getElementById("form-error");
const results = document.getElementById("results");
const progressMeter = document.getElementById("progress-meter");
const progressRing = document.querySelector(".ring-progress");
const ringCircumference = 2 * Math.PI * 58;
const roastCard = document.getElementById("roast-card");
const roastEmoji = document.getElementById("roast-emoji");
const roastKicker = document.getElementById("roast-kicker");
const roastHeadline = document.getElementById("roast-headline");
const roastMessage = document.getElementById("roast-message");
const roastWarningIcon = document.getElementById("roast-warning-icon");
const promiseButton = document.getElementById("promise-button");
const promiseConfirmation = document.getElementById("promise-confirmation");
const subjectForm = document.getElementById("subject-form");
const subjectNameInput = document.getElementById("subject-name");
const subjectConductedInput = document.getElementById("subject-conducted");
const subjectAttendedInput = document.getElementById("subject-attended");
const subjectList = document.getElementById("subject-list");
const subjectCount = document.getElementById("subject-count");
const subjectFeedback = document.getElementById("subject-feedback");
const subjectSubmit = document.getElementById("subject-submit");
const subjectCancel = document.getElementById("subject-cancel");
const historyList = document.getElementById("history-list");
const historyFeedback = document.getElementById("history-feedback");
const clearHistoryButton = document.getElementById("clear-history");
const subjectsStorageKey = "menoozzzz-attendance-subjects-v1";
const historyStorageKey = "menoozzzz-attendance-history-v1";
const calendarStorageKey = "menoozzzz-attendance-calendar-v1";
const themeStorageKey = "menoozzzz-attendance-theme-v1";
const questStorageKey = "menoozzzz-attendance-quest-v1";
const QUEST_RULES = Object.freeze({
    xpPerAttendedSession: 10,
    weeklyQuestBonusXp: 30,
    achievementBonusXp: 25,
    targetAttendancePercent: 75,
    attendThreeQuestGoal: 3,
    logSessionsQuestGoal: 5,
    weeklyTargetMinimumSessions: 4,
    levelThresholds: [0, 100, 250],
    laterLevelStepXp: 200
});
const ACHIEVEMENT_DEFINITIONS = [
    { id: "first-step", title: "First Step", description: "Record your first attended calendar session." },
    { id: "three-in-a-row", title: "Three in a Row", description: "Attend three consecutive recorded class sessions." },
    { id: "perfect-week", title: "Perfect Week", description: "Confirm a week's schedule is fully logged and attend every recorded class that week." },
    { id: "back-on-track", title: "Back on Track", description: "Move from below 75% to at least 75% in your dated calendar record." },
    { id: "subject-champion", title: "Subject Champion", description: "Reach 75% attendance or higher in a saved subject." }
];
const dashboardEmpty = document.getElementById("dashboard-empty");
const dashboardContent = document.getElementById("dashboard-content");
const dashboardSubjectList = document.getElementById("dashboard-subject-list");
const dashboardSubjectEmpty = document.getElementById("dashboard-subject-empty");
const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthLabel = document.getElementById("calendar-month-label");
const calendarRecordForm = document.getElementById("calendar-record-form");
const calendarAttendedInput = document.getElementById("calendar-attended");
const calendarMissedInput = document.getElementById("calendar-missed");
const calendarFeedback = document.getElementById("calendar-feedback");
const calendarDeleteButton = document.getElementById("calendar-delete");
const plannerForm = document.getElementById("planner-form");
const plannerTargetInput = document.getElementById("planner-target");
const plannerAttendInput = document.getElementById("planner-attend");
const plannerMissInput = document.getElementById("planner-miss");
const plannerResults = document.getElementById("planner-results");
const plannerApplyButton = document.getElementById("planner-apply");
const plannerFeedback = document.getElementById("planner-feedback");
const reportFeedback = document.getElementById("report-feedback");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");
const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let subjects = readStoredArray(subjectsStorageKey).filter(isValidSubject);
let attendanceHistory = readStoredArray(historyStorageKey).filter(isValidHistoryEntry).slice(0, 5);
let calendarRecords = readStoredValue(calendarStorageKey, {});
let questSettings = cleanQuestSettings(readStoredValue(questStorageKey, {}));
let editingSubjectId = null;
let plannerPreview = null;
let nextSnapshotSource = "manual";
let percentageAnimationFrame = 0;
let pointerMotionFrame = 0;
let entrancePlayed = false;
const today = new Date();
let calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedCalendarDate = dateKey(today);
const roastMessages = {
    below: [
        "Rey babu 😭 musukoni college ki vellu ra!",
        "75% kuda leda ra ayya? 😂 Intlo kurchunte attendance raadhu ra!",
        "College ki velladaniki ticket book cheyyala enti ra? 🚌🤣",
        "Nee attendance chusthe HOD kuda shock avutharu ra! 💀",
        "Rey legenduu, bunk kottadam aapu ra babu! 🏃‍♂️📚",
        "Attendance danger zone lo undhi ra ayya! Phone pakkana petti college ki vellu! 🚨😂",
        "Inka bunk kodithe semester ki tata bye bye cheppalsosthadhi ra! 💀📉"
    ],
    exact: [
        "75% exact ga undhi ra! Inka overaction vaddu 😂",
        "Bunk kottav ante attendance direct ga down! Jagrattha ra ayya! ⚠️",
        "Border lo bathukuthunnav ra babu! 😭📚"
    ],
    above: [
        "Orey topperuu! Attendance maintain chesthunnav ga! 😎🔥",
        "Abba! Manchi pillodivi ayipoyav ra! 😂👏",
        "Attendance bagundhi, kaani mari overconfidence vaddu ra! 😏📚",
        "HOD tho safe zone lo unnav ra babu! 🥳"
    ]
};
const lastRoastIndex = { below: -1, exact: -1, above: -1 };

function chooseRoast(category) {
    const messages = roastMessages[category];
    let index = Math.floor(Math.random() * messages.length);
    if (messages.length > 1 && index === lastRoastIndex[category]) {
        index = (index + 1) % messages.length;
    }
    lastRoastIndex[category] = index;
    return messages[index];
}

function readStoredArray(key) {
    try {
        const storedValue = localStorage.getItem(key);
        const parsedValue = storedValue ? JSON.parse(storedValue) : [];
        return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
        return [];
    }
}

function readStoredValue(key, fallback) {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : fallback;
    } catch {
        return fallback;
    }
}

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function animateAttendancePercentage(targetValue) {
    const valueElement = document.getElementById("percentage-value");
    window.cancelAnimationFrame(percentageAnimationFrame);
    const startingValue = Number.parseFloat(valueElement.textContent) || 0;
    if (reducedMotionPreference.matches || document.hidden) {
        valueElement.textContent = `${targetValue.toFixed(2)}%`;
        return;
    }

    const startTime = performance.now();
    const duration = 680;
    const animateFrame = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = 1 - (1 - progress) ** 3;
        const currentValue = startingValue + (targetValue - startingValue) * easedProgress;
        valueElement.textContent = `${currentValue.toFixed(2)}%`;
        if (progress < 1) percentageAnimationFrame = window.requestAnimationFrame(animateFrame);
    };
    percentageAnimationFrame = window.requestAnimationFrame(animateFrame);
}

function startMotionExperience() {
    if (reducedMotionPreference.matches) return;

    const pageShell = document.querySelector(".page-shell");
    const overview = document.getElementById("overview");
    document.body.classList.add("motion-enabled");

    const playEntrance = () => {
        if (document.hidden || entrancePlayed) return;
        entrancePlayed = true;
        window.requestAnimationFrame(() => {
            if (document.hidden) return;
            pageShell.classList.add("is-entering");
            overview.classList.add("is-scanning");
        });
        window.setTimeout(() => {
            pageShell.classList.remove("is-entering");
            overview.classList.remove("is-scanning");
        }, 1050);
    };

    const updateVisibility = () => {
        document.body.classList.toggle("motion-paused", document.hidden);
        if (document.hidden) {
            window.cancelAnimationFrame(pointerMotionFrame);
            pageShell.classList.remove("is-entering");
            overview.classList.remove("is-scanning");
        } else {
            playEntrance();
        }
    };
    document.addEventListener("visibilitychange", updateVisibility);
    updateVisibility();

    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener("pointermove", (event) => {
            if (document.hidden || event.pointerType !== "mouse") return;
            if (pointerMotionFrame) window.cancelAnimationFrame(pointerMotionFrame);
            pointerMotionFrame = window.requestAnimationFrame(() => {
                document.body.style.setProperty("--pointer-x", `${event.clientX}px`);
                document.body.style.setProperty("--pointer-y", `${event.clientY}px`);
            });
        }, { passive: true });
    }

    reducedMotionPreference.addEventListener("change", (event) => {
        if (!event.matches) return;
        document.body.classList.remove("motion-enabled", "motion-paused");
        pageShell.classList.remove("is-entering");
        overview.classList.remove("is-scanning");
        window.cancelAnimationFrame(pointerMotionFrame);
        window.cancelAnimationFrame(percentageAnimationFrame);
        document.getElementById("percentage-value").textContent = `${Number.parseFloat(document.getElementById("percentage-value").textContent || "0").toFixed(2)}%`;
    });
}

function isValidDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === value;
}

function cleanCalendarRecords(records) {
    if (!records || typeof records !== "object" || Array.isArray(records)) return {};
    return Object.fromEntries(Object.entries(records).filter(([key, record]) =>
        isValidDateKey(key) && record &&
        Number.isSafeInteger(record.attended) && record.attended >= 0 &&
        Number.isSafeInteger(record.missed) && record.missed >= 0 &&
        record.attended + record.missed > 0
    ));
}

function cleanQuestSettings(settings) {
    const confirmedWeeks = settings && settings.schemaVersion === 1 && Array.isArray(settings.confirmedWeeks)
        ? settings.confirmedWeeks.filter((week) => isValidDateKey(week) && mondayWeekKey(week) === week)
        : [];
    return { schemaVersion: 1, confirmedWeeks: [...new Set(confirmedWeeks)] };
}

function mondayWeekKey(key) {
    const date = new Date(`${key}T00:00:00`);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return dateKey(date);
}

function currentWeekKey() {
    return mondayWeekKey(dateKey(new Date()));
}

function weekLabel(weekKey) {
    const start = new Date(`${weekKey}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function getCalendarTotals(records = calendarRecords) {
    return Object.entries(records).reduce((totals, [, record]) => ({
        attended: totals.attended + record.attended,
        missed: totals.missed + record.missed,
        conducted: totals.conducted + record.attended + record.missed
    }), { attended: 0, missed: 0, conducted: 0 });
}

function getWeeklyTotals(weekKey, records = calendarRecords) {
    return Object.entries(records)
        .filter(([key]) => mondayWeekKey(key) === weekKey)
        .reduce((totals, [, record]) => ({
            attended: totals.attended + record.attended,
            missed: totals.missed + record.missed,
            conducted: totals.conducted + record.attended + record.missed
        }), { attended: 0, missed: 0, conducted: 0 });
}

function getRecordedStreaks(records = calendarRecords) {
    const datedRecords = Object.entries(records).sort(([left], [right]) => left.localeCompare(right));
    let run = 0;
    let best = 0;

    datedRecords.forEach(([, record]) => {
        if (record.missed > 0) {
            run = 0;
            return;
        }
        run += record.attended;
        best = Math.max(best, run);
    });

    return { current: run, best, datedRecordCount: datedRecords.length };
}

function buildWeeklyQuests(totals) {
    const completedTarget = totals.conducted >= QUEST_RULES.weeklyTargetMinimumSessions &&
        4n * BigInt(totals.attended) >= 3n * BigInt(totals.conducted);
    return [
        {
            id: "attend-three",
            title: `Attend ${QUEST_RULES.attendThreeQuestGoal} recorded classes`,
            description: "Every attended session here must be entered in the calendar.",
            progress: Math.min(totals.attended, QUEST_RULES.attendThreeQuestGoal),
            goal: QUEST_RULES.attendThreeQuestGoal,
            detail: `${totals.attended} attended this week`,
            complete: totals.attended >= QUEST_RULES.attendThreeQuestGoal
        },
        {
            id: "log-five",
            title: `Log ${QUEST_RULES.logSessionsQuestGoal} class sessions`,
            description: "Record attended or missed classes; no schedule is assumed.",
            progress: Math.min(totals.conducted, QUEST_RULES.logSessionsQuestGoal),
            goal: QUEST_RULES.logSessionsQuestGoal,
            detail: `${totals.conducted} sessions recorded this week`,
            complete: totals.conducted >= QUEST_RULES.logSessionsQuestGoal
        },
        {
            id: "weekly-target",
            title: "Keep weekly attendance at 75%+",
            description: `Requires at least ${QUEST_RULES.weeklyTargetMinimumSessions} recorded sessions this week.`,
            progress: Math.min(totals.conducted, QUEST_RULES.weeklyTargetMinimumSessions),
            goal: QUEST_RULES.weeklyTargetMinimumSessions,
            detail: totals.conducted
                ? `${((totals.attended / totals.conducted) * 100).toFixed(1)}% from ${totals.conducted} recorded sessions`
                : "No sessions recorded this week",
            complete: completedTarget
        }
    ];
}

function getAllWeeklyQuestCompletions(records = calendarRecords) {
    const weekKeys = [...new Set(Object.keys(records).map(mondayWeekKey))];
    return weekKeys.flatMap((weekKey) => buildWeeklyQuests(getWeeklyTotals(weekKey, records))
        .filter((quest) => quest.complete)
        .map((quest) => ({ weekKey, questId: quest.id })));
}

function hasBackOnTrackMilestone(records = calendarRecords) {
    const datedRecords = Object.entries(records).sort(([left], [right]) => left.localeCompare(right));
    let conducted = 0;
    let attended = 0;
    let wasBelowTarget = false;

    for (const [, record] of datedRecords) {
        conducted += record.attended + record.missed;
        attended += record.attended;
        if (conducted === 0) continue;
        const isOnTarget = 4n * BigInt(attended) >= 3n * BigInt(conducted);
        if (!isOnTarget) wasBelowTarget = true;
        else if (wasBelowTarget) return true;
    }
    return false;
}

function getPerfectWeekKeys(records = calendarRecords, settings = questSettings) {
    return settings.confirmedWeeks.filter((weekKey) => {
        const totals = getWeeklyTotals(weekKey, records);
        return totals.conducted > 0 && totals.missed === 0;
    });
}

function getAchievementStates(records = calendarRecords, currentSubjects = subjects, settings = questSettings) {
    const totals = getCalendarTotals(records);
    const streaks = getRecordedStreaks(records);
    const unlocked = new Set();
    if (totals.attended > 0) unlocked.add("first-step");
    if (streaks.best >= 3) unlocked.add("three-in-a-row");
    if (getPerfectWeekKeys(records, settings).length > 0) unlocked.add("perfect-week");
    if (hasBackOnTrackMilestone(records)) unlocked.add("back-on-track");
    if (currentSubjects.some((subject) => subject.conducted > 0 &&
        4n * BigInt(subject.attended) >= 3n * BigInt(subject.conducted))) {
        unlocked.add("subject-champion");
    }
    return ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
        ...achievement,
        unlocked: unlocked.has(achievement.id)
    }));
}

function getLevelForXp(totalXp) {
    let level = 1;
    while (getLevelThreshold(level + 1) <= totalXp) level += 1;
    const currentThreshold = getLevelThreshold(level);
    const nextThreshold = getLevelThreshold(level + 1);
    return {
        level,
        currentThreshold,
        nextThreshold,
        progress: Math.floor(((totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    };
}

function getLevelThreshold(level) {
    if (level <= QUEST_RULES.levelThresholds.length) return QUEST_RULES.levelThresholds[level - 1];
    const lastConfiguredLevel = QUEST_RULES.levelThresholds.length;
    const lastThreshold = QUEST_RULES.levelThresholds.at(-1);
    return lastThreshold + (level - lastConfiguredLevel) * QUEST_RULES.laterLevelStepXp;
}

function getQuestState(records = calendarRecords, currentSubjects = subjects, settings = questSettings) {
    const totals = getCalendarTotals(records);
    const streaks = getRecordedStreaks(records);
    const achievements = getAchievementStates(records, currentSubjects, settings);
    const weeklyCompletions = getAllWeeklyQuestCompletions(records);
    const activeWeekQuests = buildWeeklyQuests(getWeeklyTotals(currentWeekKey(), records));
    const attendanceXp = totals.attended * QUEST_RULES.xpPerAttendedSession;
    const questXp = weeklyCompletions.length * QUEST_RULES.weeklyQuestBonusXp;
    const achievementXp = achievements.filter((achievement) => achievement.unlocked).length * QUEST_RULES.achievementBonusXp;
    const totalXp = attendanceXp + questXp + achievementXp;
    return {
        totals,
        streaks,
        achievements,
        weeklyCompletions,
        activeWeekQuests,
        totalXp,
        attendanceXp,
        questXp,
        achievementXp,
        level: getLevelForXp(totalXp)
    };
}

function createQuestProgressBar(progress, goal, label) {
    const track = document.createElement("div");
    track.className = "quest-progress-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", label);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(goal));
    track.setAttribute("aria-valuenow", String(Math.min(progress, goal)));
    const fill = document.createElement("span");
    fill.style.width = `${Math.min((progress / goal) * 100, 100)}%`;
    track.append(fill);
    return track;
}

function renderQuest() {
    const state = getQuestState();
    const thisWeekKey = currentWeekKey();
    const thisWeekTotals = getWeeklyTotals(thisWeekKey);
    const activeQuests = buildWeeklyQuests(thisWeekTotals);
    const completedThisWeek = activeQuests.filter((quest) => quest.complete).length;
    const level = state.level;
    const progressXp = state.totalXp - level.currentThreshold;
    const nextLevelXp = level.nextThreshold - level.currentThreshold;

    document.getElementById("quest-level").textContent = `Level ${level.level}`;
    document.getElementById("quest-xp").textContent = `${state.totalXp.toLocaleString()} XP`;
    document.getElementById("quest-xp-current").textContent = `${progressXp} / ${nextLevelXp} XP`;
    document.getElementById("quest-xp-next").textContent = `${level.nextThreshold - state.totalXp} XP to Level ${level.level + 1}`;
    document.getElementById("quest-xp-progress").style.width = `${level.progress}%`;
    document.getElementById("quest-xp-meter").setAttribute("aria-valuenow", String(level.progress));
    document.getElementById("quest-current-streak").textContent = state.streaks.current.toLocaleString();
    document.getElementById("quest-best-streak").textContent = state.streaks.best.toLocaleString();
    document.getElementById("quest-week-label").textContent = weekLabel(thisWeekKey);
    document.getElementById("quest-week-xp").textContent = `+${completedThisWeek * QUEST_RULES.weeklyQuestBonusXp} XP earned`;
    document.getElementById("quest-record-summary").textContent = state.totals.conducted
        ? `${state.totals.attended} attended · ${state.totals.missed} missed · ${state.totals.conducted} recorded sessions`
        : "No calendar sessions recorded";

    const questList = document.getElementById("quest-list");
    questList.replaceChildren();
    activeQuests.forEach((quest) => {
        const card = document.createElement("article");
        card.className = `quest-card${quest.complete ? " is-complete" : ""}`;
        card.dataset.questId = quest.id;
        const top = document.createElement("div");
        top.className = "quest-card-top";
        const text = document.createElement("div");
        const title = document.createElement("h4");
        title.textContent = quest.title;
        const description = document.createElement("p");
        description.textContent = quest.description;
        text.append(title, description);
        const reward = document.createElement("span");
        reward.className = "quest-reward";
        reward.textContent = quest.complete ? `+${QUEST_RULES.weeklyQuestBonusXp} XP · Done` : `+${QUEST_RULES.weeklyQuestBonusXp} XP`;
        top.append(text, reward);
        const progressRow = document.createElement("div");
        progressRow.className = "quest-progress-row";
        progressRow.append(createQuestProgressBar(quest.progress, quest.goal, `${quest.title} progress`));
        const detail = document.createElement("span");
        detail.className = "quest-progress-detail";
        detail.textContent = quest.detail;
        progressRow.append(detail);
        card.append(top, progressRow);
        questList.append(card);
    });

    const achievements = state.achievements;
    const achievementList = document.getElementById("achievement-list");
    achievementList.replaceChildren();
    const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
    document.getElementById("achievement-count").textContent = `${unlockedCount}/${achievements.length} unlocked`;
    achievements.forEach((achievement) => {
        const badge = document.createElement("article");
        badge.className = `achievement-badge${achievement.unlocked ? " is-unlocked" : " is-locked"}`;
        badge.dataset.achievementId = achievement.id;
        const icon = document.createElement("span");
        icon.className = "achievement-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = achievement.unlocked ? "\u2726" : "\u25C7";
        const copy = document.createElement("div");
        const title = document.createElement("h4");
        title.textContent = achievement.title;
        const description = document.createElement("p");
        description.textContent = achievement.description;
        copy.append(title, description);
        const reward = document.createElement("span");
        reward.className = "achievement-xp";
        reward.textContent = achievement.unlocked ? `+${QUEST_RULES.achievementBonusXp} XP` : "Locked";
        badge.append(icon, copy, reward);
        achievementList.append(badge);
    });

    const confirmedThisWeek = questSettings.confirmedWeeks.includes(thisWeekKey);
    const confirmButton = document.getElementById("quest-confirm-week");
    confirmButton.disabled = thisWeekTotals.conducted === 0 || confirmedThisWeek;
    confirmButton.textContent = confirmedThisWeek ? "Week verified" : "Confirm week is fully logged";

    const milestones = document.getElementById("quest-milestone-list");
    milestones.replaceChildren();
    const recentAttendanceDates = Object.entries(calendarRecords)
        .filter(([, record]) => record.attended > 0)
        .sort(([left], [right]) => right.localeCompare(left))
        .slice(0, 3);
    if (!recentAttendanceDates.length) {
        const empty = document.createElement("p");
        empty.className = "quest-empty-state";
        empty.textContent = "Your first recorded attended session will start the journey. No attendance is inferred from empty dates.";
        milestones.append(empty);
    } else {
        recentAttendanceDates.forEach(([key, record]) => {
            const item = document.createElement("article");
            item.className = "quest-milestone-item";
            const marker = document.createElement("span");
            marker.className = "milestone-marker";
            marker.setAttribute("aria-hidden", "true");
            marker.textContent = "\u2713";
            const copy = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = `${record.attended} attended ${record.attended === 1 ? "session" : "sessions"}`;
            const date = document.createElement("time");
            date.dateTime = key;
            date.textContent = new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "medium" });
            copy.append(title, date);
            item.append(marker, copy);
            milestones.append(item);
        });
    }
}

function announceQuestChanges(previousState, message) {
    const nextState = getQuestState();
    const unlockedAchievements = nextState.achievements.filter((achievement) => achievement.unlocked &&
        !previousState.achievements.some((previous) => previous.id === achievement.id && previous.unlocked));
    const priorCompleted = new Set(previousState.activeWeekQuests.filter((quest) => quest.complete).map((quest) => quest.id));
    const completedNow = nextState.activeWeekQuests.filter((quest) => quest.complete && !priorCompleted.has(quest.id));
    const messages = [];
    if (nextState.level.level > previousState.level.level) messages.push(`Level up! You reached Level ${nextState.level.level}.`);
    unlockedAchievements.forEach((achievement) => messages.push(`Achievement unlocked: ${achievement.title} (+${QUEST_RULES.achievementBonusXp} XP).`));
    completedNow.forEach((quest) => messages.push(`Quest complete: ${quest.title} (+${QUEST_RULES.weeklyQuestBonusXp} XP).`));
    if (!messages.length) messages.push(message);
    const feedback = document.getElementById("quest-feedback");
    feedback.textContent = messages.join(" ");
    const earnedMilestone = nextState.level.level > previousState.level.level || unlockedAchievements.length > 0 || completedNow.length > 0;
    if (earnedMilestone && !reducedMotionPreference.matches) {
        feedback.classList.remove("is-celebrating");
        void feedback.offsetWidth;
        feedback.classList.add("is-celebrating");
        window.setTimeout(() => feedback.classList.remove("is-celebrating"), 900);
    }

    if (nextState.totalXp > previousState.totalXp) {
        const xpTrack = document.getElementById("quest-xp-progress");
        xpTrack.classList.remove("is-charging");
        void xpTrack.offsetWidth;
        xpTrack.classList.add("is-charging");
        window.setTimeout(() => xpTrack.classList.remove("is-charging"), 1000);
    }

    if (nextState.level.level > previousState.level.level) {
        const levelCard = document.querySelector(".quest-level-card");
        levelCard.classList.remove("level-up-burst");
        void levelCard.offsetWidth;
        levelCard.classList.add("level-up-burst");
        window.setTimeout(() => levelCard.classList.remove("level-up-burst"), 1000);
    }

    unlockedAchievements.forEach((achievement, index) => {
        const badge = document.querySelector(`[data-achievement-id="${achievement.id}"]`);
        if (!badge) return;
        window.setTimeout(() => badge.classList.add("just-unlocked"), index * 90);
        window.setTimeout(() => badge.classList.remove("just-unlocked"), 1050 + index * 90);
    });

    completedNow.forEach((quest, index) => {
        const card = document.querySelector(`[data-quest-id="${quest.id}"]`);
        if (!card) return;
        window.setTimeout(() => card.classList.add("just-completed"), index * 70);
        window.setTimeout(() => card.classList.remove("just-completed"), 850 + index * 70);
    });
}

function saveQuestSettings() {
    try {
        localStorage.setItem(questStorageKey, JSON.stringify(questSettings));
        return true;
    } catch {
        document.getElementById("quest-feedback").textContent = "Quest confirmation could not be saved in this browser.";
        return false;
    }
}

function invalidateConfirmedWeek(key) {
    const weekKey = mondayWeekKey(key);
    if (!questSettings.confirmedWeeks.includes(weekKey)) return false;
    questSettings.confirmedWeeks = questSettings.confirmedWeeks.filter((confirmed) => confirmed !== weekKey);
    saveQuestSettings();
    return true;
}

calendarRecords = cleanCalendarRecords(calendarRecords);

function attendanceAdvice(conducted, attended, targetPercent = 75) {
    if (!Number.isSafeInteger(conducted) || !Number.isSafeInteger(attended) || conducted < 1 || attended < 0 || attended > conducted) {
        return null;
    }

    const targetBasis = BigInt(Math.round(targetPercent * 100));
    const fullBasis = 10000n;
    const margin = fullBasis * BigInt(attended) - targetBasis * BigInt(conducted);
    const percentage = (attended / conducted) * 100;
    let required = 0n;
    let safeMisses = 0n;
    let unreachable = false;

    if (margin < 0n) {
        if (targetBasis === fullBasis) {
            unreachable = true;
        } else {
            const deficit = -margin;
            const divisor = fullBasis - targetBasis;
            required = (deficit + divisor - 1n) / divisor;
        }
    } else if (targetBasis > 0n) {
        safeMisses = margin / targetBasis;
    }

    return { percentage, margin, required, safeMisses, unreachable, onTarget: margin >= 0n };
}

function isValidSubject(subject) {
    return subject &&
        typeof subject.id === "string" &&
        typeof subject.name === "string" &&
        Number.isSafeInteger(subject.conducted) && subject.conducted >= 0 &&
        Number.isSafeInteger(subject.attended) && subject.attended >= 0 &&
        subject.attended <= subject.conducted;
}

function isValidHistoryEntry(entry) {
    return entry &&
        typeof entry.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp)) &&
        Number.isSafeInteger(entry.conducted) && entry.conducted > 0 &&
        Number.isSafeInteger(entry.attended) && entry.attended >= 0 &&
        entry.attended <= entry.conducted &&
        (entry.source === undefined || entry.source === "manual" || entry.source === "calendar");
}

function saveStoredArray(key, value, feedbackElement) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        feedbackElement.textContent = "";
        return true;
    } catch {
        feedbackElement.textContent = "Browser storage is unavailable. This change will not survive a refresh.";
        return false;
    }
}

function makeId() {
    return typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderSubjects() {
    subjectList.replaceChildren();
    subjectCount.textContent = `${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}`;

    if (subjects.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-state";
        emptyMessage.textContent = "No subjects yet. Add one above to start tracking.";
        subjectList.append(emptyMessage);
        renderDashboard();
        renderQuest();
        return;
    }

    subjects.forEach((subject) => {
        const card = document.createElement("article");
        card.className = "subject-card";

        const top = document.createElement("div");
        top.className = "subject-card-top";
        const name = document.createElement("h3");
        name.className = "subject-card-name";
        name.textContent = subject.name;

        const percentage = subject.conducted > 0 ? (subject.attended / subject.conducted) * 100 : null;
        const status = document.createElement("span");
        status.className = "subject-status";
        status.textContent = percentage === null ? "No classes yet" : percentage < 75 ? "Below 75%" : "On track";
        status.classList.toggle("is-on-track", percentage !== null && percentage >= 75);
        top.append(name, status);

        const stats = document.createElement("div");
        stats.className = "subject-stats";
        appendSubjectStat(stats, "Conducted", subject.conducted.toLocaleString());
        appendSubjectStat(stats, "Attended", subject.attended.toLocaleString());
        appendSubjectStat(stats, "Attendance", percentage === null ? "—" : `${percentage.toFixed(2)}%`);

        const progressTrack = document.createElement("div");
        progressTrack.className = "subject-progress-track";
        progressTrack.setAttribute("role", "progressbar");
        progressTrack.setAttribute("aria-label", `${subject.name} attendance`);
        progressTrack.setAttribute("aria-valuemin", "0");
        progressTrack.setAttribute("aria-valuemax", "100");
        progressTrack.setAttribute("aria-valuenow", (percentage || 0).toFixed(2));
        const progressFill = document.createElement("span");
        progressFill.className = `subject-progress-fill${percentage >= 75 ? " is-achieved" : ""}`;
        progressFill.style.width = `${percentage || 0}%`;
        progressTrack.append(progressFill);

        const guidance = document.createElement("p");
        guidance.className = "subject-guidance";
        if (percentage === null) {
            guidance.textContent = "No classes yet. Add the first class count when this subject begins.";
        } else {
            const margin = 4n * BigInt(subject.attended) - 3n * BigInt(subject.conducted);
            if (margin < 0n) {
                const needed = (-margin).toString();
                guidance.textContent = `Attend the next ${needed} ${needed === "1" ? "class" : "classes"} consecutively to reach 75%.`;
            } else if (margin === 0n) {
                guidance.textContent = "Exactly 75%. Do not miss another class or you will fall below the requirement.";
            } else {
                const safeSkips = (margin / 3n).toString();
                guidance.textContent = `You can miss ${safeSkips} consecutive ${safeSkips === "1" ? "class" : "classes"} and stay at or above 75%.`;
            }
        }

        const actions = document.createElement("div");
        actions.className = "subject-actions";
        actions.append(
            createSubjectAction("Edit", "edit", subject.id),
            createSubjectAction("Delete", "delete", subject.id)
        );

        card.append(top, stats, progressTrack, guidance, actions);
        subjectList.append(card);
    });
    renderDashboard();
    renderQuest();
}

function appendSubjectStat(container, label, value) {
    const stat = document.createElement("div");
    stat.className = "subject-stat";
    const statLabel = document.createElement("span");
    statLabel.textContent = label;
    const statValue = document.createElement("strong");
    statValue.textContent = value;
    stat.append(statLabel, statValue);
    container.append(stat);
}

function createSubjectAction(label, action, subjectId) {
    const button = document.createElement("button");
    button.className = action === "delete" ? "text-button delete-button" : "text-button edit-button";
    button.type = "button";
    button.dataset.action = action;
    button.dataset.subjectId = subjectId;
    button.textContent = label;
    return button;
}

function renderHistory() {
    historyList.replaceChildren();
    clearHistoryButton.disabled = attendanceHistory.length === 0;

    if (attendanceHistory.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = "Your attendance checks will appear here.";
        historyList.append(emptyItem);
        return;
    }

    attendanceHistory.forEach((entry) => {
        const item = document.createElement("li");
        item.className = "history-item";
        const details = document.createElement("div");
        details.className = "history-details";
        const summary = document.createElement("strong");
        summary.textContent = `${entry.attended.toLocaleString()} of ${entry.conducted.toLocaleString()} classes`;
        const date = document.createElement("time");
        date.dateTime = entry.timestamp;
        date.textContent = new Date(entry.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
        details.append(summary, date);

        const percentage = document.createElement("span");
        percentage.className = "history-percentage";
        percentage.textContent = `${((entry.attended / entry.conducted) * 100).toFixed(2)}%`;
        item.append(details, percentage);
        historyList.append(item);
    });
}

function resetSubjectForm() {
    subjectForm.reset();
    subjectConductedInput.value = "0";
    subjectAttendedInput.value = "0";
    subjectAttendedInput.max = "";
    editingSubjectId = null;
    subjectSubmit.textContent = "Add subject";
    subjectCancel.hidden = true;
}

function saveHistoryEntry(conducted, attended) {
    attendanceHistory.unshift({ conducted, attended, source: nextSnapshotSource, timestamp: new Date().toISOString() });
    nextSnapshotSource = "manual";
    attendanceHistory = attendanceHistory.slice(0, 5);
    saveStoredArray(historyStorageKey, attendanceHistory, historyFeedback);
    renderHistory();
    renderDashboard();
    renderPlannerSource();
    resetPlannerPreview();
}

function renderDashboard() {
    const latest = attendanceHistory[0];
    dashboardEmpty.hidden = Boolean(latest);
    dashboardContent.hidden = !latest;
    dashboardSubjectList.replaceChildren();
    dashboardSubjectEmpty.hidden = subjects.length > 0;

    if (latest) {
        document.getElementById("dashboard-source-note").textContent = latest.source === "calendar"
            ? "Latest snapshot imported from calendar"
            : "Latest manual calculator entry";
        const advice = attendanceAdvice(latest.conducted, latest.attended);
        const status = document.getElementById("dashboard-status");
        const percent = advice.percentage;
        status.textContent = percent < 75 ? "Below Target" : percent === 75 ? "On Track" : "Target Achieved";
        status.className = `dashboard-status ${percent < 75 ? "is-below" : percent === 75 ? "is-exact" : "is-achieved"}`;
        document.getElementById("dashboard-percentage").textContent = `${percent.toFixed(2)}%`;
        document.getElementById("dashboard-conducted").textContent = latest.conducted.toLocaleString();
        document.getElementById("dashboard-attended").textContent = latest.attended.toLocaleString();
        document.getElementById("dashboard-missed").textContent = (latest.conducted - latest.attended).toLocaleString();
        document.getElementById("dashboard-safe-skips").textContent = advice.safeMisses.toString();
        document.getElementById("dashboard-needed").textContent = advice.required.toString();
        document.getElementById("dashboard-meter").setAttribute("aria-valuenow", Math.min(percent, 100).toFixed(2));
        document.getElementById("dashboard-progress").style.width = `${Math.min(percent, 100)}%`;
        document.querySelector(".dashboard-main-card").classList.toggle("is-below", percent < 75);
    }

    const needsImprovement = subjects.filter((subject) =>
        subject.conducted > 0 && 4n * BigInt(subject.attended) < 3n * BigInt(subject.conducted)
    );
    document.getElementById("improvement-count").textContent = needsImprovement.length
        ? `${needsImprovement.length} need improvement: ${needsImprovement.map((subject) => subject.name).join(", ")}`
        : "No subjects need attention";

    subjects.forEach((subject) => {
        const percent = subject.conducted ? (subject.attended / subject.conducted) * 100 : 0;
        const row = document.createElement("div");
        row.className = "dashboard-subject-row";
        const details = document.createElement("div");
        details.className = "dashboard-subject-details";
        const name = document.createElement("strong");
        name.textContent = subject.name;
        const value = document.createElement("span");
        value.textContent = subject.conducted ? `${percent.toFixed(2)}%` : "Not started";
        details.append(name, value);

        const track = document.createElement("div");
        track.className = "subject-progress-track";
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", `${subject.name} attendance`);
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
        track.setAttribute("aria-valuenow", percent.toFixed(2));
        const fill = document.createElement("span");
        fill.className = `subject-progress-fill${percent >= 75 ? " is-achieved" : ""}`;
        fill.style.width = `${percent}%`;
        track.append(fill);
        row.append(details, track);
        dashboardSubjectList.append(row);
    });
}

function syncCalendarRecordForm() {
    const selected = calendarRecords[selectedCalendarDate];
    const selectedDate = new Date(`${selectedCalendarDate}T00:00:00`);
    document.getElementById("calendar-selected-label").textContent = selectedDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    calendarAttendedInput.value = String(selected?.attended || 0);
    calendarMissedInput.value = String(selected?.missed || 0);
    calendarDeleteButton.disabled = !selected;
    document.getElementById("calendar-save").textContent = selected ? "Update date" : "Save date";
}

function renderCalendarSummary() {
    const monthKey = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-`;
    const records = Object.entries(calendarRecords).filter(([key]) => key.startsWith(monthKey));
    const attended = records.reduce((sum, [, record]) => sum + record.attended, 0);
    const missed = records.reduce((sum, [, record]) => sum + record.missed, 0);
    const total = attended + missed;
    document.getElementById("calendar-month-percentage").textContent = total ? `${((attended / total) * 100).toFixed(2)}%` : "No records";
    document.getElementById("calendar-month-attended").textContent = attended.toLocaleString();
    document.getElementById("calendar-month-missed").textContent = missed.toLocaleString();
    document.getElementById("calendar-month-days").textContent = String(records.length);
}

function renderCalendar() {
    calendarMonthLabel.textContent = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    calendarGrid.replaceChildren();
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let index = 0; index < startOffset; index += 1) {
        const spacer = document.createElement("span");
        spacer.className = "calendar-day-spacer";
        spacer.setAttribute("aria-hidden", "true");
        calendarGrid.append(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const key = dateKey(date);
        const record = calendarRecords[key];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "calendar-day";
        button.dataset.date = key;
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-pressed", String(key === selectedCalendarDate));
        if (key === selectedCalendarDate) button.classList.add("is-selected");
        if (key === dateKey(today)) button.classList.add("is-today");

        let stateLabel = "No record";
        if (record) {
            if (record.attended && record.missed) {
                button.classList.add("has-mixed");
                stateLabel = `${record.attended} attended, ${record.missed} missed`;
            } else if (record.attended) {
                button.classList.add("has-attended");
                stateLabel = `${record.attended} attended`;
            } else {
                button.classList.add("has-missed");
                stateLabel = `${record.missed} missed`;
            }
        }

        const dayNumber = document.createElement("span");
        dayNumber.className = "calendar-day-number";
        dayNumber.textContent = String(day);
        const marker = document.createElement("span");
        marker.className = "calendar-day-marker";
        marker.textContent = record ? `${record.attended}/${record.missed}` : "";
        button.setAttribute("aria-label", `${date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}: ${stateLabel}`);
        button.append(dayNumber, marker);
        calendarGrid.append(button);
    }

    syncCalendarRecordForm();
    renderCalendarSummary();
}

function saveCalendarRecords() {
    try {
        localStorage.setItem(calendarStorageKey, JSON.stringify(calendarRecords));
        calendarFeedback.textContent = "";
        return true;
    } catch {
        calendarFeedback.textContent = "Browser storage is unavailable. This change will not survive a refresh.";
        return false;
    }
}

function renderPlannerSource() {
    const latest = attendanceHistory[0];
    const sourceLabel = document.getElementById("planner-source-status");
    if (!latest) {
        sourceLabel.textContent = "No calculator snapshot";
        resetPlannerPreview();
        return;
    }
    sourceLabel.textContent = `${latest.source === "calendar" ? "Calendar import" : "Calculator snapshot"}: ${latest.attended}/${latest.conducted}`;
}

function resetPlannerPreview() {
    plannerPreview = null;
    plannerResults.hidden = true;
    plannerApplyButton.disabled = true;
}

function formatPlanAdvice(advice, targetPercent) {
    if (advice.onTarget) {
        return `Target achieved. Up to ${advice.safeMisses} consecutive ${advice.safeMisses === 1n ? "class" : "classes"} can be missed and stay at or above ${targetPercent}%.`;
    }
    if (advice.unreachable) {
        return "A 100% target cannot be reached with a finite number of additional classes unless attendance is already perfect.";
    }
    return `Attend the next ${advice.required} consecutive ${advice.required === 1n ? "class" : "classes"} to reach at least ${targetPercent}%.`;
}

function updatePlannerPreview(event) {
    event.preventDefault();
    plannerFeedback.textContent = "";
    const latest = attendanceHistory[0];
    if (!latest) {
        plannerFeedback.textContent = "Calculate attendance first to create a planner starting point.";
        plannerApplyButton.disabled = true;
        return;
    }

    const targetPercent = Number(plannerTargetInput.value);
    const plannedAttend = Number(plannerAttendInput.value);
    const plannedMiss = Number(plannerMissInput.value);
    if (!Number.isFinite(targetPercent) || targetPercent < 1 || targetPercent > 100 ||
        !Number.isSafeInteger(plannedAttend) || !Number.isSafeInteger(plannedMiss) || plannedAttend < 0 || plannedMiss < 0) {
        plannerFeedback.textContent = "Choose a target from 1 to 100% and enter non-negative whole class counts.";
        plannerApplyButton.disabled = true;
        return;
    }

    const projectedConducted = latest.conducted + plannedAttend + plannedMiss;
    const projectedAttended = latest.attended + plannedAttend;
    if (!Number.isSafeInteger(projectedConducted) || !Number.isSafeInteger(projectedAttended)) {
        plannerFeedback.textContent = "The projected class totals are too large.";
        plannerApplyButton.disabled = true;
        return;
    }

    const currentAdvice = attendanceAdvice(latest.conducted, latest.attended, targetPercent);
    const projectedAdvice = attendanceAdvice(projectedConducted, projectedAttended, targetPercent);
    document.getElementById("planner-current-status").textContent = currentAdvice.onTarget
        ? `Target achieved at ${currentAdvice.percentage.toFixed(2)}%`
        : `Below target at ${currentAdvice.percentage.toFixed(2)}%`;
    document.getElementById("planner-current-guidance").textContent = formatPlanAdvice(currentAdvice, targetPercent);
    document.getElementById("planner-projected-percentage").textContent = `${projectedAdvice.percentage.toFixed(2)}%`;
    document.getElementById("planner-projected-guidance").textContent =
        `After ${plannedAttend} attended and ${plannedMiss} missed ${plannedAttend + plannedMiss === 1 ? "class" : "classes"} (${projectedAttended}/${projectedConducted}): ${formatPlanAdvice(projectedAdvice, targetPercent)}`;
    plannerResults.hidden = false;
    plannerApplyButton.disabled = false;
    plannerPreview = { conducted: projectedConducted, attended: projectedAttended };
}

function reportSnapshot() {
    return {
        latest: attendanceHistory[0] || null,
        subjects: subjects.slice(),
        generatedAt: new Date()
    };
}

function reportHasData(report) {
    return Boolean(report.latest || report.subjects.length);
}

function csvCell(value) {
    let text = String(value ?? "");
    if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}

function buildCsvReport(report) {
    const generatedAt = report.generatedAt.toISOString();
    const rows = [
        ["Report", "Menoozzzz Attendance Prediction"],
        ["Generated at", generatedAt],
        [],
        ["Record type", "Subject", "Classes conducted", "Classes attended", "Classes missed", "Attendance percentage", "Source"]
    ];

    if (report.latest) {
        rows.push([
            "Overall",
            "",
            report.latest.conducted,
            report.latest.attended,
            report.latest.conducted - report.latest.attended,
            `${((report.latest.attended / report.latest.conducted) * 100).toFixed(2)}%`,
            report.latest.source === "calendar" ? "Calendar import" : "Manual calculator"
        ]);
    } else {
        rows.push(["Overall", "No calculator snapshot", "", "", "", "", ""]);
    }

    report.subjects.forEach((subject) => rows.push([
        "Subject",
        subject.name,
        subject.conducted,
        subject.attended,
        subject.conducted - subject.attended,
        subject.conducted ? `${((subject.attended / subject.conducted) * 100).toFixed(2)}%` : "",
        "Subject record"
    ]));

    return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

function pdfSafeText(value) {
    return String(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E]/g, "?");
}

function wrapPdfLine(value, maxLength = 84) {
    const words = pdfSafeText(value).split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
        if (!word) return;
        if (word.length > maxLength) {
            if (line) lines.push(line);
            line = "";
            for (let index = 0; index < word.length; index += maxLength) lines.push(word.slice(index, index + maxLength));
            return;
        }
        if (line && `${line} ${word}`.length > maxLength) {
            lines.push(line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
}

function pdfLiteral(value) {
    return pdfSafeText(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildPdfReport(report) {
    const dateLabel = report.generatedAt.toLocaleDateString(undefined, { dateStyle: "long" });
    const contentLines = [
        { text: "MENOOZZZZ ATTENDANCE PREDICTION", kind: "title" },
        { text: "Attendance report", kind: "subtitle" },
        { text: `Generated: ${dateLabel}`, kind: "body" },
        { text: "", kind: "body" },
        { text: "OVERALL SUMMARY", kind: "heading" }
    ];

    if (report.latest) {
        contentLines.push(
            { text: `Attendance: ${((report.latest.attended / report.latest.conducted) * 100).toFixed(2)}%`, kind: "body" },
            { text: `Classes conducted: ${report.latest.conducted}`, kind: "body" },
            { text: `Classes attended: ${report.latest.attended}`, kind: "body" },
            { text: `Classes missed: ${report.latest.conducted - report.latest.attended}`, kind: "body" },
            { text: `Snapshot source: ${report.latest.source === "calendar" ? "Calendar import" : "Manual calculator"}`, kind: "body" }
        );
    } else {
        contentLines.push({ text: "No overall calculator snapshot has been saved.", kind: "body" });
    }

    contentLines.push({ text: "", kind: "body" }, { text: "SUBJECT-WISE ATTENDANCE", kind: "heading" });
    if (report.subjects.length) {
        report.subjects.forEach((subject) => {
            const percentage = subject.conducted ? `${((subject.attended / subject.conducted) * 100).toFixed(2)}%` : "No classes";
            contentLines.push(
                { text: subject.name, kind: "subject" },
                { text: `  Conducted ${subject.conducted} | Attended ${subject.attended} | Missed ${subject.conducted - subject.attended} | Attendance ${percentage}`, kind: "body" }
            );
        });
    } else {
        contentLines.push({ text: "No subject records have been added.", kind: "body" });
    }

    const flattenedLines = contentLines.flatMap((line) => wrapPdfLine(line.text).map((text, index) => ({
        text,
        kind: index === 0 ? line.kind : "body"
    })));
    const pages = [];
    for (let index = 0; index < flattenedLines.length; index += 44) pages.push(flattenedLines.slice(index, index + 44));
    const objects = [];
    const pageIds = pages.map((_, index) => 5 + index * 2);
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    pages.forEach((lines, pageIndex) => {
        const pageId = pageIds[pageIndex];
        const contentId = pageId + 1;
        let y = 748;
        const commands = lines.map((line) => {
            const title = line.kind === "title";
            const heading = line.kind === "heading" || line.kind === "subject";
            const font = heading || title ? "F2" : "F1";
            const size = title ? 16 : heading ? 11 : line.kind === "subtitle" ? 12 : 9.5;
            const color = heading ? "0.16 0.27 0.53" : "0.12 0.15 0.23";
            const command = `BT ${color} rg /${font} ${size} Tf 48 ${y} Td (${pdfLiteral(line.text)}) Tj ET`;
            y -= title || heading ? 20 : 15;
            return command;
        }).join("\n");
        objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
        objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
    });

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (let objectId = 1; objectId < objects.length; objectId += 1) {
        offsets.push(pdf.length);
        pdf += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
}

function downloadReport(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function applyTheme(theme, persist = true) {
    const activeTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = activeTheme;
    const isLight = activeTheme === "light";
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} mode`);
    themeIcon.textContent = isLight ? "\u263E" : "\u263C";
    themeLabel.textContent = isLight ? "Dark mode" : "Light mode";
    document.querySelector('meta[name="theme-color"]').content = isLight ? "#F3F6FC" : "#0B1026";
    if (persist) {
        try {
            localStorage.setItem(themeStorageKey, activeTheme);
        } catch {
            reportFeedback.textContent = "Theme changed, but browser storage is unavailable for keeping this setting.";
        }
    }
}

function readThemePreference() {
    try {
        return localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
    } catch {
        return "dark";
    }
}

function exportReport(format) {
    const report = reportSnapshot();
    if (!reportHasData(report)) {
        reportFeedback.textContent = "Add a calculator snapshot or subject record before downloading a report.";
        return;
    }
    if (format === "csv") {
        downloadReport(new Blob([buildCsvReport(report)], { type: "text/csv;charset=utf-8" }), "attendance-report.csv");
        reportFeedback.textContent = "CSV report downloaded.";
    } else {
        downloadReport(new Blob([buildPdfReport(report)], { type: "application/pdf" }), "attendance-report.pdf");
        reportFeedback.textContent = "PDF report downloaded.";
    }
}

conductedInput.addEventListener("input", () => {
    attendedInput.max = conductedInput.value;
    attendedInput.setCustomValidity("");
});
attendanceForm.addEventListener("input", () => {
    results.hidden = true;
    formError.textContent = "";
});

subjectConductedInput.addEventListener("input", () => {
    subjectAttendedInput.max = subjectConductedInput.value;
    subjectAttendedInput.setCustomValidity("");
});

subjectAttendedInput.addEventListener("input", () => {
    subjectAttendedInput.setCustomValidity("");
});

attendedInput.addEventListener("input", () => {
    attendedInput.setCustomValidity("");
});

attendanceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formError.textContent = "";

    const conducted = Number(conductedInput.value);
    const attended = Number(attendedInput.value);

    if (!Number.isSafeInteger(conducted) || !Number.isSafeInteger(attended) || conducted < 1 || attended < 0) {
        formError.textContent = "Enter whole numbers, with at least one class conducted.";
        results.hidden = true;
        return;
    }

    if (attended > conducted) {
        attendedInput.setCustomValidity("Classes attended cannot exceed classes conducted.");
        attendedInput.reportValidity();
        formError.textContent = "Classes attended cannot exceed classes conducted.";
        results.hidden = true;
        return;
    }

    saveHistoryEntry(conducted, attended);
    showAttendance(conducted, attended);
});

subjectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    subjectFeedback.textContent = "";

    const name = subjectNameInput.value.trim();
    const conducted = Number(subjectConductedInput.value);
    const attended = Number(subjectAttendedInput.value);

    if (!name || !Number.isSafeInteger(conducted) || !Number.isSafeInteger(attended) || conducted < 0 || attended < 0) {
        subjectFeedback.textContent = "Enter a subject name and whole-number class counts.";
        return;
    }

    if (attended > conducted) {
        subjectAttendedInput.setCustomValidity("Classes attended cannot exceed classes conducted.");
        subjectAttendedInput.reportValidity();
        subjectFeedback.textContent = "Classes attended cannot exceed classes conducted.";
        return;
    }

    const subject = { id: editingSubjectId || makeId(), name, conducted, attended };
    const previousQuestState = getQuestState();
    if (editingSubjectId) {
        subjects = subjects.map((existing) => existing.id === editingSubjectId ? subject : existing);
    } else {
        subjects.push(subject);
    }

    saveStoredArray(subjectsStorageKey, subjects, subjectFeedback);
    renderSubjects();
    announceQuestChanges(previousQuestState, "Subject saved. Quest progress was recalculated from your records.");
    resetSubjectForm();
});

subjectList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const subject = subjects.find((item) => item.id === button.dataset.subjectId);
    if (!subject) return;

    if (button.dataset.action === "edit") {
        editingSubjectId = subject.id;
        subjectNameInput.value = subject.name;
        subjectConductedInput.value = String(subject.conducted);
        subjectAttendedInput.value = String(subject.attended);
        subjectAttendedInput.max = String(subject.conducted);
        subjectSubmit.textContent = "Save subject";
        subjectCancel.hidden = false;
        subjectNameInput.focus();
        return;
    }

    if (!window.confirm(`Delete ${subject.name} from subject attendance?`)) return;
    const previousQuestState = getQuestState();
    subjects = subjects.filter((item) => item.id !== subject.id);
    if (editingSubjectId === subject.id) resetSubjectForm();
    saveStoredArray(subjectsStorageKey, subjects, subjectFeedback);
    renderSubjects();
    announceQuestChanges(previousQuestState, "Subject removed. Quest achievements were recalculated.");
});

subjectCancel.addEventListener("click", resetSubjectForm);

clearHistoryButton.addEventListener("click", () => {
    if (!window.confirm("Clear all saved attendance calculations?")) return;
    attendanceHistory = [];
    saveStoredArray(historyStorageKey, attendanceHistory, historyFeedback);
    renderHistory();
    renderDashboard();
    renderPlannerSource();
});

renderSubjects();
renderHistory();
renderDashboard();
renderCalendar();
renderPlannerSource();
renderQuest();
applyTheme(readThemePreference(), false);

themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
});

document.getElementById("download-csv").addEventListener("click", () => exportReport("csv"));
document.getElementById("download-pdf").addEventListener("click", () => exportReport("pdf"));

document.getElementById("calendar-prev").addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    selectedCalendarDate = dateKey(calendarMonth);
    renderCalendar();
});

document.getElementById("calendar-next").addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    selectedCalendarDate = dateKey(calendarMonth);
    renderCalendar();
});

calendarGrid.addEventListener("click", (event) => {
    const dayButton = event.target.closest("button[data-date]");
    if (!dayButton) return;
    selectedCalendarDate = dayButton.dataset.date;
    calendarFeedback.textContent = "";
    renderCalendar();
});

calendarRecordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    calendarFeedback.textContent = "";
    const attended = Number(calendarAttendedInput.value);
    const missed = Number(calendarMissedInput.value);
    if (!Number.isSafeInteger(attended) || !Number.isSafeInteger(missed) || attended < 0 || missed < 0 || attended + missed < 1) {
        calendarFeedback.textContent = "Enter at least one attended or missed class for this date.";
        return;
    }
    if (!Number.isSafeInteger(attended + missed)) {
        calendarFeedback.textContent = "The class total is too large.";
        return;
    }
    const previousRecord = calendarRecords[selectedCalendarDate];
    if (previousRecord && previousRecord.attended === attended && previousRecord.missed === missed) {
        calendarFeedback.textContent = "No changes to this date. No additional XP was granted.";
        return;
    }
    const previousQuestState = getQuestState();
    calendarRecords[selectedCalendarDate] = { attended, missed };
    const weekConfirmationReset = invalidateConfirmedWeek(selectedCalendarDate);
    const saved = saveCalendarRecords();
    renderCalendar();
    renderQuest();
    calendarFeedback.textContent = saved
        ? `Saved attendance for ${selectedCalendarDate}${weekConfirmationReset ? ". Confirm this week's schedule again for Perfect Week eligibility" : ""}.`
        : "Record updated in this page, but browser storage is unavailable.";
    announceQuestChanges(previousQuestState, `Calendar record updated for ${selectedCalendarDate}. XP and streaks were recalculated from the records.`);
});

calendarDeleteButton.addEventListener("click", () => {
    if (!calendarRecords[selectedCalendarDate]) return;
    if (!window.confirm(`Delete the attendance record for ${selectedCalendarDate}?`)) return;
    const previousQuestState = getQuestState();
    delete calendarRecords[selectedCalendarDate];
    const weekConfirmationReset = invalidateConfirmedWeek(selectedCalendarDate);
    const saved = saveCalendarRecords();
    renderCalendar();
    renderQuest();
    calendarFeedback.textContent = saved
        ? `Deleted attendance for ${selectedCalendarDate}${weekConfirmationReset ? ". This week's schedule confirmation was cleared" : ""}.`
        : "Record deleted from this page, but browser storage is unavailable.";
    announceQuestChanges(previousQuestState, "Calendar record deleted. XP, streaks, and achievements were recalculated.");
});

document.getElementById("quest-confirm-week").addEventListener("click", () => {
    const weekKey = currentWeekKey();
    if (questSettings.confirmedWeeks.includes(weekKey)) {
        document.getElementById("quest-feedback").textContent = "This week is already verified. Any calendar edit will require a fresh confirmation.";
        return;
    }
    if (getWeeklyTotals(weekKey).conducted === 0) {
        document.getElementById("quest-feedback").textContent = "Log this week's class sessions before confirming the schedule is complete.";
        return;
    }
    if (!window.confirm(`Confirm that every class scheduled for ${weekLabel(weekKey)} has been recorded in the calendar?`)) return;
    const previousQuestState = getQuestState();
    questSettings.confirmedWeeks = [...new Set([...questSettings.confirmedWeeks, weekKey])];
    if (!saveQuestSettings()) return;
    renderQuest();
    announceQuestChanges(previousQuestState, "This week's schedule is marked fully logged. Perfect Week will unlock only if all its recorded sessions were attended.");
});

document.getElementById("calendar-import").addEventListener("click", () => {
    const totals = Object.values(calendarRecords).reduce((summary, record) => ({
        conducted: summary.conducted + record.attended + record.missed,
        attended: summary.attended + record.attended
    }), { conducted: 0, attended: 0 });
    if (!Number.isSafeInteger(totals.conducted) || !Number.isSafeInteger(totals.attended)) {
        calendarFeedback.textContent = "Calendar totals are too large to import.";
        return;
    }
    if (totals.conducted < 1) {
        calendarFeedback.textContent = "Log at least one calendar class before importing totals.";
        return;
    }
    if (!window.confirm(`Use all calendar records (${totals.attended} attended of ${totals.conducted}) to replace the calculator inputs and save a dated snapshot?`)) return;
    conductedInput.value = String(totals.conducted);
    attendedInput.value = String(totals.attended);
    nextSnapshotSource = "calendar";
    attendanceForm.requestSubmit();
    calendarFeedback.textContent = "Calendar totals were imported as a separate calculator snapshot.";
});

plannerForm.addEventListener("submit", updatePlannerPreview);

plannerForm.addEventListener("input", () => {
    plannerFeedback.textContent = "";
    plannerResults.hidden = true;
    plannerApplyButton.disabled = true;
    plannerPreview = null;
});

plannerApplyButton.addEventListener("click", () => {
    if (!plannerPreview) return;
    const confirmed = window.confirm("Stage these projected totals in the calculator? They will not be saved to history until you select Calculate attendance.");
    if (!confirmed) return;
    conductedInput.value = String(plannerPreview.conducted);
    attendedInput.value = String(plannerPreview.attended);
    formError.textContent = "Projected totals are staged. Select Calculate attendance to save a snapshot.";
    results.hidden = true;
    conductedInput.focus();
});

promiseButton.addEventListener("click", () => {
    promiseConfirmation.textContent = "Abba! Finally manchi decision teesukunnav ra babu! 😂👏";
    promiseConfirmation.hidden = false;
    promiseButton.disabled = true;
});

function showAttendance(conducted, attended) {
    const missed = conducted - attended;
    const percentage = (attended / conducted) * 100;
    const targetMargin = 4n * BigInt(attended) - 3n * BigInt(conducted);
    const isBelowTarget = targetMargin < 0n;
    const isExactlyAtTarget = targetMargin === 0n;

    animateAttendancePercentage(percentage);
    document.getElementById("conducted-total").textContent = conducted.toLocaleString();
    document.getElementById("attended-total").textContent = attended.toLocaleString();
    document.getElementById("missed-total").textContent = missed.toLocaleString();
    progressMeter.setAttribute("aria-valuenow", percentage.toFixed(1));
    progressRing.style.strokeDasharray = `${ringCircumference}`;
    progressRing.style.strokeDashoffset = `${ringCircumference * (1 - percentage / 100)}`;
    progressRing.classList.toggle("is-below", isBelowTarget);
    progressRing.classList.toggle("is-exact", isExactlyAtTarget);
    progressRing.classList.toggle("is-success", !isBelowTarget && !isExactlyAtTarget);

    const status = document.getElementById("attendance-status");
    const statusState = isBelowTarget ? "below" : isExactlyAtTarget ? "exact" : "above";
    const previousStatusState = status.dataset.attendanceState;
    status.dataset.attendanceState = statusState;
    status.textContent = isBelowTarget ? "Below target" : isExactlyAtTarget ? "Exactly 75%" : "On track";
    status.className = `attendance-status ${isBelowTarget ? "is-below" : isExactlyAtTarget ? "is-exact" : "is-on-track is-achieved"}`;
    if (previousStatusState !== statusState && !reducedMotionPreference.matches) {
        status.classList.remove("status-pulse");
        void status.offsetWidth;
        status.classList.add("status-pulse");
        window.setTimeout(() => status.classList.remove("status-pulse"), 700);
    }

    const guidance = document.getElementById("guidance");
    const actionCard = document.getElementById("action-card");
    const actionIcon = document.getElementById("action-icon");
    const actionLabel = document.getElementById("action-label");
    const actionMessage = document.getElementById("action-message");
    promiseConfirmation.hidden = true;
    promiseButton.disabled = false;

    if (isBelowTarget) {
        const requiredClasses = (-targetMargin).toString();
        guidance.textContent = `Your current attendance is ${percentage.toFixed(2)}%. Classes needed to reach 75%: ${requiredClasses}. Safe bunks right now: 0.`;
        actionCard.className = "action-card";
        actionIcon.textContent = "\u2197";
        actionLabel.textContent = "Your next milestone";
        actionMessage.textContent = `Attend the next ${requiredClasses} ${requiredClasses === "1" ? "class" : "classes"} without missing any to reach at least 75%.`;
        roastCard.className = "roast-card is-below";
        roastEmoji.textContent = "😭";
        roastKicker.textContent = "ATTENDANCE EMERGENCY";
        roastHeadline.textContent = "MUSUKONI COLLEGE KI VELLU RA! 😭📚";
        roastMessage.textContent = chooseRoast("below");
        roastWarningIcon.hidden = false;
        promiseButton.hidden = false;
    } else if (isExactlyAtTarget) {
        guidance.textContent = "Exactly 75%. Classes needed to reach the target: 0. Safe bunks right now: 0.";
        actionCard.className = "action-card is-warning";
        actionIcon.textContent = "!";
        actionLabel.textContent = "Right at the threshold";
        actionMessage.textContent = "Your attendance is exactly 75%. Avoid skipping classes because any additional absence will take you below the threshold.";
        roastCard.className = "roast-card is-exact";
        roastEmoji.textContent = "😬";
        roastKicker.textContent = "BORDERLINE STATUS";
        roastHeadline.textContent = "BUNK KOTTADAM AAPU RA! ⚠️😂";
        roastMessage.textContent = chooseRoast("exact");
        roastWarningIcon.hidden = false;
        promiseButton.hidden = true;
    } else {
        const skippableClasses = (targetMargin / 3n).toString();
        guidance.textContent = `Your current attendance is ${percentage.toFixed(2)}%. Classes needed to reach 75%: 0. Safe bunks: up to ${skippableClasses} consecutive ${skippableClasses === "1" ? "class" : "classes"}.`;
        actionCard.className = "action-card is-positive";
        actionIcon.textContent = "\u2713";
        actionLabel.textContent = "Your attendance buffer";
        actionMessage.textContent = `Great! You can skip up to ${skippableClasses} consecutive ${skippableClasses === "1" ? "class" : "classes"} and still maintain at least 75% attendance.`;
        roastCard.className = "roast-card is-above";
        roastEmoji.textContent = "😎";
        roastKicker.textContent = "SAFE ZONE ACHIEVED";
        roastHeadline.textContent = "ATTENDANCE SUPER RA MOWA! 😎🔥";
        roastMessage.textContent = chooseRoast("above");
        roastWarningIcon.hidden = true;
        promiseButton.hidden = true;
    }

    results.hidden = false;
}

startMotionExperience();
    