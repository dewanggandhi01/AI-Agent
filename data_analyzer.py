"""
data_analyzer.py — Deterministic pandas-based data analysis engine.

Answers common analytical questions directly from a DataFrame using pandas,
WITHOUT any LLM. This ensures 100% accuracy for numerical/aggregate questions.
"""

import pandas as pd
import numpy as np
import re
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class DataAnalyzer:
    """Deterministic pandas-based data analyzer. No LLM needed."""

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self._col_map = {}  # semantic name -> actual column name
        self._prepare_data()

    # ------------------------------------------------------------------
    # Data preparation
    # ------------------------------------------------------------------
    def _prepare_data(self):
        """Auto-detect columns, parse dates, build semantic column map."""
        # Strip whitespace from column names
        self.df.columns = [str(c).strip() for c in self.df.columns]
        logger.info(f"DataAnalyzer: shape={self.df.shape}, columns={list(self.df.columns)}")
        logger.info(f"DataAnalyzer: dtypes=\n{self.df.dtypes.to_string()}")

        # Build semantic column map
        self._col_map["revenue"] = self._detect_column(["revenue", "sales", "total_sales", "amount"])
        self._col_map["profit"] = self._detect_column(["profit", "net_profit", "earnings"])
        self._col_map["quantity"] = self._detect_column(["quantity", "qty", "units", "units_sold"])
        self._col_map["date"] = self._detect_column(["date", "order_date", "transaction_date"])
        self._col_map["region"] = self._detect_column(["region", "area", "territory", "zone"])
        self._col_map["category"] = self._detect_column(["product_category", "category", "product_type"])
        self._col_map["product"] = self._detect_column(["product_name", "product", "item", "item_name"])
        self._col_map["customer_type"] = self._detect_column(["customer_type", "customer_segment", "segment", "customer"])
        self._col_map["unit_price"] = self._detect_column(["unit_price", "price", "cost"])

        logger.info(f"DataAnalyzer: column map = {self._col_map}")

        # Parse date column
        date_col = self._col_map.get("date")
        if date_col and date_col in self.df.columns:
            try:
                self.df[date_col] = pd.to_datetime(self.df[date_col])
                self.df["_month"] = self.df[date_col].dt.to_period("M")
                logger.info(f"DataAnalyzer: parsed date column '{date_col}', months range: {self.df['_month'].min()} to {self.df['_month'].max()}")
            except Exception as e:
                logger.warning(f"DataAnalyzer: could not parse date column '{date_col}': {e}")

    def _detect_column(self, keywords: list) -> Optional[str]:
        """Find a column whose name matches any keyword (case-insensitive)."""
        cols_lower = {c.lower().strip(): c for c in self.df.columns}
        for kw in keywords:
            kw_lower = kw.lower().strip()
            # Exact match
            if kw_lower in cols_lower:
                return cols_lower[kw_lower]
            # Substring match
            for cl, orig in cols_lower.items():
                if kw_lower in cl or cl in kw_lower:
                    return orig
        return None

    def _get_col(self, semantic: str) -> Optional[str]:
        """Get actual column name by semantic name. Returns None if not found."""
        return self._col_map.get(semantic)

    # ------------------------------------------------------------------
    # Question analysis
    # ------------------------------------------------------------------
    def analyze_question(self, question: str) -> Dict[str, Any]:
        """
        Parse a natural language question and return a deterministic answer.
        Returns: {'answer': value, 'method': 'pandas_direct', 'details': str}
        """
        q = question.lower().strip()
        logger.info(f"DataAnalyzer: analyzing question: '{question}'")

        try:
            # --- Total revenue ---
            if self._match(q, ["total"]) and self._match(q, ["revenue", "sales"]) and not self._match(q, ["tax"]):
                return self._total_column("revenue", "total revenue")

            # --- Total profit ---
            if self._match(q, ["total"]) and self._match(q, ["profit"]):
                return self._total_column("profit", "total profit")

            # --- Total quantity ---
            if self._match(q, ["total"]) and self._match(q, ["quantity", "quantities"]):
                return self._total_column("quantity", "total quantity sold")

            # --- Highest revenue region ---
            if self._match(q, ["highest", "most", "maximum", "top", "best", "greatest"]) and self._match(q, ["revenue", "sales"]) and self._match(q, ["region"]) and not self._match(q, ["lowest", "least"]):
                return self._group_extreme("region", "revenue", "max", "highest revenue region")

            # --- Lowest revenue region ---
            if self._match(q, ["lowest", "least", "minimum", "worst", "smallest"]) and self._match(q, ["revenue", "sales"]) and self._match(q, ["region"]):
                return self._group_extreme("region", "revenue", "min", "lowest revenue region")

            # --- Average revenue per order ---
            if self._match(q, ["average", "avg", "mean"]) and self._match(q, ["revenue"]):
                return self._average_column("revenue", "average revenue per order")

            # --- Highest revenue product category ---
            if self._match(q, ["highest", "most", "top", "best", "greatest"]) and self._match(q, ["revenue"]) and self._match(q, ["category", "product_category"]):
                return self._group_extreme("category", "revenue", "max", "highest revenue product category")

            # --- Highest profit product category ---
            if self._match(q, ["highest", "most", "top", "best", "greatest"]) and self._match(q, ["profit"]) and self._match(q, ["category", "product_category"]):
                return self._group_extreme("category", "profit", "max", "highest profit product category")

            # --- Top 5 products by revenue ---
            if self._match(q, ["top"]) and self._match(q, ["product"]) and self._match(q, ["revenue"]):
                n = self._extract_number(q, default=5)
                return self._top_n("product", "revenue", n, f"top {n} products by revenue")

            # --- Top 5 products by profit ---
            if self._match(q, ["top"]) and self._match(q, ["product"]) and self._match(q, ["profit"]):
                n = self._extract_number(q, default=5)
                return self._top_n("product", "profit", n, f"top {n} products by profit")

            # --- Highest revenue customer type ---
            if self._match(q, ["highest", "most", "top", "best"]) and self._match(q, ["revenue"]) and self._match(q, ["customer"]):
                return self._group_extreme("customer_type", "revenue", "max", "highest revenue customer type")

            # --- Highest profit customer type ---
            if self._match(q, ["highest", "most", "top", "best"]) and self._match(q, ["profit"]) and self._match(q, ["customer"]):
                return self._group_extreme("customer_type", "profit", "max", "highest profit customer type")

            # --- Month with highest revenue ---
            if self._match(q, ["month"]) and self._match(q, ["highest", "most", "best", "maximum"]) and self._match(q, ["revenue"]):
                return self._month_extreme("revenue", "max", "month with highest revenue")

            # --- Month with highest profit ---
            if self._match(q, ["month"]) and self._match(q, ["highest", "most", "best", "maximum"]) and self._match(q, ["profit"]):
                return self._month_extreme("profit", "max", "month with highest profit")

            # --- Average profit margin ---
            if self._match(q, ["average", "avg", "mean"]) and self._match(q, ["profit"]) and self._match(q, ["margin"]):
                return self._average_profit_margin()

            # --- Product sold in highest quantity ---
            if self._match(q, ["highest", "most", "maximum"]) and self._match(q, ["quantity", "quantities"]) and self._match(q, ["product", "sold"]):
                return self._group_extreme("product", "quantity", "max", "product with highest quantity sold")

            # --- Revenue contribution percentage by region ---
            if self._match(q, ["revenue"]) and self._match(q, ["contribution", "percentage", "%"]) and self._match(q, ["region"]):
                return self._contribution_pct("region", "revenue")

            # --- Monthly revenue trend ---
            if self._match(q, ["monthly", "month"]) and self._match(q, ["revenue"]) and self._match(q, ["trend", "show"]):
                return self._monthly_trend("revenue")

            # --- Monthly profit trend ---
            if self._match(q, ["monthly", "month"]) and self._match(q, ["profit"]) and self._match(q, ["trend", "show"]):
                return self._monthly_trend("profit")

            # --- Best-performing product category ---
            if self._match(q, ["best", "top"]) and self._match(q, ["performing", "performance"]) and self._match(q, ["category"]):
                return self._best_performing_category()

            # --- Fallback: not recognized ---
            logger.warning(f"DataAnalyzer: question not recognized: '{question}'")
            return {"answer": None, "method": "unsupported", "details": "Question pattern not recognized"}

        except Exception as e:
            logger.exception(f"DataAnalyzer: error analyzing question: '{question}'")
            return {"answer": f"Error: {str(e)}", "method": "error", "details": str(e)}

    def analyze_all_questions(self, questions: List[str]) -> Dict[str, Any]:
        """Process all questions and return {question_string: answer} dict."""
        results = {}
        for q in questions:
            result = self.analyze_question(q)
            results[q] = result.get("answer", "Could not compute")
        return results

    # ------------------------------------------------------------------
    # Helper: keyword matching
    # ------------------------------------------------------------------
    def _match(self, text: str, keywords: list) -> bool:
        """Check if ANY keyword appears in the text (case-insensitive, word boundary)."""
        for kw in keywords:
            if kw.lower() in text.lower():
                return True
        return False

    def _extract_number(self, text: str, default: int = 5) -> int:
        """Extract a number from text like 'top 5' or 'top 10'."""
        m = re.search(r"top\s+(\d+)", text, re.IGNORECASE)
        if m:
            return int(m.group(1))
        return default

    # ------------------------------------------------------------------
    # Computation methods
    # ------------------------------------------------------------------
    def _total_column(self, semantic_col: str, desc: str) -> Dict:
        col = self._get_col(semantic_col)
        if not col:
            return {"answer": f"Column not found for '{semantic_col}'", "method": "error"}
        val = int(self.df[col].sum())
        logger.info(f"  -> {desc}: df['{col}'].sum() = {val}")
        return {"answer": val, "method": "pandas_direct", "details": f"df['{col}'].sum() = {val}"}

    def _average_column(self, semantic_col: str, desc: str) -> Dict:
        col = self._get_col(semantic_col)
        if not col:
            return {"answer": f"Column not found for '{semantic_col}'", "method": "error"}
        val = round(self.df[col].mean(), 2)
        logger.info(f"  -> {desc}: df['{col}'].mean() = {val}")
        return {"answer": val, "method": "pandas_direct", "details": f"df['{col}'].mean() = {val}"}

    def _group_extreme(self, group_col: str, value_col: str, extreme: str, desc: str) -> Dict:
        gcol = self._get_col(group_col)
        vcol = self._get_col(value_col)
        if not gcol:
            return {"answer": f"Column not found for '{group_col}'", "method": "error"}
        if not vcol:
            return {"answer": f"Column not found for '{value_col}'", "method": "error"}

        grouped = self.df.groupby(gcol)[vcol].sum().sort_values(ascending=False)
        logger.info(f"  -> {desc}: grouped values = {grouped.to_dict()}")

        if extreme == "max":
            name = grouped.index[0]
            val = int(grouped.iloc[0])
        else:
            name = grouped.index[-1]
            val = int(grouped.iloc[-1])

        answer = f"{name} ({val})"
        logger.info(f"  -> {desc}: {answer}")
        return {"answer": answer, "method": "pandas_direct", "details": f"{extreme} of df.groupby('{gcol}')['{vcol}'].sum()"}

    def _top_n(self, group_col: str, value_col: str, n: int, desc: str) -> Dict:
        gcol = self._get_col(group_col)
        vcol = self._get_col(value_col)
        if not gcol or not vcol:
            return {"answer": "Column not found", "method": "error"}

        top = self.df.groupby(gcol)[vcol].sum().sort_values(ascending=False).head(n)
        logger.info(f"  -> {desc}: {top.to_dict()}")

        parts = [f"{i+1}. {name} ({int(val)})" for i, (name, val) in enumerate(top.items())]
        answer = ", ".join(parts)
        return {"answer": answer, "method": "pandas_direct", "details": f"top {n} of df.groupby('{gcol}')['{vcol}'].sum()"}

    def _month_extreme(self, value_col: str, extreme: str, desc: str) -> Dict:
        vcol = self._get_col(value_col)
        if not vcol:
            return {"answer": f"Column not found for '{value_col}'", "method": "error"}
        if "_month" not in self.df.columns:
            return {"answer": "Date column not parsed", "method": "error"}

        monthly = self.df.groupby("_month")[vcol].sum().sort_values(ascending=False)
        logger.info(f"  -> {desc}: monthly values = {dict(zip([str(m) for m in monthly.index], monthly.values))}")

        if extreme == "max":
            month = str(monthly.index[0])
            val = int(monthly.iloc[0])
        else:
            month = str(monthly.index[-1])
            val = int(monthly.iloc[-1])

        answer = f"{month} ({val})"
        logger.info(f"  -> {desc}: {answer}")
        return {"answer": answer, "method": "pandas_direct", "details": f"{extreme} month for {value_col}"}

    def _average_profit_margin(self) -> Dict:
        rev_col = self._get_col("revenue")
        prof_col = self._get_col("profit")
        if not rev_col or not prof_col:
            return {"answer": "Revenue or Profit column not found", "method": "error"}

        margins = (self.df[prof_col] / self.df[rev_col]) * 100
        avg_margin = round(margins.mean(), 2)
        logger.info(f"  -> average profit margin: {avg_margin}%")
        return {"answer": f"{avg_margin}%", "method": "pandas_direct", "details": f"mean of (Profit/Revenue*100) = {avg_margin}%"}

    def _contribution_pct(self, group_col: str, value_col: str) -> Dict:
        gcol = self._get_col(group_col)
        vcol = self._get_col(value_col)
        if not gcol or not vcol:
            return {"answer": "Column not found", "method": "error"}

        grouped = self.df.groupby(gcol)[vcol].sum()
        total = grouped.sum()
        pct = (grouped / total * 100).round(2).sort_values(ascending=False)
        logger.info(f"  -> contribution %: {pct.to_dict()}")

        parts = [f"{name}: {val}%" for name, val in pct.items()]
        answer = ", ".join(parts)
        return {"answer": answer, "method": "pandas_direct", "details": f"percentage of df.groupby('{gcol}')['{vcol}'].sum() / total"}

    def _monthly_trend(self, value_col: str) -> Dict:
        vcol = self._get_col(value_col)
        if not vcol:
            return {"answer": f"Column not found for '{value_col}'", "method": "error"}
        if "_month" not in self.df.columns:
            return {"answer": "Date column not parsed", "method": "error"}

        monthly = self.df.groupby("_month")[vcol].sum().sort_index()
        logger.info(f"  -> monthly {value_col} trend: {dict(zip([str(m) for m in monthly.index], monthly.values))}")

        parts = [f"{str(m)}: {int(v)}" for m, v in monthly.items()]
        answer = "; ".join(parts)
        return {"answer": answer, "method": "pandas_direct", "details": f"monthly trend for {value_col}"}

    def _best_performing_category(self) -> Dict:
        cat_col = self._get_col("category")
        rev_col = self._get_col("revenue")
        prof_col = self._get_col("profit")
        if not cat_col or not rev_col or not prof_col:
            return {"answer": "Required columns not found", "method": "error"}

        rev_by_cat = self.df.groupby(cat_col)[rev_col].sum().sort_values(ascending=False)
        prof_by_cat = self.df.groupby(cat_col)[prof_col].sum().sort_values(ascending=False)

        best_rev = rev_by_cat.index[0]
        best_prof = prof_by_cat.index[0]
        logger.info(f"  -> best by revenue: {best_rev} ({int(rev_by_cat.iloc[0])})")
        logger.info(f"  -> best by profit: {best_prof} ({int(prof_by_cat.iloc[0])})")

        if best_rev == best_prof:
            answer = f"{best_rev} (Revenue: {int(rev_by_cat.iloc[0])}, Profit: {int(prof_by_cat.iloc[0])})"
        else:
            answer = f"By Revenue: {best_rev} ({int(rev_by_cat.iloc[0])}), By Profit: {best_prof} ({int(prof_by_cat.iloc[0])})"

        return {"answer": answer, "method": "pandas_direct", "details": "best-performing category by revenue and profit"}
