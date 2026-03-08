#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# OpenCode Autopilot — Project-agnostic automated phase execution
#
# Automated phase execution for OpenCode.
#
# Runs from any project directory. Detects plan files, AGENTS.md/CLAUDE.md,
# SPEC.md automatically from the current working directory.
#
# Usage:
#   autopilot                          # Run all phases from first pending one
#   autopilot --phase 2                # Run a specific phase only
#   autopilot --dry-run                # Show what would run without executing
#   autopilot --max-cycles 2           # Limit fix cycles per phase (default: 3)
#   autopilot --implement-only         # Skip reconcile/audit (just implement)
###############################################################################

PROJECT_DIR="$(pwd)"
PLAN_DIR="${PROJECT_DIR}/plan"
LOG_DIR="${PROJECT_DIR}/.autopilot-logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Defaults
START_PHASE=""
DRY_RUN=false
IMPLEMENT_ONLY=false
MAX_CYCLES=3
MODEL=""
AGENT=""
FORMAT="json"

log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[DONE]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_phase()   { echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"; echo -e "${BOLD}${CYAN}  $*${NC}"; echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}\n"; }
log_step()    { echo -e "  ${BOLD}▸ $*${NC}"; }

# Detect project name from AGENTS.md/CLAUDE.md heading or directory name
get_project_name() {
    for md in "${PROJECT_DIR}/AGENTS.md" "${PROJECT_DIR}/CLAUDE.md"; do
        if [[ -f "$md" ]]; then
            local name
            name=$(head -5 "$md" | grep -m1 '^#' | sed 's/^#\+ *//' || true)
            if [[ -n "$name" ]]; then
                echo "$name"
                return
            fi
        fi
    done
    basename "$PROJECT_DIR"
}

usage() {
    cat <<EOF
Usage: $(basename "$0") [options]

Runs OpenCode autopilot from the current project directory.
Expects ./plan/phase-*.md files and optionally AGENTS.md/CLAUDE.md, SPEC.md.

Options:
  --phase N              Start from phase N (default: first phase with pending tasks)
  --dry-run              Show execution plan without running anything
  --implement-only       Skip reconcile and test-audit steps
  --max-cycles N         Max fix cycles per phase (default: 3)
  --model PROVIDER/MODEL Override model (e.g., ollama/qwen3.5-9b-32k)
  --agent AGENT          Override agent (e.g., build)
  --help                 Show this help

Environment:
  OPENCODE_BIN           Path to opencode binary (default: opencode)
  AUTOPILOT_TIMEOUT      Timeout per opencode call in seconds (default: 3600)

Examples:
  cd /path/to/project && autopilot
  autopilot --phase 1 --model ollama/qwen3.5-9b-32k
  autopilot --phase 3a --implement-only
  autopilot --dry-run
EOF
    exit 0
}

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        --phase)            START_PHASE="$2"; shift 2 ;;
        --dry-run)          DRY_RUN=true; shift ;;
        --implement-only)   IMPLEMENT_ONLY=true; shift ;;
        --max-cycles)       MAX_CYCLES="$2"; shift 2 ;;
        --model)            MODEL="$2"; shift 2 ;;
        --agent)            AGENT="$2"; shift 2 ;;
        --help|-h)          usage ;;
        *) log_error "Unknown option: $1"; usage ;;
    esac
done

OPENCODE_BIN="${OPENCODE_BIN:-opencode}"
AUTOPILOT_TIMEOUT="${AUTOPILOT_TIMEOUT:-3600}"

# Verify opencode is available
if ! command -v "$OPENCODE_BIN" &>/dev/null; then
    log_error "opencode CLI not found. Set OPENCODE_BIN or install opencode."
    exit 1
fi

# Verify plan directory exists
if [[ ! -d "$PLAN_DIR" ]]; then
    log_error "No plan/ directory found in ${PROJECT_DIR}"
    log_error "Expected plan files at: ${PLAN_DIR}/phase-*.md"
    exit 1
fi

# Create log directory
mkdir -p "$LOG_DIR"

PROJECT_NAME=$(get_project_name)

