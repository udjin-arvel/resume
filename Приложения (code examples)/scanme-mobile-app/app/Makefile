# run-bg / run-stop / run-restart:
#   Windows (OS=Windows_NT): PowerShell scripts/flutter_run_bg.ps1
#   Other: POSIX shell (Git Bash, WSL, macOS, Linux)
.PHONY: run run-bg run-stop run-restart

RUN_FLAGS := -d "TFY LX1" --dart-define=API_BASE_URL=http://10.170.185.188:8080
PID_FILE := .flutter_run.pid
LOG_FILE := .flutter_run.log

run:
	flutter run $(RUN_FLAGS)

ifeq ($(OS),Windows_NT)
run-bg:
	@powershell -NoProfile -ExecutionPolicy Bypass -File "$(CURDIR)/scripts/flutter_run_bg.ps1" start

run-stop:
	@powershell -NoProfile -ExecutionPolicy Bypass -File "$(CURDIR)/scripts/flutter_run_bg.ps1" stop

run-restart:
	@powershell -NoProfile -ExecutionPolicy Bypass -File "$(CURDIR)/scripts/flutter_run_bg.ps1" restart
else
run-bg:
	@echo "flutter run (background), log: $(LOG_FILE)"
	@nohup flutter run $(RUN_FLAGS) > "$(LOG_FILE)" 2>&1 & echo $$! > "$(PID_FILE)"
	@echo "PID $$(cat $(PID_FILE))"

run-stop:
	@if [ -f "$(PID_FILE)" ]; then \
		kill $$(cat "$(PID_FILE)") 2>/dev/null || true; \
		rm -f "$(PID_FILE)"; \
		echo "Stopped (PID file)"; \
	else \
		echo "No $(PID_FILE)"; \
	fi

run-restart: run-stop
	@sleep 1
	@$(MAKE) run-bg
endif
