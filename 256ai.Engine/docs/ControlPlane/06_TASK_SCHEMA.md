# Task Schema

> **One task, one objective.** Tasks are atomic units of work dispatched to workers.

---

## Core Principle

A Task is a single, well-defined unit of work:
- **One objective** - What to accomplish
- **Clear inputs** - Data needed to complete
- **Expected outputs** - What success looks like
- **Constraints** - Rules to follow

**If a task has multiple objectives, split it into multiple tasks.**

---

## Task Request Schema

### Required Fields

```json
{
  "objective": "string",       // What to accomplish
  "domain": "string",          // Category/type of task
  "expectedOutputs": "string"  // What the result should contain
}
```

### Full Schema

```json
{
  "objective": "Analyze the BaZi chart and provide element balance insights",
  "domain": "bazi-analysis",
  "constraints": [
    "Response must be in English",
    "Include all five elements",
    "Do not make health predictions"
  ],
  "inputs": {
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "timezone": "Asia/Shanghai",
    "gender": "male"
  },
  "expectedOutputs": "JSON object with elementBalance, strengths, weaknesses",
  "validationCriteria": "Must include Wood, Fire, Earth, Metal, Water percentages",
  "timeLimitSeconds": 300,
  "batchLimit": 1
}
```

---

## Field Definitions

### objective (required)
**Type:** string

The single goal this task should accomplish. Be specific and measurable.

**Good:**
- "Translate the document from English to Spanish"
- "Generate a summary of the meeting notes in under 200 words"
- "Calculate the BaZi chart for the given birth data"

**Bad:**
- "Help with the document" (too vague)
- "Translate and summarize" (two objectives)
- "Do your best" (not measurable)

---

### domain (required)
**Type:** string

Category that determines which workers can handle this task. Workers declare their capabilities by domain.

**Examples:**
| Domain | Description |
|--------|-------------|
| `text-processing` | Translation, summarization, editing |
| `code-generation` | Writing code, debugging |
| `bazi-analysis` | Chinese astrology calculations |
| `data-extraction` | Parsing documents, extracting fields |
| `general` | Any worker can handle |

---

### expectedOutputs (required)
**Type:** string

Describe what the result should look like. This helps workers validate their output.

**Examples:**
- "JSON object with keys: summary, keyPoints, actionItems"
- "Plain text paragraph under 100 words"
- "Python function with docstring and type hints"
- "Markdown table with columns: Name, Date, Amount"

---

### constraints (optional)
**Type:** string[]

Rules the worker must follow. Use for guardrails and requirements.

**Examples:**
```json
{
  "constraints": [
    "Response must be in English",
    "Do not include personal opinions",
    "Use formal tone",
    "Maximum 500 words",
    "Must cite sources"
  ]
}
```

---

### inputs (optional)
**Type:** object (key-value pairs)

Data needed to complete the task. Can be any JSON-serializable values.

**Examples:**
```json
{
  "inputs": {
    "documentText": "The quick brown fox...",
    "targetLanguage": "Spanish",
    "formality": "formal"
  }
}
```

```json
{
  "inputs": {
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "timezone": "Asia/Shanghai"
  }
}
```

---

### validationCriteria (optional)
**Type:** string

How to verify the output is correct. Workers should self-check against this.

**Examples:**
- "Output JSON must parse without errors"
- "Translation must preserve all numbers and dates"
- "Code must compile without warnings"
- "All five elements must be present in analysis"

---

### timeLimitSeconds (optional)
**Type:** integer

Maximum time allowed for task execution. Worker should escalate if approaching limit.

**Default:** No limit
**Recommended:** 60-600 seconds depending on complexity

---

### batchLimit (optional)
**Type:** integer

For tasks processing multiple items, max items to process in one execution.

**Default:** No limit
**Use case:** Processing a list of documents, analyzing multiple records

---

## Task Lifecycle

```
┌──────────┐     ┌─────────────┐     ┌───────────┐     ┌───────────┐
│ PENDING  │ ──► │ IN_PROGRESS │ ──► │ COMPLETED │     │  FAILED   │
└──────────┘     └─────────────┘     └───────────┘     └───────────┘
     │                  │                                    ▲
     │                  └────────────────────────────────────┘
     │                           (on error)
     │
     └─► Task created, waiting for worker
```

**Status Values:**

| Status | Description |
|--------|-------------|
| `PENDING` | Task created, waiting for worker pickup |
| `IN_PROGRESS` | Worker claimed task, executing |
| `COMPLETED` | Task finished successfully |
| `FAILED` | Task execution failed |

---

## Task Message (TAS)

When dispatched to a worker via RabbitMQ, tasks are wrapped in a TAS message:

```json
{
  "header": {
    "messageId": "guid",
    "messageType": "TAS",
    "timestamp": "2026-01-29T20:00:00Z",
    "correlationId": "task-id"
  },
  "context": {
    "source": "controlplane",
    "destination": "worker",
    "domain": "bazi-analysis"
  },
  "audit": {
    "createdBy": "controlplane",
    "createdAt": "2026-01-29T20:00:00Z"
  },
  "taskId": "abc123",
  "objective": "...",
  "domain": "...",
  "constraints": [...],
  "inputs": {...},
  "expectedOutputs": "...",
  "validationCriteria": "...",
  "timeLimitSeconds": 300,
  "batchLimit": 1
}
```

---

## Task Result Message (TRS)

Workers respond with a TRS message:

```json
{
  "header": {
    "messageId": "guid",
    "messageType": "TRS",
    "timestamp": "2026-01-29T20:05:00Z",
    "correlationId": "task-id"
  },
  "taskId": "abc123",
  "status": "COMPLETED",
  "result": {
    "elementBalance": {
      "wood": 20,
      "fire": 30,
      "earth": 15,
      "metal": 25,
      "water": 10
    },
    "insights": "..."
  },
  "metrics": {
    "totalMs": 4500,
    "claudeTokens": 1200
  }
}
```

---

## Examples

### Text Translation Task

```bash
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Translate the document from English to Spanish",
    "domain": "text-processing",
    "constraints": [
      "Preserve formatting",
      "Use formal Spanish (usted)"
    ],
    "inputs": {
      "text": "Hello, how are you today?",
      "preserveLineBreaks": true
    },
    "expectedOutputs": "Translated text in Spanish"
  }'
```

### Code Generation Task

```bash
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Write a Python function to calculate fibonacci numbers",
    "domain": "code-generation",
    "constraints": [
      "Use type hints",
      "Include docstring",
      "Handle negative inputs"
    ],
    "inputs": {
      "language": "python",
      "functionName": "fibonacci"
    },
    "expectedOutputs": "Python function code",
    "validationCriteria": "Code must be valid Python 3.10+"
  }'
```

### Data Extraction Task

```bash
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Extract all email addresses from the document",
    "domain": "data-extraction",
    "inputs": {
      "document": "Contact us at sales@example.com or support@example.com"
    },
    "expectedOutputs": "JSON array of email addresses",
    "validationCriteria": "All emails must match RFC 5322 format"
  }'
```

---

## Error Handling

When a task fails, the worker should:

1. **Set status to FAILED** with error details
2. **Escalate if uncertain** about how to proceed
3. **Include diagnostic info** in the result

```json
{
  "taskId": "abc123",
  "status": "FAILED",
  "error": {
    "code": "INVALID_INPUT",
    "message": "Birth date format not recognized",
    "details": {
      "receivedFormat": "15/05/1990",
      "expectedFormat": "YYYY-MM-DD"
    }
  }
}
```

---

*Last updated: 2026-01-29*
