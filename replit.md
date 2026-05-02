# TDS Data Analyst Agent

## Overview
An AI-powered data analyst agent that allows users to upload datasets (CSV, Excel, JSON, etc.) and a list of questions, then uses Google Gemini LLM via LangChain to perform data analysis, web scraping, and visualization.

## Architecture
- **Backend**: Python 3.12, FastAPI
- **Frontend**: Single-page HTML/JS (`index.html`) served by FastAPI at `/`
- **AI/LLM**: LangChain + Google Gemini (via `langchain-google-genai`)
- **Data Processing**: Pandas, NumPy, DuckDB
- **Visualization**: Matplotlib, Seaborn, Pillow
- **Web Scraping**: BeautifulSoup4, requests, lxml

## Key Files
- `app.py` — Main FastAPI app, LLM logic, API endpoints (`/` and `/api`)
- `index.html` — Frontend UI served by FastAPI
- `requirements.txt` — Python dependencies

## Environment Variables / Secrets
- `gemini_api_1` through `gemini_api_10` — Google Gemini API keys (at least one required). Get from https://aistudio.google.com/apikey

## Running the App
- **Development**: `uvicorn app:app --host 0.0.0.0 --port 5000`
- **Production**: `gunicorn --bind=0.0.0.0:5000 --reuse-port --workers=2 app:app`

## Workflow
- Workflow: "Start application" on port 5000 (webview)

## Deployment
- Target: autoscale
- Run: `gunicorn --bind=0.0.0.0:5000 --reuse-port --workers=2 app:app`

## LangChain Notes
- Uses LangChain 1.x — `create_tool_calling_agent` and `AgentExecutor` are no longer available
- The LLM is called directly via `langchain_core.messages` (SystemMessage + HumanMessage)
- `LLMWithFallback` class tries multiple Gemini models/keys with fallback logic
- Model hierarchy: gemini-2.5-pro → gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.0-flash → gemini-2.0-flash-lite

## How It Works
1. User uploads a `.txt` questions file and optionally a dataset file
2. FastAPI `/api` endpoint reads both files and builds an LLM prompt
3. LLM generates Python code to answer the questions using pandas/matplotlib
4. Code is executed in a sandboxed subprocess via `write_and_run_temp_python()`
5. Results (including base64-encoded charts) are returned as JSON