###############################################################################
# Helpers
###############################################################################

get_phase_files() {
    find "$PLAN_DIR" -name 'phase-*.md' -not -name 'test-plan-*' | sort
}

get_phase_id() {
    local file="$1"
    basename "$file" | sed 's/phase-//' | sed 's/-.*//' | sed 's/\.md//'
}

get_phase_name() {
    local file="$1"
    basename "$file" .md | sed 's/phase-[0-9a-z]*-//'
}

count_pending_tasks() {
    local file="$1"
    local count
    count=$(grep -c '^\- \[ \] `TASK-' "$file" 2>/dev/null) || true
    echo "${count:-0}"
}

count_completed_tasks() {
    local file="$1"
    local count
    count=$(grep -c '^\- \[x\] `TASK-' "$file" 2>/dev/null) || true
    echo "${count:-0}"
}

has_pending_tasks() {
    local file="$1"
    [[ $(count_pending_tasks "$file") -gt 0 ]]
}

# Build context preamble — tells opencode which files to read
build_context_preamble() {
    local parts=""
    for md in "AGENTS.md" "CLAUDE.md"; do
        if [[ -f "${PROJECT_DIR}/${md}" ]]; then
            parts+="- ${md} (project conventions and architecture)\n"
            break
        fi
    done
    if [[ -f "${PROJECT_DIR}/SPEC.md" ]]; then
        parts+="- SPEC.md (product requirements)\n"
    fi
    echo -e "$parts"
}

build_opencode_cmd() {
    local cmd="$OPENCODE_BIN run"
    cmd+=" --format $FORMAT"

    if [[ -n "$MODEL" ]]; then
        cmd+=" --model $MODEL"
    fi

    if [[ -n "$AGENT" ]]; then
        cmd+=" --agent $AGENT"
    fi

    echo "$cmd"
}

run_opencode() {
    local step_name="$1"
    local prompt="$2"
    local phase_id="$3"
    local log_file="${LOG_DIR}/phase-${phase_id}-${step_name}-$(date +%Y%m%d-%H%M%S)"
    local raw_log="${log_file}.raw.jsonl"
    local text_log="${log_file}.log"

    log_step "${step_name} (logs: ${text_log})"

    if $DRY_RUN; then
        log_info "[DRY RUN] Would run: opencode run '${prompt:0:80}...'"
        return 0
    fi

    local cmd
    cmd=$(build_opencode_cmd)

    local exit_code=0
    timeout "$AUTOPILOT_TIMEOUT" $cmd "$prompt" 2>"${log_file}.stderr" \
        | tee "$raw_log" \
        | python3 -u -c "
import sys, json

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        data = json.loads(line)
        msg_type = data.get('type', '')

        if msg_type == 'assistant':
            content = data.get('message', {}).get('content', [])
            for block in content:
                if block.get('type') == 'text':
                    text = block['text']
                    print(text, flush=True)
                elif block.get('type') == 'tool_use':
                    name = block.get('name', 'unknown')
                    inp = json.dumps(block.get('input', {}))
                    if len(inp) > 200:
                        inp = inp[:200] + '...'
                    print(f'  [{name}] {inp}', flush=True)

        elif msg_type == 'result':
            result_text = data.get('result', '')
            session_id = data.get('session_id', '')
            if result_text:
                print(f'\n=== RESULT ===', flush=True)
                print(result_text[:2000], flush=True)
            if session_id:
                print(f'\n[session: {session_id}]', flush=True)
                with open('${log_file}.session', 'w') as f:
                    f.write(session_id)

    except json.JSONDecodeError:
        if line.strip():
            print(f'  | {line}', flush=True)
    except Exception as e:
        print(f'  [parse error: {e}]', flush=True)
" 2>&1 | tee "$text_log" || exit_code=$?

    if [[ $exit_code -eq 0 ]]; then
        log_success "${step_name} completed"
    elif [[ $exit_code -eq 124 ]]; then
        log_error "${step_name} timed out after ${AUTOPILOT_TIMEOUT}s"
    else
        log_error "${step_name} exited with code ${exit_code}"
    fi

    return $exit_code
}

