(() => {
  const panel = document.getElementById("status-panel");
  if (!panel) return;

  const requestId = panel.dataset.requestId;
  if (!requestId) return;

  const messageEl = document.getElementById("status-message");
  const hintEl = document.getElementById("status-hint");
  const stages = Array.from(document.querySelectorAll(".stage"));

  const stateByStatus = {
    pending: ["done", "pending", "pending", "pending", "pending"],
    in_progress: ["done", "active", "pending", "pending", "pending"],
    completed: ["done", "done", "done", "done", "done"],
    failed: ["done", "failed", "pending", "pending", "pending"],
  };

  function applyStageStates(status) {
    const states = stateByStatus[status] || stateByStatus.pending;
    stages.forEach((stage, index) => {
      stage.className = `stage stage--${states[index] || "pending"}`;
    });
  }

  function showError(text) {
    if (!messageEl) return;
    messageEl.hidden = false;
    messageEl.classList.add("is-error");
    messageEl.textContent = text || "Анализ завершился с ошибкой";
    if (hintEl) hintEl.hidden = true;
  }

  async function tick() {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      panel.dataset.status = data.status;
      applyStageStates(data.status);

      if (data.status === "completed") {
        window.location.href = `/requests/${requestId}/report`;
        return;
      }
      if (data.status === "failed") {
        showError(data.error_message);
        return;
      }
      window.setTimeout(tick, 2000);
    } catch (err) {
      showError("Не удалось обновить статус. Повторите позже.");
    }
  }

  const initial = panel.dataset.status;
  applyStageStates(initial);
  if (initial === "completed") {
    window.location.href = `/requests/${requestId}/report`;
    return;
  }
  if (initial === "failed") {
    showError("Анализ завершился с ошибкой");
    return;
  }
  window.setTimeout(tick, 2000);
})();
