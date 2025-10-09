/* =========================================================
   script.js  ·  Unified JS (fresh build + merged legacy)
   - Utilities, Autocomplete (ARIA)
   - Progress Gate / Special-project Proposal / Exam Submit
   - Sidebar Toggle, KPI format, Task Filter, Link-card A11y
   - Requests (Officer): Tabs + Filters + Detail/Schedule
   - Advisor dashboard + Feedback modal (merged, safe-bind)
   ========================================================= */

/* ---------------------------
   Utilities
--------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const text = (el, v) => { if (el) el.textContent = String(v); };
const show = (el, display = "block") => { if (el) el.style.display = display; };
const hide = (el) => { if (el) el.style.display = "none"; };
const val = (id) => document.getElementById(id)?.value?.trim() ?? "";
const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function uniqueNonEmpty(arr) {
  const v = arr.map(s => (s || "").trim()).filter(Boolean);
  return v.length === new Set(v).size;
}

const debounce = (fn, ms = 150) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const JSONX = {
  parse: (s, fb = null) => { try { return JSON.parse(s); } catch { return fb; } },
  stringify: (o) => { try { return JSON.stringify(o); } catch { return ""; } }
};

const LS = {
  get: (k, fb = null) => JSONX.parse(localStorage.getItem(k) ?? "", fb),
  set: (k, v) => localStorage.setItem(k, JSONX.stringify(v)),
  getStr: (k, fb = "") => (localStorage.getItem(k) ?? fb)
};

/* ---------------------------
   Datasets (for autocomplete, labels)
--------------------------- */
const teachers = [
  "รศ.ดร.อนิราช มิ่งขวัญ", "ผศ.อรบุษป์ วุฒิกมลชัย", "ผศ.ดร.บีสุดา ดาวเรือง", "ผศ.ดร.ขนิษฐา นามี",
  "อ.ดร.กาญจน ณ ศรีธะ", "ผศ.นพดล บูรณ์กุศล", "ผศ.จสต.นพเก้า ทองใบ", "ผศ.ดร.นิติการ นาคเจือทอง",
  "ผศ.ดร.นัฎฐพันธ์ นาคพงษ์", "ผศ.นิมิต ศรีคำทา", "อ.ดร.พิทย์พิมล ชูรอด", "ผศ.ดร.พาฝัน ดวงไพศาล",
  "อ.ดร.ประดิษฐ์ พิทักษ์เสถียรกุล", "ผศ.พีระศักดิ์ เสรีกุล", "ผศ.สมชัย เชียงพงศ์พันธุ์",
  "ผศ.ดร.สุปีติ กุลจันทร์", "ผศ.สิวาลัย จินเจือ", "ผศ.ดร.สุพาภรณ์ ซิ้มเจริญ", "ผศ.ดร.ศรายุทธ ธเนศสกุลวัฒนา",
  "อ.ดร.ศิรินทรา แว่วศรี", "อ.ดร.วัชรชัย คงศิริวัฒนา", "ผศ.ดร.วันทนี ประจวบศุภกิจ", "รศ.ดร.ยุพิน สรรพคุณ"
];
const branches = ["IT", "ITI", "INE", "INET", "ITT"];

