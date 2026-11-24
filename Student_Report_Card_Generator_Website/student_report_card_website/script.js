const subjects = [
  { id: "python", name: "Python" },
  { id: "maths", name: "Mathematics" },
  { id: "physics", name: "Physics" },
  { id: "chemistry", name: "Chemistry" },
  { id: "english", name: "English" }
];

const form = document.getElementById("reportForm");
const resultPanel = document.getElementById("resultPanel");
const reportCard = document.getElementById("reportCard");
const errorMessage = document.getElementById("errorMessage");
const recordsBody = document.getElementById("recordsBody");
let currentReport = null;

function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

const sessionInput = document.getElementById("session");

sessionInput.addEventListener("input", function () {

  // Allow numbers only
  let value = this.value.replace(/[^0-9]/g, "");

  // Maximum 8 digits
  value = value.substring(0, 8);

  // Automatically add hyphen after 4 digits
  if (value.length > 4) {
    value = value.substring(0, 4) + "-" + value.substring(4);
  }

  this.value = value;
});

function readStudentData() {
  const student = {
    name: document.getElementById("studentName").value.trim(),
    roll: document.getElementById("rollNumber").value.trim(),
    studentClass: document.getElementById("studentClass").value.trim(),
    session: document.getElementById("session").value.trim(),
    marks: {}
  };

  for (const subject of subjects) {
    const rawValue = document.getElementById(subject.id).value;
    const mark = Number(rawValue);

    if (rawValue === "" || !Number.isInteger(mark) || mark < 0 || mark > 100) {
      throw new Error(`Enter a whole-number mark from 0 to 100 for ${subject.name}.`);
    }
    student.marks[subject.id] = mark;
  }

  if (!student.name || !student.roll || !student.studentClass) {
    throw new Error("Please fill in the student name, roll number and class/semester.");
  }

  const years = student.session.split("-");

  if (
    years.length !== 2 ||
    years[0].length !== 4 ||
    years[1].length !== 4 ||
    Number(years[1]) < Number(years[0])
  ) {
    throw new Error("Please enter a valid academic year range, e.g. 2026-2027.");
  }
  return student;
}

function calculateReport(student) {
  const total = Object.values(student.marks).reduce((sum, mark) => sum + mark, 0);
  const percentage = total / subjects.length;
  const grade = getGrade(percentage);
  const passed = Object.values(student.marks).every(mark => mark >= 33);

  return {
    ...student,
    total,
    percentage: percentage.toFixed(2),
    grade,
    result: passed ? "PASS" : "FAIL",
    createdAt: new Date().toLocaleString()
  };
}

function showReport(report) {
  const subjectRows = subjects.map(subject => `
    <tr>
      <td>${subject.name}</td>
      <td>${report.marks[subject.id]} / 100</td>
    </tr>
  `).join("");

  reportCard.innerHTML = `
    <div class="report-title">
      <h3>STUDENT REPORT CARD</h3>
      <p>Academic Session: ${escapeHTML(report.session || "Not specified")}</p>
    </div>
    <div class="student-meta">
      <div><strong>Student name:</strong> ${escapeHTML(report.name)}</div>
      <div><strong>Roll number:</strong> ${escapeHTML(report.roll)}</div>
      <div><strong>Class / Semester:</strong> ${escapeHTML(report.studentClass)}</div>
      <div><strong>Date generated:</strong> ${escapeHTML(report.createdAt)}</div>
    </div>
    <table class="report-table">
      <thead><tr><th>Subject</th><th>Marks obtained</th></tr></thead>
      <tbody>${subjectRows}</tbody>
      <tfoot><tr><th>Total</th><th>${report.total} / 500</th></tr></tfoot>
    </table>
    <div class="summary">
      <div class="metric"><span>Percentage</span><strong>${report.percentage}%</strong></div>
      <div class="metric"><span>Grade</span><strong>${report.grade}</strong></div>
      <div class="metric"><span>Final result</span><strong>${report.result}</strong></div>
    </div>
    <div class="result-status ${report.result === "PASS" ? "pass" : "fail"}">
      ${report.result === "PASS" ? "Congratulations! Student has passed." : "Student has not passed: at least one subject is below 33 marks."}
    </div>
  `;
  resultPanel.hidden = false;
  document.getElementById("saveMessage").textContent = "";
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function getSavedReports() {
  try {
    return JSON.parse(localStorage.getItem("studentReports") || "[]");
  } catch {
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem("studentReports", JSON.stringify(reports));
}

function renderSavedReports() {
  const reports = getSavedReports();
  if (reports.length === 0) {
    recordsBody.innerHTML = '<tr><td colspan="6" class="empty">No reports saved yet.</td></tr>';
    return;
  }

  recordsBody.innerHTML = reports.map(report => `
    <tr>
      <td>${escapeHTML(report.name)}</td>
      <td>${escapeHTML(report.roll)}</td>
      <td>${report.percentage}%</td>
      <td>${report.grade}</td>
      <td class="${report.result === "PASS" ? "pass" : "fail"}">${report.result}</td>
      <td><button class="delete-button" data-id="${escapeHTML(report.id)}">Delete</button></td>
    </tr>
  `).join("");
}

form.addEventListener("submit", event => {
  event.preventDefault();
  errorMessage.textContent = "";
  try {
    const student = readStudentData();
    currentReport = calculateReport(student);
    showReport(currentReport);
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

document.getElementById("clearButton").addEventListener("click", () => {
  errorMessage.textContent = "";
  resultPanel.hidden = true;
  currentReport = null;
});

document.getElementById("printButton").addEventListener("click", () => window.print());

document.getElementById("saveButton").addEventListener("click", () => {
  if (!currentReport) return;

  const reports = getSavedReports();
  const duplicateIndex = reports.findIndex(report => report.roll === currentReport.roll);
  const reportToSave = { ...currentReport, id: `${Date.now()}-${currentReport.roll}` };

  if (duplicateIndex >= 0) {
    reports[duplicateIndex] = reportToSave;
  } else {
    reports.push(reportToSave);
  }

  try {
    saveReports(reports);
    renderSavedReports();
    document.getElementById("saveMessage").textContent =
      "Report saved in this browser. A report with the same roll number is replaced.";
  } catch {
    document.getElementById("saveMessage").textContent =
      "Could not save the report. Check your browser storage settings.";
  }
});

recordsBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  const remainingReports = getSavedReports().filter(report => report.id !== button.dataset.id);
  saveReports(remainingReports);
  renderSavedReports();
});

renderSavedReports();
