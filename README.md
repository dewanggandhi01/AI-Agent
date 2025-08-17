# ⚡ Data Analyst Agent — Your AI-Powered Data Companion
> Smarter, faster, and more intuitive analysis of your datasets using **Generative AI + Python magic.**
> Repository: https://github.com/dewanggandhi01/Data-Analyst-Agent

---

## 📌 What Is This?
Meet **Data Analyst Agent 2.0** — an AI-driven assistant that eliminates tedious data crunching.
Upload your dataset + queries, and instantly get:
✅ Visual reports
✅ AI-generated insights
✅ Automated workflows

Perfect for:
- Analysts 🧾
- Researchers 🔬
- Startups & Businesses 📈
- Anyone who loves turning raw data into knowledge

---

## ✨ Key Highlights

| Feature | Why It’s Awesome 🚀 |
|---------------------------|----------------------|
| 🤖 AI-Powered Insights | Uses Google’s Generative AI to “understand” your data |
| 📊 Rich Visualizations | Generates plots with **Seaborn & Matplotlib** |
| 🌍 Web Scraper Mode | Fetch live data directly from URLs |
| 📂 Multi-Format Friendly | Accepts CSV, Excel, JSON, Parquet, or TXT |
| 🔄 Ask Many at Once | Batch processing for multiple questions |
| 🖥️ Simple-to-Use Interface | Beginner friendly, no steep learning curve |
| ⚡ Super-Fast Execution | Optimized for speed + real-time feedback |

---

## 🚀 Getting Started

### 1️⃣ Clone the Repo
```bash
git clone https://github.com/dewanggandhi01/Data-Analyst-Agent.git
cd Data-Analyst-Agent
```

### 2️⃣ Install Requirements
```bash
pip install -r requirements.txt
```

### 3️⃣ Configure API Keys
Create a `.env` file inside the root folder:
```
GEMINI_API_KEY=your_google_api_key
LLM_TIMEOUT_SECONDS=240
```

### 4️⃣ Start the Application
```bash
python -m uvicorn app:app --reload
```
Now open [**http://localhost:8000/**](http://localhost:8000/) in your browser 🌐

---

## 🧑‍💻 How It Works

The application exposes an API endpoint that accepts a POST request with a data analysis task.

1.  **Prepare Your Files**:
    *   **Questions File (Required)**: A `.txt` file containing the questions you want to ask.
    *   **Data Files (Optional)**: Any relevant data files (e.g., `.csv`, `.xlsx`, `.png`).

2.  **Send the Request**:
    Make a `POST` request to the `/api` endpoint with your files.

    **Example using cURL:**
    ```bash
    curl "http://localhost:8000/api/" \
      -F "questions_file=@questions.txt" \
      -F "data_file=@data.csv"
    ```

3.  **Get Results**:
    The API will process the request and return a JSON response with the answers. The response format depends on the questions asked.

---

### Sample Questions

Here are some examples of what you can put in your `questions.txt` file.

**Example 1: Web Scraping & Analysis**
```
Scrape the list of highest grossing films from Wikipedia. It is at the URL:
https://en.wikipedia.org/wiki/List_of_highest-grossing_films

Answer the following questions and respond with a JSON array of strings containing the answer.

1. How many $2 bn movies were released before 2000?
2. Which is the earliest film that grossed over $1.5 bn?
3. What's the correlation between the Rank and Peak?
4. Draw a scatterplot of Rank and Peak along with a dotted red regression line through it.
   Return as a base-64 encoded data URI, "data:image/png;base64,iVBORw0KG..." under 100,000 bytes.
```
**Expected Response:**
```json
[1, "Titanic", 0.485782, "data:image/png;base64,iVBORw0KG..."]
```

**Example 2: Large Dataset Analysis**
```
The Indian high court judgement dataset contains judgements from the Indian High Courts.

Answer the following questions and respond with a JSON object containing the answer.

{
  "Which high court disposed the most cases from 2019 - 2022?": "...",
  "What's the regression slope of the date_of_registration - decision_date by year in the court=33_10?": "...",
  "Plot the year and # of days of delay from the above question as a scatterplot with a regression line. Encode as a base64 data URI under 100,000 characters": "data:image/webp:base64,..."
}
```

---

## 🛠 Tech Behind the Scenes

### Backend
- **FastAPI** ⚡ → High-performance web server
- **LangChain** 🧠 → Orchestrates LLM interactions
- **Google Generative AI** ✨ → Core AI engine
- **Pandas + NumPy** 📊 → Data wrangling made smooth
- **Seaborn + Matplotlib** 🎨 → Clean, insightful charts

### Frontend
- HTML5 + CSS + JavaScript
- Modern, responsive UI with advanced features like theme switching.

---

## 🔧 API Blueprint

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/` | Access the web application |
| `POST` | `/api` | Submit a dataset and questions for analysis |

---

## 📂 File Support

| Format | Extensions |
|--------|------------|
| CSV | `.csv` |
| Excel | `.xlsx`, `.xls` |
| JSON | `.json` |
| Parquet| `.parquet` |
| Text | `.txt` |

---

## 🧪 Evaluation

This project is evaluated using `promptfoo`. The tests assert the correctness of the API responses based on a predefined rubric.

**Sample Evaluation:**
- **Structural Gate**: Checks if the response is a valid JSON array with the correct number of items.
- **Content Validation**:
    - `python` assertions to check for specific values (e.g., `output[0] == 1`).
    - Regex matching for text-based answers.
    - Numerical comparison within a tolerance.
- **Vision Check**:
    - An `llm-rubric` is used to grade plots sent to GPT-4.
    - It verifies criteria like chart type, colors, labels, and file size.

---

## 🔒 Security First
- ✅ **No Cloud Storage**: All data is processed locally and not stored.
- ✅ **Safe API Keys**: API keys are managed securely using a `.env` file.
- ✅ **Configurable CORS**: The CORS policy can be configured for production environments.

---

## 📜 License
Licensed under **MIT** – free for personal & commercial use.




  
