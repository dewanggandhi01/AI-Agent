#!/usr/bin/env python3
"""
validate.py — Validation mode for AI Data Analyst Agent.

Reads question.txt, computes answers using the deterministic DataAnalyzer,
and saves outputs to answers.txt. No LLM is used.

Usage:
    python validate.py [--questions question.txt] [--data sales_data.xlsx] [--output answers.txt]
"""

import argparse
import logging
import os
import sys
import pandas as pd

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_analyzer import DataAnalyzer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("validate")


def parse_questions(filepath: str) -> list:
    """Parse numbered questions from a text file."""
    questions = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            # Remove leading number + dot (e.g., "1. What is...")
            import re
            cleaned = re.sub(r"^\d+\.\s*", "", line)
            if cleaned:
                questions.append(cleaned)
    return questions


def main():
    parser = argparse.ArgumentParser(description="Validate AI Agent answers")
    parser.add_argument("--questions", default="question.txt", help="Path to questions file")
    parser.add_argument("--data", default="sales_data.xlsx", help="Path to data file")
    parser.add_argument("--output", default="answers.txt", help="Path to output answers file")
    args = parser.parse_args()

    # Load data
    logger.info(f"Loading dataset: {args.data}")
    ext = os.path.splitext(args.data)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(args.data)
    elif ext in (".xlsx", ".xls"):
        df = pd.read_excel(args.data)
    elif ext == ".parquet":
        df = pd.read_parquet(args.data)
    elif ext == ".json":
        df = pd.read_json(args.data)
    else:
        logger.error(f"Unsupported file type: {ext}")
        sys.exit(1)

    logger.info(f"Dataset shape: {df.shape}")
    logger.info(f"Columns: {list(df.columns)}")

    # Parse questions
    logger.info(f"Reading questions from: {args.questions}")
    questions = parse_questions(args.questions)
    logger.info(f"Found {len(questions)} questions")

    # Initialize analyzer
    analyzer = DataAnalyzer(df)

    # Process each question
    results = []
    for i, q in enumerate(questions, 1):
        logger.info(f"\n{'='*60}")
        logger.info(f"Q{i}: {q}")
        result = analyzer.analyze_question(q)
        answer = result.get("answer", "Could not compute answer")
        method = result.get("method", "unknown")
        details = result.get("details", "")
        logger.info(f"Answer: {answer}")
        logger.info(f"Method: {method}")
        if details:
            logger.info(f"Details: {details}")
        results.append((i, q, answer, method))

    # Write answers
    logger.info(f"\nWriting answers to: {args.output}")
    with open(args.output, "w", encoding="utf-8") as f:
        f.write("=" * 70 + "\n")
        f.write("AI DATA ANALYST AGENT — VALIDATED ANSWERS\n")
        f.write("=" * 70 + "\n\n")
        for i, q, answer, method in results:
            f.write(f"Q{i}. {q}\n")
            f.write(f"Answer: {answer}\n")
            f.write(f"Method: {method}\n")
            f.write("-" * 50 + "\n")

    logger.info(f"\n{'='*60}")
    logger.info(f"VALIDATION COMPLETE — {len(results)} answers written to {args.output}")
    logger.info(f"{'='*60}")

    # Summary
    pandas_count = sum(1 for _, _, _, m in results if m == "pandas_direct")
    unsupported = sum(1 for _, _, _, m in results if m == "unsupported")
    print(f"\nSummary: {pandas_count}/{len(results)} answered via pandas_direct, {unsupported} unsupported")


if __name__ == "__main__":
    main()