/* ---------------------------
   Autocomplete (accessible)
--------------------------- */
function attachAutocomplete(inputId, listId, dataset) {
  const inputEl = document.getElementById(inputId);
  const listEl = document.getElementById(listId);
  if (!inputEl || !listEl) return;

  let activeIndex = -1;
  inputEl.setAttribute("autocomplete", "off");
  listEl.setAttribute("role", "listbox");
  inputEl.setAttribute("role", "combobox");
  inputEl.setAttribute("aria-autocomplete", "list");
  inputEl.setAttribute("aria-expanded", "false");
  inputEl.setAttribute("aria-controls", listId);

  function close() {
    listEl.classList.remove("open");
    listEl.innerHTML = "";
    inputEl.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  }
  function select(textValue) {
    inputEl.value = textValue;
    close();
    inputEl.dispatchEvent(new Event("change"));
  }
  function render(items) {
    listEl.innerHTML = "";
    if (!items.length) { close(); return; }
    items.forEach((name, i) => {
      const div = document.createElement("div");
      div.className = "dropdown-item";
      div.setAttribute("role", "option");
      div.setAttribute("id", `${listId}-opt-${i}`);
      div.textContent = name;
      div.addEventListener("mousedown", (e) => { e.preventDefault(); select(name); });
      listEl.appendChild(div);
    });
    inputEl.setAttribute("aria-expanded", "true");
    listEl.classList.add("open");
  }
  function filter(q) {
    const v = (q ?? "").trim().toLowerCase();
    if (!v) { close(); return; }
    render(dataset.filter(t => t.toLowerCase().includes(v)));
  }

  const runFilter = debounce(() => filter(inputEl.value), 80);
  inputEl.addEventListener("input", runFilter);
  inputEl.addEventListener("focus", () => { if (inputEl.value?.trim()) filter(inputEl.value); });
  inputEl.addEventListener("keydown", (e) => {
    const items = Array.from(listEl.querySelectorAll(".dropdown-item"));
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) {
      e.preventDefault();
      activeIndex = e.key === "ArrowDown"
        ? (activeIndex + 1) % items.length
        : (activeIndex - 1 + items.length) % items.length;
      items.forEach((el, i) => { el.style.background = (i === activeIndex) ? "#ffe9db" : ""; });
      inputEl.setAttribute("aria-activedescendant", `${listId}-opt-${activeIndex}`);
      return;
    }
    if (e.key === "Home" && items.length) { e.preventDefault(); activeIndex = 0; items[0].style.background = "#ffe9db"; }
    if (e.key === "End" && items.length) { e.preventDefault(); activeIndex = items.length - 1; items.at(-1).style.background = "#ffe9db"; }
    if (e.key === "Enter" && activeIndex >= 0 && items.length) { e.preventDefault(); select(items[activeIndex].textContent); }
    if (e.key === "Escape") { close(); }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${listId}`)) close();
  });
}

/* ---------------------------
   Progress Gate (ยื่นสอบเมื่อ 100%)
--------------------------- */
function initProgressGate() {
  const progressFill = $("#progress");
  const percentText = $("#percent");
  const examBtn = $("#examBtn");
  const remainingText = $("#remainingText");
  if (!progressFill || !percentText || !examBtn || !remainingText) return;

  let progressValue = Number(progressFill.getAttribute("data-progress") ?? "100");
  if (Number.isNaN(progressValue)) progressValue = 0;
  progressValue = clamp(progressValue, 0, 100);

  const updateProgress = () => {
    progressFill.style.width = progressValue + "%";
    text(percentText, progressValue + "%");
    if (progressValue >= 100) {
      examBtn.disabled = false;
      text(examBtn, "✓ ยื่นสอบ");
      hide(remainingText);
    } else {
      examBtn.disabled = true;
      text(examBtn, "🔒 ยื่นสอบ (ต้องครบ 100%)");
      text(remainingText, `เหลืออีก ${100 - progressValue}% เพื่อปลดล็อกการยื่นสอบ`);
      show(remainingText);
    }
  };
  updateProgress();
  examBtn.addEventListener("click", () => { if (!examBtn.disabled) window.location.href = "exam-submit.html"; });
}

/* ---------------------------
   Special-project-1 (เสนอหัวข้อ)
--------------------------- */
function initSpecialProjectProposal() {
  attachAutocomplete("branchInput", "branchList", branches);
  attachAutocomplete("teacherInput", "teacherList", teachers);
  attachAutocomplete("coTeacherInput", "coTeacherList", teachers);

  const saveBtn = $("#btnSaveProposal");
  const goExam = $("#btnGoExam");
  const titleEl = $("#projectTitleInput");
  const advisorInProposal = $("#teacherInput");
  const coAdvisorInProposal = $("#coTeacherInput");
  const branchInProposal = $("#branchInput");
  const spError = $("#spError");
  const spSaved = $("#spSaved");

  saveBtn?.addEventListener("click", () => {
    const title = titleEl?.value?.trim() ?? "";
    if (!title) {
      show(spError); text(spError, "⚠ กรุณากรอกหัวข้อโครงงาน"); hide(spSaved); return;
    }
    const advisor = advisorInProposal?.value?.trim();
    const coAdvisor = coAdvisorInProposal?.value?.trim();

    if (advisor && coAdvisor && advisor === coAdvisor) {
      show(spError); text(spError, "⚠ กรุณาเลือกอาจารย์ที่ปรึกษาและที่ปรึกษาร่วมเป็นคนละท่าน"); return;
    }

    localStorage.setItem("sp_title", title);
    if (advisor) localStorage.setItem("sp_advisor", advisor);
    if (coAdvisor) localStorage.setItem("sp_coadvisor", coAdvisor);
    if (branchInProposal?.value) localStorage.setItem("sp_branch", branchInProposal.value.trim());
    hide(spError); show(spSaved); setTimeout(() => hide(spSaved), 1600);
  });

  goExam?.addEventListener("click", () => {
    const title = titleEl?.value?.trim() ?? "";
    if (!title) { show(spError); text(spError, "⚠ กรุณากรอกหัวข้อโครงงานก่อนไปหน้ายื่นสอบ"); return; }
    localStorage.setItem("sp_title", title);
    window.location.href = "exam-submit.html";
  });
}

/* ---------------------------
   exam-submit (ยื่นสอบหัวข้อ)
--------------------------- */
function initExamSubmit() {
  const projTitle = $("#projTitle");
  if (projTitle) {
    const saved = localStorage.getItem("sp_title");
    projTitle.value = (saved?.trim() ? saved : "ระบบ AI Chatbot สำหรับการสนทนาทั่วไป");
    projTitle.readOnly = true;
  }

  attachAutocomplete("advisorInput", "advisorList", teachers);
  attachAutocomplete("committee1Input", "committee1List", teachers);
  attachAutocomplete("committee2Input", "committee2List", teachers);
  attachAutocomplete("committee3Input", "committee3List", teachers);
  attachAutocomplete("committee4Input", "committee4List", teachers);

  const oldAdvisor = localStorage.getItem("sp_advisor");
  if (oldAdvisor && $("#advisorInput")) setVal("advisorInput", oldAdvisor);

  const submitExam = $("#submitExam");
  const examError = $("#examError");
  const examSuccess = $("#examSuccess");

  submitExam?.addEventListener("click", () => {
    const advisor = val("advisorInput");
    const c1 = val("committee1Input");
    const c2 = val("committee2Input");
    const c3 = val("committee3Input");
    const c4 = val("committee4Input");

    // ต้องมีที่ปรึกษา + กรรมการอย่างน้อย 3 คน
    if (!advisor || !c1 || !c2) {
      show(examError); text(examError, "⚠ กรุณากรอกอาจารย์ที่ปรึกษา และกรรมการอย่างน้อย 3 คน");
      hide(examSuccess); return;
    }

    // ห้ามซ้ำกัน (ที่ปรึกษา/กรรมการทั้งหมด)
    const all = [advisor, c1, c2, c3, c4].filter(Boolean);
    if (!uniqueNonEmpty(all)) {
      show(examError); text(examError, "⚠ รายชื่อซ้ำกัน กรุณาเลือกคนละท่าน"); hide(examSuccess); return;
    }

    hide(examError); show(examSuccess);
    localStorage.setItem("exam_advisor", advisor);
    localStorage.setItem("exam_committee", JSON.stringify([c1, c2, c3, c4].filter(Boolean)));
  });
}

/* ---------------------------
   Card Keyboard Accessibility
--------------------------- */
function initLinkCards() {
  const cards = $$(".link-card");
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener("focus", () => card.querySelector(".form-card")?.classList.add("focus-visible"));
    card.addEventListener("blur", () => card.querySelector(".form-card")?.classList.remove("focus-visible"));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const url = card.getAttribute("href");
        if (url) window.location.href = url;
      }
    });
  });
}

/* ---------------------------
   Sidebar Toggle + KPI + Task Filter
--------------------------- */
function initSidebarToggle() {
  const btn = $("#menuToggle");
  const sidebar = $("#sidebar");
  if (!btn || !sidebar) return;
  if (btn.dataset.bound) return; // กัน bind ซ้ำ

  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function initKPI() {
  ["kpiStudents", "kpiProjects", "kpiDone"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const raw = el.getAttribute("data-count");
    if (raw != null) {
      const n = Number(raw);
      if (!Number.isNaN(n)) el.textContent = n.toLocaleString("th-TH");
    }
  });

  $$(".kpi-link").forEach(a => {
    if (a.dataset.bound) return;
    a.dataset.bound = "1";
    a.addEventListener("keydown", e => { if (e.key === " ") { e.preventDefault(); a.click(); } });
  });
}

function initTaskFilter() {
  const searchInput = $("#searchInput");
  const statusFilter = $("#statusFilter");
  const taskList = $("#taskList");
  if (!taskList) return;
  if (taskList.dataset.bound) return;

  taskList.dataset.bound = "1";
  const apply = debounce(() => {
    const q = (searchInput?.value || "").toLowerCase().trim();
    const st = statusFilter?.value || "";
    Array.from(taskList.children).forEach(li => {
      const textContent = li.textContent.toLowerCase();
      const byText = !q || textContent.includes(q);
      const bySt = !st || (li.dataset.status === st);
      li.style.display = (byText && bySt) ? "" : "none";
    });
  }, 120);

  searchInput?.addEventListener("input", apply);
  statusFilter?.addEventListener("change", apply);
  apply();
}

/* ---------------------------
   Officer Requests (Tabs + Detail/Schedule)
--------------------------- */
function initOfficerRequests() {
  // Tabs
  const tabs = $$(".req-tab");
  const panels = $$("[role=tabpanel]");
  tabs.forEach(tab => {
    if (tab.dataset.bound) return;
    tab.dataset.bound = "1";
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      panels.forEach(p => p.hidden = true);
      const target = document.getElementById("tab-" + tab.dataset.tab);
      if (target) target.hidden = false;
    });
  });

  // Filters (topic)
  const topicSearch = $("#topicSearch");
  const topicStatus = $("#topicStatus");
  const topicRows = () => $$("#topicTable tbody tr");
  const applyTopic = debounce(() => {
    const q = (topicSearch?.value || "").toLowerCase().trim();
    const st = topicStatus?.value || "";
    topicRows().forEach(tr => {
      const okText = !q || tr.textContent.toLowerCase().includes(q);
      const okSt = !st || tr.dataset.status === st;
      tr.style.display = (okText && okSt) ? "" : "none";
    });
  }, 120);
  topicSearch?.addEventListener("input", applyTopic);
  topicStatus?.addEventListener("change", applyTopic);
  applyTopic();

  // Filters (project)
  const projSearch = $("#projSearch");
  const projStatus = $("#projStatus");
  const projRows = () => $$("#projTable tbody tr");
  const applyProj = debounce(() => {
    const q = (projSearch?.value || "").toLowerCase().trim();
    const st = (projStatus?.value || "");
    projRows().forEach(tr => {
      const okText = !q || tr.textContent.toLowerCase().includes(q);
      const okSt = !st || tr.dataset.status === st;
      tr.style.display = (okText && okSt) ? "" : "none";
    });
  }, 120);
  projSearch?.addEventListener("input", applyProj);
  projStatus?.addEventListener("change", applyProj);
  applyProj();

  // === Modals: Detail & Schedule (event delegation ครั้งเดียว) ===
  const detailModal = $("#reqDetail");
  const scheduleModal = $("#scheduleModal");
  const detailClose = $("#detailClose");
  const detailCancel = $("#detailCancel");
  const scheduleClose = $("#scheduleClose");
  const btnCancelSchedule = $("#btnCancelSchedule");
  const btnSaveSchedule = $("#btnSaveSchedule");

  const open = (m) => m?.setAttribute("aria-hidden", "false");
  const close = (m) => m?.setAttribute("aria-hidden", "true");

  detailClose?.addEventListener("click", () => close(detailModal));
  detailCancel?.addEventListener("click", () => close(detailModal));
  detailModal?.addEventListener("click", (e) => { if (e.target === detailModal) close(detailModal); });

  scheduleClose?.addEventListener("click", () => close(scheduleModal));
  btnCancelSchedule?.addEventListener("click", () => close(scheduleModal));
  scheduleModal?.addEventListener("click", (e) => { if (e.target === scheduleModal) close(scheduleModal); });

  const safeParseJSON = (str, fb) => { try { return JSON.parse(str); } catch { return fb; } };

  function fillDetail(row) {
    const map = {
      dType: "type", dDate: "date", dTeam: "team",
      dBranch: "branch", dAdvisor: "advisor",
      dCoadvisor: "coadvisor", dTopic: "title",
      dObjective: "objective", dResult: "result",
      dScope: "scope"
    };
    Object.entries(map).forEach(([id, key]) => {
      const v = row.dataset[key] ?? "-";
      const el = document.getElementById(id);
      if (el) el.textContent = v || "-";
    });

    // --- Students (รองรับ data-students JSON และ data-students1/2/...) ---
    let list = safeParseJSON(row.dataset.students, null);
    if (!Array.isArray(list)) {
      list = [];
      for (const name of row.getAttributeNames()) {
        if (/^data-students\d*$/i.test(name)) {
          const v = row.getAttribute(name);
          if (v && v.trim()) list.push(v.trim());
        }
      }
    }
    // เติมลง #dStudents1 / #dStudents2 (ตาม HTML ล่าสุด)
    const s1 = $("#dStudents1"), s2 = $("#dStudents2");
    if (s1) s1.textContent = list[0] || "-";
    if (s2) s2.textContent = list[1] || (list[0] ? "" : "-");

    // ไฟล์แนบ
    const files = safeParseJSON(row.dataset.files, []);
    const ul = $("#dFiles");
    if (ul) {
      ul.innerHTML = "";
      if (Array.isArray(files) && files.length) {
        files.forEach(f => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = f.url || "#"; a.target = "_blank"; a.rel = "noopener";
          a.textContent = f.name || "ไฟล์แนบ";
          li.appendChild(a); ul.appendChild(li);
        });
      } else {
        const li = document.createElement("li"); li.textContent = "— ไม่มีไฟล์แนบ —"; ul.appendChild(li);
      }
    }
  }

  // เก็บแถวปัจจุบันของหน้ารายละเอียดเพื่อใช้กด อนุมัติ/แก้ไข/ไม่ผ่าน
  let currentRowDetail = null;

  document.addEventListener("click", (e) => {
    const btnDetail = e.target.closest("[data-action=detail]");
    if (btnDetail) {
      const row = btnDetail.closest("tr");
      if (row) { currentRowDetail = row; fillDetail(row); open(detailModal); }
      return;
    }
    const btnSched = e.target.closest("[data-action=schedule]");
    if (btnSched) {
      const row = btnSched.closest("tr");
      if (row) {
        localStorage.setItem("schedule_target", JSON.stringify({
          date: row.dataset.date, team: row.dataset.team, title: row.dataset.title,
          advisor: row.dataset.advisor, branch: row.dataset.branch
        }));
        // เติมชื่อประธานลงช่อง (ถ้ามีค่า) — ช่องถูก disabled อยู่แล้ว
        const chair = $("#committee1Input");
        if (chair) chair.value = row.dataset.advisor || "";
        open(scheduleModal);
      }
    }
  });

  // ปุ่มสถานะในโมดัลรายละเอียด (ผูกครั้งเดียว)
  function bindOnce(el, ev, handler, flagName) {
    if (!el || el.dataset[flagName]) return;
    el.dataset[flagName] = "1";
    el.addEventListener(ev, handler);
  }
  const btnApprove = $("#btnApprove");
  const btnApproveEdit = $("#btnApproveEdit");
  const btnReject = $("#btnReject");
  const mapHTML = {
    "อนุมัติ": '<span class="p p-ok">อนุมัติ</span>',
    "แก้ไข": '<span class="p p-edit">แก้ไข</span>',
    "ไม่ผ่าน": '<span class="p p-no">ไม่ผ่าน</span>'
  };
  function setRowStatus(row, statusText) {
    if (!row) return;
    row.dataset.status = statusText;
    const td = row.querySelector('td[data-col="status"]');
    if (td) td.innerHTML = mapHTML[statusText] || statusText;
    // จำค่าลง localStorage ตามทีม/หัวข้อ
    const team = row.dataset.team || "-";
    const title = row.dataset.title || "-";
    LS.set(`officer_status__${team}__${title}`, { status: statusText, updatedAt: new Date().toISOString() });
    // ปิดโมดัล
    detailModal?.setAttribute("aria-hidden", "true");
  }
  bindOnce(btnApprove, "click", () => setRowStatus(currentRowDetail, "อนุมัติ"), "bound");
  bindOnce(btnApproveEdit, "click", () => setRowStatus(currentRowDetail, "แก้ไข"), "bound");
  bindOnce(btnReject, "click", () => setRowStatus(currentRowDetail, "ไม่ผ่าน"), "bound");

  // === บันทึกกำหนดสอบ ===
  // กำหนดสอบ: ต้องมี วัน/เวลา/ห้อง + กรรมการ 3 คน (ช่อง 2–4) ไม่บังคับประธาน
  // แนบ autocomplete เฉพาะช่องที่แก้ได้ (2–4)
  attachAutocomplete("committee2Input", "committee2List", teachers);
  attachAutocomplete("committee3Input", "committee3List", teachers);
  attachAutocomplete("committee4Input", "committee4List", teachers);

  // ปุ่มบันทึก (ป้องกัน bind ซ้ำ)
  if (btnSaveSchedule && !btnSaveSchedule.dataset.bound) {
    btnSaveSchedule.dataset.bound = "1";
    btnSaveSchedule.addEventListener("click", () => {
      const d = $("#examDate")?.value;
      const t = $("#examTime")?.value;
      const r = $("#examRoom")?.value?.trim();

      const cA = $("#committee1Input")?.value?.trim(); // ประธาน (optional / disabled)
      const c1 = $("#committee2Input")?.value?.trim();
      const c2 = $("#committee3Input")?.value?.trim();
      const c3 = $("#committee4Input")?.value?.trim();

      if (!d || !t || !r) { alert("กรุณากรอก วันสอบ / เวลา / ห้องสอบ ให้ครบ"); return; }
      if (!c1 || !c2 || !c3) { alert("กรุณากรอกชื่อกรรมการสอบให้ครบทั้ง 3 คน (ไม่รวมประธาน)"); return; }

      const set = new Set([c1, c2, c3, cA].filter(Boolean));
      if (set.size < ([c1, c2, c3].filter(Boolean).length + (cA ? 1 : 0))) {
        alert("รายชื่อกรรมการ/ประธานซ้ำกัน กรุณาเลือกคนละท่าน"); return;
      }

      const target = LS.get("schedule_target", null);
      const payload = {
        ...target,
        examDate: d, examTime: t, room: r,
        chair: cA || null,
        committees: [c1, c2, c3],
        savedAt: new Date().toISOString()
      };
      LS.set("schedule_last_saved", payload);

      alert(
        `บันทึกกำหนดสอบแล้ว
ทีม/หัวข้อ: ${payload?.team || "-"} / ${payload?.title || "-"}
วันที่: ${d}
เวลา: ${t}
ห้อง: ${r}
ประธาน: ${payload.chair || "-"}
กรรมการ:
  1) ${c1}
  2) ${c2}
  3) ${c3}`
      );
      close(scheduleModal);
    });
  }
}

/* ---------------------------
   Recent Table (Dashboard) helpers
--------------------------- */
function initDashboardHelpers() {
  const searchInput = $("#qSearch");
  const statusFilter = $("#statusFilter");
  const branchFilter = $("#branchFilter");
  const table = $("#recentTable");
  if (!table) return;

  const rows = () => $$("#recentTable tbody tr");

  const applyFilters = debounce(() => {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const st = statusFilter?.value || '';
    const br = branchFilter?.value || '';
    let visible = 0;

    rows().forEach(tr => {
      const textC = tr.textContent.toLowerCase();
      const rSt = tr.dataset.status || '';
      const rBr = tr.dataset.branch || '';
      const ok = (!q || textC.includes(q)) && (!st || rSt === st) && (!br || rBr === br);
      tr.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });

    const counter = $("#resultCounter");
    if (counter) counter.textContent = `แสดง ${visible} รายการ`;

    updateSummaries();
    buildNotifications();
  }, 120);

  function updateSummaries() {
    const visibleRows = rows().filter(tr => tr.style.display !== 'none');
    const pending = visibleRows.filter(tr => tr.dataset.status === 'รออนุมัติ').length;
    const dueSoon = visibleRows.filter(tr => {
      const today = new Date();
      const in14 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      const dd = tr.dataset.duedate ? new Date(tr.dataset.duedate) : null;
      return dd && dd <= in14 && dd >= today;
    }).length;
    const missing = visibleRows.filter(tr => tr.dataset.docs === 'missing').length;

    const s1 = $("#statPending"); if (s1) s1.textContent = pending;
    const s2 = $("#statDueSoon"); if (s2) s2.textContent = dueSoon;
    const s3 = $("#statMissingDocs"); if (s3) s3.textContent = missing;
  }

  function buildNotifications() {
    const list = $("#notifyList"); if (!list) return;
    list.innerHTML = '';
    const visibleRows = rows().filter(tr => tr.style.display !== 'none');
    visibleRows.forEach(tr => {
      if (tr.dataset.status === 'รออนุมัติ') {
        const li = document.createElement("li");
        li.innerHTML = `🔔 <strong>${tr.children[1]?.textContent || "โครงงาน"}</strong> รออนุมัติ`;
        list.appendChild(li);
      }
    });
    const count = $("#notifyCount"); if (count) count.textContent = list.children.length;
  }

  ['qSearch', 'statusFilter', 'branchFilter'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('input', applyFilters);
    el?.addEventListener('change', applyFilters);
  });
  applyFilters();
}

/* ---------------------------
   Advisor Dashboard + Feedback (merged)
--------------------------- */
function initAdvisorDashboardAndFeedback() {
  // ระบุ advisor ปัจจุบัน: ?advisor > body[data-advisor] > localStorage
  const urlAdvisor = new URLSearchParams(location.search).get("advisor");
  const bodyAdvisor = document.body.getAttribute("data-advisor")?.trim();
  const storedAdvisor = LS.getStr("current_advisor", "").trim();
  const currentAdvisor = (urlAdvisor || bodyAdvisor || storedAdvisor || "").trim();
  if (currentAdvisor) localStorage.setItem("current_advisor", currentAdvisor);

  const nameEl = $("#advisorName");
  if (nameEl) nameEl.textContent = currentAdvisor ? `ผู้ใช้งาน: ${currentAdvisor}` : "ผู้ใช้งาน: -";

  // แสดงเฉพาะแถวของอาจารย์ใน #advisorTable ถ้ามี
  const tbody = $("#advisorTable tbody");
  if (tbody) {
    Array.from(tbody.querySelectorAll("tr")).forEach(tr => {
      const adv = tr.dataset.advisor?.trim() || "";
      tr.style.display = (!currentAdvisor || adv === currentAdvisor) ? "" : "none";
    });

    // ฟิลเตอร์บนหน้านี้
    const qInput = $("#adSearch");
    const typeSel = $("#adType");
    const stSel = $("#adStatus");
    const apply = debounce(() => {
      const q = (qInput?.value || "").toLowerCase().trim();
      const ty = (typeSel?.value || "");
      const st = (stSel?.value || "");

      let all = 0, pend = 0, exam = 0;
      Array.from(tbody.querySelectorAll("tr")).forEach(tr => {
        const visibleByAdvisor = tr.dataset.advisor?.trim() === currentAdvisor || !currentAdvisor;
        if (!visibleByAdvisor) { tr.style.display = "none"; return; }

        const textC = tr.textContent.toLowerCase();
        const okQ = !q || textC.includes(q);
        const okT = !ty || tr.dataset.type === ty;
        const okS = !st || tr.dataset.status === st;

        const showRow = okQ && okT && okS;
        tr.style.display = showRow ? "" : "none";

        if (showRow) {
          all++;
          if (tr.dataset.status === "รอตรวจ") pend++;
          if (tr.dataset.status === "รอสอบ") exam++;
        }
      });

      const fmt = n => Number(n).toLocaleString("th-TH");
      const kAll = $("#kpiAll");
      const kPending = $("#kpiPending");
      const kExam = $("#kpiExam");
      if (kAll) kAll.textContent = fmt(all);
      if (kPending) kPending.textContent = fmt(pend);
      if (kExam) kExam.textContent = fmt(exam);
    }, 120);

    ["input", "change"].forEach(ev => {
      qInput?.addEventListener(ev, apply);
      typeSel?.addEventListener(ev, apply);
      stSel?.addEventListener(ev, apply);
    });
    apply();
  }

  // --- Feedback modal (ใช้โครงสร้าง id จากหน้าอาจารย์) ---
  const modal = $("#fbModal");
  if (!modal) return; // ไม่มี modal นี้ก็ข้ามส่วน feedback ไป (จะไม่รบกวนหน้าเจ้าหน้าที่)

  const btnClose = $("#fbClose");
  const btnCancel = $("#fbCancel");
  const btnSave = $("#fbSave");
  const btnOpenAll = $("#btnOpenAll");

  const mTeam = $("#mTeam");
  const mBranch = $("#mBranch");
  const mTitle = $("#mTitle");
  const mFiles = $("#mFiles");
  const mPercent = $("#mPercent");
  const mComment = $("#mComment");
  const mError = $("#mError");
  const mSaved = $("#mSaved");

  let currentKey = null;
  const openModal = () => modal?.setAttribute("aria-hidden", "false");
  const closeModal = () => modal?.setAttribute("aria-hidden", "true");

  modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  // เปิดโมดัลเมื่อกดปุ่มให้ความเห็น (event delegation เดียว)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='open-feedback']");
    if (!btn) return;
    const tr = btn.closest("tr"); if (!tr) return;

    const team = tr.dataset.team || "-";
    const branch = tr.dataset.branch || "-";
    const title = tr.dataset.title || "-";
    const files = JSONX.parse(tr.dataset.files || "[]", []);

    text(mTeam, team); text(mBranch, branch); text(mTitle, title);

    if (mFiles) {
      mFiles.innerHTML = "";
      if (Array.isArray(files) && files.length) {
        files.forEach(f => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = f.url || "#"; a.target = "_blank"; a.rel = "noopener";
          a.textContent = f.name || "ไฟล์แนบ";
          li.appendChild(a); mFiles.appendChild(li);
        });
        show(btnOpenAll);
      } else {
        const li = document.createElement("li"); li.textContent = "— ไม่มีไฟล์แนบ —";
        mFiles.appendChild(li); hide(btnOpenAll);
      }
    }

    // โหลดค่าที่เคยบันทึก
    currentKey = `fb_${localStorage.getItem("current_advisor") || "-"}__${team}__${title}`;
    const saved = LS.get(currentKey, null);
    if (mPercent) mPercent.value = saved?.percent ?? "";
    if (mComment) mComment.value = saved?.comment ?? "";

    hide(mError); hide(mSaved); openModal();
  });

  btnOpenAll?.addEventListener("click", () => {
    const links = $$("#mFiles a");
    links.forEach(a => { if (a.href && a.href !== "#") window.open(a.href, "_blank", "noopener"); });
  });

  btnSave?.addEventListener("click", () => {
    let p = Number(mPercent?.value);
    if (Number.isNaN(p)) p = 0;
    p = clamp(p, 0, 100);
    if (Number.isNaN(p)) { show(mError); hide(mSaved); return; }

    const payload = {
      advisor: localStorage.getItem("current_advisor") || "-",
      team: mTeam?.textContent || "-",
      title: mTitle?.textContent || "-",
      percent: p,
      comment: (mComment?.value || "").trim(),
      savedAt: new Date().toISOString()
    };
    LS.set(currentKey || "fb_temp", payload);
    hide(mError); show(mSaved);
    setTimeout(() => { hide(mSaved); closeModal(); }, 900);
  });
}

/* ---------------------------
   Init (single DOMContentLoaded)
--------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Generic UI
  initLinkCards();
  initSidebarToggle();
  initKPI();
  initTaskFilter();

  // Feature pages (safe to run)
  initProgressGate();
  initSpecialProjectProposal();
  initExamSubmit();
  initOfficerRequests();
  initDashboardHelpers();

  // Advisor-specific (รวมของเก่าไว้ที่เดียว และไม่รบกวนหน้าเจ้าหน้าที่)
  initAdvisorDashboardAndFeedback();
});
