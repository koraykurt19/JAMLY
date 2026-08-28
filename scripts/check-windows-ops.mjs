import { execFileSync } from "node:child_process";

const requiredTasks = ["Jamly Retention Cleanup", "Jamly Smoke Artifact Cleanup"];

const serviceState = readJson(
  "Get-Service Jamly,W3SVC | Select-Object Name,Status,StartType | ConvertTo-Json -Compress"
);
const taskState = readJson(
  `Get-ScheduledTask -TaskName ${requiredTasks.map((task) => `'${task}'`).join(",")} | ` +
    "Select-Object TaskName,State | ConvertTo-Json -Compress"
);

const services = Array.isArray(serviceState) ? serviceState : [serviceState];
const tasks = Array.isArray(taskState) ? taskState : [taskState];
const failures = [];

for (const serviceName of ["Jamly", "W3SVC"]) {
  const service = services.find((item) => item.Name === serviceName);
  if (!service || service.Status !== 4) {
    failures.push(`${serviceName} is not running`);
  }
}

for (const taskName of requiredTasks) {
  const task = tasks.find((item) => item.TaskName === taskName);
  if (!task || task.State === 1) {
    failures.push(`${taskName} is missing or disabled`);
  }
}

const report = {
  ok: failures.length === 0,
  checkedAt: new Date().toISOString(),
  services,
  tasks,
  failures
};

console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exit(1);

function readJson(command) {
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
    { encoding: "utf8" }
  );
  return JSON.parse(output);
}
