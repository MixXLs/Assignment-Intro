const teachers = [
    "รศ.ดร.อนิราช มิ่งขวัญ", "ผศ.อรบุษป์ วุฒิกมลชัย", "ผศ.ดร.บีสุดา ดาวเรือง", "ผศ.ดร.ขนิษฐา นามี",
    "อ.ดร.กาญจน ณ ศรีธะ", "ผศ.นพดล บูรณ์กุศล", "ผศ.จสต.นพเก้า ทองใบ", "ผศ.ดร.นิติการ นาคเจือทอง",
    "ผศ.ดร.นัฎฐพันธ์ นาคพงษ์", "ผศ.นิมิต ศรีคำทา", "อ.ดร.พิทย์พิมล ชูรอด", "ผศ.ดร.พาฝัน ดวงไพศาล",
    "อ.ดร.ประดิษฐ์ พิทักษ์เสถียรกุล", "ผศ.พีระศักดิ์ เสรีกุล", "ผศ.สมชัย เชียงพงศ์พันธุ์",
    "ผศ.ดร.สุปีติ กุลจันทร์", "ผศ.สิวาลัย จินเจือ", "ผศ.ดร.สุพาภรณ์ ซิ้มเจริญ", "ผศ.ดร.ศรายุทธ ธเนศสกุลวัฒนา",
    "อ.ดร.ศิรินทรา แว่วศรี", "อ.ดร.วัชรชัย คงศิริวัฒนา", "ผศ.ดร.วันทนี ประจวบศุภกิจ", "รศ.ดร.ยุพิน สรรพคุณ"
];

const input = document.getElementById("teacherInput");
const list = document.getElementById("teacherList");
let activeIndex = -1;

function render(items) {
    list.innerHTML = "";
    if (!items.length) { list.classList.remove("open"); return; }
    items.forEach((name, idx) => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.textContent = name;
        div.addEventListener("mousedown", (e) => {
            e.preventDefault();
            select(name);
        });
        list.appendChild(div);
    });
    list.classList.add("open");
}

function select(name) {
    input.value = name;
    close();
}

function close() {
    list.classList.remove("open");
    list.innerHTML = "";
    activeIndex = -1;
}

function filter(q) {
    const v = q.trim().toLowerCase();
    if (!v) { close(); return; }
    const results = teachers.filter(t => t.toLowerCase().includes(v));
    render(results);
}

input.addEventListener("input", () => filter(input.value));
input.addEventListener("focus", () => { if (input.value.trim()) filter(input.value); });
input.addEventListener("keydown", (e) => {
    const items = Array.from(list.querySelectorAll(".dropdown-item"));
    if (!items.length) return;
    if (e.key === "ArrowDown") {
        e.preventDefault(); activeIndex = (activeIndex + 1) % items.length; updateActive(items);
    } else if (e.key === "ArrowUp") {
        e.preventDefault(); activeIndex = (activeIndex - 1 + items.length) % items.length; updateActive(items);
    } else if (e.key === "Enter") {
        e.preventDefault(); if (activeIndex >= 0) select(items[activeIndex].textContent);
    } else if (e.key === "Escape") { close(); }
});
function updateActive(items) {
    items.forEach((el, i) => { el.style.background = (i === activeIndex) ? "#ffe9db" : ""; });
}
document.addEventListener("click", (e) => {
    if (!e.target.closest(".teacher-select")) close();
});