check_for_new_tasks() {
    local phase_file="$1"
    local pending
    pending=$(count_pending_tasks "$phase_file")
    [[ $pending -gt 0 ]]
}

###############################################################################
# Phase execution
###############################################################################

run_phase() {
    local phase_file="$1"
    local phase_id phase_name
    phase_id=$(get_phase_id "$phase_file")
    phase_name=$(get_phase_name "$phase_file")

    local pending completed total
    pending=$(count_pending_tasks "$phase_file")
    completed=$(count_completed_tasks "$phase_file")
    total=$((pending + completed))

    log_phase "Phase ${phase_id}: ${phase_name} (${completed}/${total} tasks done, ${pending} pending)"

    if [[ $pending -eq 0 ]]; then
        log_success "All tasks already complete -- skipping to reconcile/audit"
    fi

    local context_files
    context_files=$(build_context_preamble)

    local cycle=0

    while true; do
        cycle=$((cycle + 1))

        if [[ $cycle -gt $((MAX_CYCLES + 1)) ]]; then
            log_warn "Max cycles (${MAX_CYCLES}) reached for phase ${phase_id}. Moving on."
            break
        fi

        pending=$(count_pending_tasks "$phase_file")

        if [[ $pending -eq 0 && $cycle -gt 1 ]]; then
            log_success "Phase ${phase_id} -- all tasks complete after ${cycle} cycles"
            break
        fi

        if [[ $cycle -eq 1 ]]; then
            log_info "Cycle ${cycle}: Initial implementation"
        else
            log_info "Cycle ${cycle}: Fixing gaps found by reconcile/audit (${pending} tasks pending)"
        fi

        # ── Step 1: Implement pending tasks ──────────────────────────
        if [[ $pending -gt 0 ]]; then
            run_opencode "implement" \
                "You are implementing phase ${phase_id} of the ${PROJECT_NAME} project.

Read these files first:
${context_files}- plan/phase-${phase_id}-${phase_name}.md (tasks to implement)

Then implement ALL pending tasks (marked with '- [ ]') in order. For each task:
1. Read the task description carefully
2. Implement the code fully (no placeholders, no TODOs)
3. Mark the task as done by changing '- [ ]' to '- [x]' in the phase file

After all tasks are done, verify the project still builds:
- Backend: check imports resolve, no syntax errors
- Frontend: check imports resolve, no syntax errors

Implement tasks directly yourself, one by one." \
                "$phase_id" || true
        fi

        pending=$(count_pending_tasks "$phase_file")
        completed=$(count_completed_tasks "$phase_file")

        log_info "After implement: ${completed}/$((pending + completed)) tasks done"

        # Skip reconcile/audit if --implement-only
        if $IMPLEMENT_ONLY; then
            if [[ $pending -eq 0 ]]; then
                log_success "Phase ${phase_id} implementation complete"
                break
            fi
            continue
        fi

        # ── Step 2: Plan Reconcile ───────────────────────────────────
        run_opencode "reconcile" \
            "You are reconciling phase ${phase_id} of the ${PROJECT_NAME} project against its spec.

Read these files:
${context_files}- plan/phase-${phase_id}-${phase_name}.md

Compare the actual implementation against the spec and plan:
1. Check every API endpoint listed in the phase plan exists and works
2. Check every database table/column exists
3. Check every frontend page/component exists
4. Check wiring: frontend calls backend, services imported, providers wrap consumers

If you find gaps:
- Add new TASK entries to the phase file (as '- [ ]' pending tasks)
- Add new test cases to the test plan if needed

Report what was found and what was added. If everything matches, say so." \
            "$phase_id" || true

        # ── Step 3: Test Audit ───────────────────────────────────────
        local test_plan_phase="${phase_id%%[a-z]}"
        run_opencode "test-audit" \
            "You are auditing tests for phase ${phase_id} of the ${PROJECT_NAME} project.

Read:
- plan/test-plan-phase-${test_plan_phase}.md (test plan for this phase)
- plan/phase-${phase_id}-${phase_name}.md (implementation tasks)

Check:
1. Every completed task has corresponding test coverage
2. Test plan format is correct (Steps, Expected, Status)
3. No test cases are marked PASS without evidence
4. UI integration tests exist for phases with frontend work

If missing test cases are found, add them to the test plan file.
Update test case statuses based on what's actually testable.
Report what was found." \
            "$phase_id" || true

        # ── Check if new tasks were added ────────────────────────────
        if check_for_new_tasks "$phase_file"; then
            pending=$(count_pending_tasks "$phase_file")
            log_warn "Reconcile/audit added ${pending} new tasks -- will run another cycle"
        else
            log_success "Phase ${phase_id} fully implemented and tested"
            break
        fi
    done

    completed=$(count_completed_tasks "$phase_file")
    pending=$(count_pending_tasks "$phase_file")
    total=$((pending + completed))

    echo ""
    log_info "Phase ${phase_id} summary: ${completed}/${total} tasks complete"

    if [[ $pending -gt 0 ]]; then
        log_warn "${pending} tasks still pending after ${MAX_CYCLES} fix cycles"
    fi
}

