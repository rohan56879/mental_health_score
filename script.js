const API_URL = "https://mental-health-score-1-h1ua.onrender.com/predict";

const form = document.getElementById("prediction-form");
const submitButton = document.getElementById("submit-button");
const formError = document.getElementById("form-error");
const resultBadge = document.getElementById("result-badge");
const emptyResult = document.getElementById("empty-result");
const loadingResult = document.getElementById("loading-result");
const successResult = document.getElementById("success-result");
const errorResult = document.getElementById("error-result");
const scoreValue = document.getElementById("score-value");
const errorMessage = document.getElementById("error-message");

function showResult(state) {
  emptyResult.hidden = state !== "empty";
  loadingResult.hidden = state !== "loading";
  successResult.hidden = state !== "success";
  errorResult.hidden = state !== "error";

  if (state === "empty") {
    resultBadge.textContent = "AWAITING INPUT";
    resultBadge.classList.remove("ready");
  } else if (state === "loading") {
    resultBadge.textContent = "PROCESSING";
    resultBadge.classList.remove("ready");
  } else if (state === "success") {
    resultBadge.textContent = "COMPLETE";
    resultBadge.classList.add("ready");
  } else {
    resultBadge.textContent = "NEEDS ATTENTION";
    resultBadge.classList.remove("ready");
  }
}

function getPayload() {
  const values = new FormData(form);
  return {
    Age: Number(values.get("Age")),
    Gender: values.get("Gender"),
    Country: values.get("Country").trim(),
    Academic_Level: values.get("Academic_Level"),
    Most_Used_Platform: values.get("Most_Used_Platform"),
    Purpose_Of_Use: values.get("Purpose_Of_Use"),
    Avg_Daily_Usage_Hours: Number(values.get("Avg_Daily_Usage_Hours")),
    Daily_Unlocks: Number(values.get("Daily_Unlocks")),
    Study_Hours: Number(values.get("Study_Hours")),
    Physical_Activity_Hours: Number(values.get("Physical_Activity_Hours")),
    Sleep_Hours_Per_Night: Number(values.get("Sleep_Hours_Per_Night")),
    Stress_Level: values.get("Stress_Level")
  };
}

function validatePayload(data) {
  if (!data.Country) return "Please enter your country.";
  if (!Number.isInteger(data.Age) || data.Age <= 0 || data.Age >= 120) {
    return "Age must be a whole number between 1 and 119.";
  }
  if (!Number.isInteger(data.Daily_Unlocks) || data.Daily_Unlocks < 0) {
    return "Daily unlocks must be a whole number of 0 or more.";
  }
  const hourFields = [
    ["Avg_Daily_Usage_Hours", "Daily usage"],
    ["Study_Hours", "Study hours"],
    ["Physical_Activity_Hours", "Physical activity"],
    ["Sleep_Hours_Per_Night", "Sleep hours"]
  ];
  for (const [key, label] of hourFields) {
    if (!Number.isFinite(data[key]) || data[key] <= 0 || data[key] >= 24) {
      return `${label} must be greater than 0 and less than 24 hours.`;
    }
  }
  return "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;

  if (!form.reportValidity()) return;

  const payload = getPayload();
  const validationMessage = validatePayload(payload);
  if (validationMessage) {
    formError.textContent = validationMessage;
    formError.hidden = false;
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.add("is-loading");
  showResult("loading");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseData = {};
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error("The API returned an unreadable response. Check that FastAPI is running.");
    }

    if (!response.ok) {
      let message = responseData.detail;
      if (Array.isArray(message)) {
        message = message.map((item) => {
          const field = Array.isArray(item.loc) ? item.loc.slice(1).join(" → ") : "input";
          return `${field}: ${item.msg}`;
        }).join(" ");
      }
      throw new Error(message || `Request failed with status ${response.status}.`);
    }

    const score = responseData.predicted_mental_health_score;
    if (typeof score !== "number" || !Number.isFinite(score)) {
      throw new Error("The API response did not contain a valid predicted_mental_health_score.");
    }

    scoreValue.textContent = String(score);
    showResult("success");
  } catch (error) {
    let message = error.message || "An unexpected error occurred.";
    if (error instanceof TypeError && /fetch/i.test(message)) {
      message = "Could not connect to the API. Make sure Uvicorn is running at http://127.0.0.1:8000 and CORS is enabled.";
    }
    errorMessage.textContent = message;
    showResult("error");
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("is-loading");
  }
});

document.getElementById("edit-answers").addEventListener("click", () => {
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("try-again").addEventListener("click", () => {
  form.requestSubmit();
});
