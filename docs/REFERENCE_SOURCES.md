# Reference Sources Log

This file tracks external references used while building EXPEDITE.
Do not copy code blindly. Prefer clean-room adaptation and verify licenses.

## How to use this file

- Add one entry per external source used for ideas, architecture, or adapted code.
- Record license and usage scope before integration.
- Keep this file updated whenever new references are used.

## Source Entries

### 1) sales-outreach-automation-langgraph
- URL: https://github.com/kaymen99/sales-outreach-automation-langgraph
- Type: Architecture reference
- Intended use: LangGraph outreach workflow patterns (research -> qualify -> outreach)
- License: TODO (verify before code reuse)
- Status: Referenced for design ideas only

### 2) langgraph-email-automation
- URL: https://github.com/kaymen99/langgraph-email-automation
- Type: Architecture reference
- Intended use: Email automation and agent orchestration patterns
- License: TODO (verify before code reuse)
- Status: Referenced for design ideas only

### 3) z-mail-agent
- URL: https://github.com/kerbelp/z-mail-agent
- Type: Architecture/reference implementation
- Intended use: Config-driven email automation flow design
- License: Reported MIT in search results (verify in repo LICENSE)
- Status: Referenced for design ideas only

### 4) fastapi-scheduler
- URL: https://github.com/fastapi-practices/fastapi_scheduler
- Type: Scheduling reference
- Intended use: FastAPI + APScheduler lifecycle and API management patterns
- License: Reported MIT in search results (verify in repo LICENSE)
- Status: Referenced for scheduler design

### 5) fastapi-apscheduler
- URL: https://github.com/grillazz/fastapi-apscheduler
- Type: Scheduling reference
- Intended use: RESTful scheduling patterns and job orchestration
- License: Reported MIT in search results (verify in repo LICENSE)
- Status: Referenced for scheduler design

### 6) internship-scraper references
- URL: https://github.com/rabiuk/job-scraper
- URL: https://github.com/landoncrabtree/linkedin-jobhunt
- URL: https://github.com/LorenzoLaCorte/internship-scraper
- Type: Data sourcing reference
- Intended use: Internship/job source coverage and scraping strategy
- License: TODO (verify before code reuse)
- Status: Referenced for source strategy only

### 7) email validation references
- URL: https://github.com/JoshData/python-email-validator
- URL: https://github.com/kakshay21/verify_email
- URL: https://github.com/unlimitedverifier/free-email-verifier
- Type: Validation reference
- Intended use: Syntax/MX/SMTP verification strategy and confidence gates
- License: TODO (verify before code reuse)
- Status: Referenced for validation strategy

## Notes

- Any direct code adoption requires:
  1) license verification,
  2) attribution here,
  3) adaptation review,
  4) security review.