###############################################################################
# Main
###############################################################################

main() {
    log_phase "${PROJECT_NAME} — OpenCode Autopilot"

    if $DRY_RUN; then
        log_warn "DRY RUN MODE -- no commands will be executed"
    fi

    log_info "Project:          ${PROJECT_DIR}"
    log_info "Settings:"
    log_info "  Model:            ${MODEL:-default}"
    log_info "  Agent:            ${AGENT:-default}"
    log_info "  Max fix cycles:   ${MAX_CYCLES}"
    log_info "  Timeout:          ${AUTOPILOT_TIMEOUT}s"
    log_info "  Implement only:   ${IMPLEMENT_ONLY}"
    log_info "  Log directory:    ${LOG_DIR}"
    echo ""

    # Collect phase files
    local phase_files=()
    while IFS= read -r f; do
        phase_files+=("$f")
    done < <(get_phase_files)

    if [[ ${#phase_files[@]} -eq 0 ]]; then
        log_error "No phase files found in ${PLAN_DIR}"
        log_error "Expected files matching: ${PLAN_DIR}/phase-*.md"
        exit 1
    fi

    log_info "Found ${#phase_files[@]} phase files:"
    for f in "${phase_files[@]}"; do
        local pid pname pending completed
        pid=$(get_phase_id "$f")
        pname=$(get_phase_name "$f")
        pending=$(count_pending_tasks "$f")
        completed=$(count_completed_tasks "$f")
        if [[ $pending -eq 0 ]]; then
            echo -e "  ${GREEN}✓${NC} Phase ${pid}: ${pname} (${completed} tasks, all done)"
        else
            echo -e "  ${YELLOW}○${NC} Phase ${pid}: ${pname} (${pending} pending / $((pending + completed)) total)"
        fi
    done
    echo ""

    local phases_run=0
    local phases_skipped=0

    for phase_file in "${phase_files[@]}"; do
        local phase_id
        phase_id=$(get_phase_id "$phase_file")

        if [[ -n "$START_PHASE" ]]; then
            if [[ "$phase_id" != "$START_PHASE" ]]; then
                phases_skipped=$((phases_skipped + 1))
                continue
            fi
        else
            if ! has_pending_tasks "$phase_file"; then
                log_info "Skipping phase ${phase_id} (all tasks complete)"
                phases_skipped=$((phases_skipped + 1))
                continue
            fi
        fi

        run_phase "$phase_file"
        phases_run=$((phases_run + 1))

        if [[ -n "$START_PHASE" ]]; then
            break
        fi
    done

    echo ""
    log_phase "Autopilot Complete"
    log_info "Phases run:     ${phases_run}"
    log_info "Phases skipped: ${phases_skipped}"
    log_info "Logs:           ${LOG_DIR}/"

    echo ""
    log_info "Next steps:"
    log_info "  1. Review logs in ${LOG_DIR}/"
    log_info "  2. Check plan files for any remaining pending tasks"
    log_info "  3. Run tests to verify everything passes"
}

main "$@"
