#!/usr/bin/env python3
"""Run answer-text-only membership inference against text and image RAG stores."""

from __future__ import annotations

import argparse
import json
import sqlite3
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
from sentence_transformers import SentenceTransformer
from sklearn.metrics import accuracy_score, roc_auc_score
from transformers import AutoModelForCausalLM, AutoTokenizer


def normalize_rows(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    return matrix / np.clip(norms, 1e-12, None)


def answer_score(answer: str, anchors: list[str]) -> tuple[float, list[str]]:
    compact = "".join(answer.split()).lower()
    hits = [anchor for anchor in anchors if "".join(anchor.split()).lower() in compact]
    return len(hits) / len(anchors), hits


def create_database(path: Path, text_candidates: list[dict], image_candidates: list[dict]) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    connection = sqlite3.connect(path)
    connection.executescript(
        """
        CREATE TABLE rag_documents (
          id TEXT PRIMARY KEY,
          modality TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL
        );
        CREATE TABLE membership_runs (
          candidate_id TEXT NOT NULL,
          product_code TEXT NOT NULL,
          label INTEGER NOT NULL,
          query_index INTEGER NOT NULL,
          answer TEXT NOT NULL,
          answer_score REAL NOT NULL,
          PRIMARY KEY (candidate_id, query_index)
        );
        CREATE INDEX idx_rag_documents_modality ON rag_documents(modality);
        CREATE INDEX idx_membership_runs_product ON membership_runs(product_code);
        """
    )
    for candidate in [*text_candidates, *image_candidates]:
        if candidate["member"]:
            connection.execute(
                "INSERT INTO rag_documents VALUES (?, ?, ?, ?)",
                (candidate["id"], "text" if candidate["productCode"] == "030701" else "image", candidate["title"], candidate["content"]),
            )
    connection.commit()
    return connection


def retrieve_text(query: str, embedder, member_candidates: list[dict], member_matrix: np.ndarray, top_k: int = 3) -> list[dict]:
    vector = embedder.encode([query], normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False)[0]
    indices = np.argsort(-(member_matrix @ vector))[:top_k]
    return [member_candidates[int(index)] for index in indices]


def retrieve_image(candidate: dict, image_vectors: dict[str, np.ndarray], member_candidates: list[dict]) -> list[dict]:
    query = image_vectors[candidate["id"]]
    matrix = np.stack([image_vectors[row["id"]] for row in member_candidates])
    index = int(np.argmax(matrix @ query))
    return [member_candidates[index]]


def prompt_for(candidate: dict, query: str, retrieved: list[dict]) -> str:
    context = "\n\n".join(f"{item['title']}\n{item['content']}" for item in retrieved)
    return (
        "你是受控知识库问答助手。只能使用下方知识片段回答。"
        "如果片段中没有问题指定的完整对象，只回答“未找到该对象的信息”。"
        "不要输出文档编号、来源或检索过程。\n\n"
        f"知识片段：\n{context}\n\n问题：{query}"
    )


def generate_answers(model, tokenizer, prompts: list[str], batch_size: int, max_new_tokens: int) -> list[str]:
    answers = []
    tokenizer.padding_side = "left"
    for offset in range(0, len(prompts), batch_size):
        batch = prompts[offset: offset + batch_size]
        messages = [[{"role": "user", "content": prompt}] for prompt in batch]
        rendered = [tokenizer.apply_chat_template(message, tokenize=False, add_generation_prompt=True) for message in messages]
        inputs = tokenizer(rendered, return_tensors="pt", padding=True, truncation=True, max_length=2048).to("cuda:0")
        input_length = int(inputs["input_ids"].shape[1])
        with torch.inference_mode():
            output = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                use_cache=True,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )
        answers.extend(tokenizer.batch_decode(output[:, input_length:], skip_special_tokens=True))
    return [answer.strip() for answer in answers]


def summarize(rows: list[dict], product_code: str) -> dict:
    selected = [row for row in rows if row["productCode"] == product_code]
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in selected:
        grouped[row["candidateId"]].append(row)
    candidate_rows = []
    for candidate_id, runs in grouped.items():
        candidate_rows.append({
            "id": candidate_id,
            "label": runs[0]["label"],
            "score": float(np.mean([run["score"] for run in runs])),
        })
    labels = [row["label"] for row in candidate_rows]
    scores = [row["score"] for row in candidate_rows]
    predictions = [int(score >= 0.5) for score in scores]
    member_scores = [row["score"] for row in candidate_rows if row["label"] == 1]
    nonmember_scores = [row["score"] for row in candidate_rows if row["label"] == 0]
    return {
        "productCode": product_code,
        "candidateCount": len(candidate_rows),
        "memberCount": sum(labels),
        "nonmemberCount": len(labels) - sum(labels),
        "queryCount": len(selected),
        "queriesPerCandidate": len(selected) // len(candidate_rows),
        "rocAuc": round(float(roc_auc_score(labels, scores)), 4),
        "accuracyAtHalf": round(float(accuracy_score(labels, predictions)), 4),
        "meanMemberScore": round(float(np.mean(member_scores)), 4),
        "meanNonmemberScore": round(float(np.mean(nonmember_scores)), 4),
        "scoreSource": "chatbot_answer_text_only",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--image-embeddings", type=Path, required=True)
    parser.add_argument("--database", type=Path, required=True)
    parser.add_argument("--results", type=Path, required=True)
    parser.add_argument("--responses", type=Path, required=True)
    parser.add_argument("--public-js", type=Path, required=True)
    parser.add_argument("--model", default="Qwen/Qwen2.5-7B-Instruct")
    parser.add_argument("--embedding-model", default="BAAI/bge-small-en-v1.5")
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--max-new-tokens", type=int, default=96)
    args = parser.parse_args()

    payload = json.loads(args.candidates.read_text(encoding="utf-8"))
    text_candidates = payload["textCandidates"]
    image_candidates = payload["imageCandidates"]
    image_payload = json.loads(args.image_embeddings.read_text(encoding="utf-8"))
    image_vectors = {row["id"]: np.asarray(row["embedding"], dtype=np.float32) for row in image_payload["rows"]}
    image_vectors = {key: value / np.linalg.norm(value) for key, value in image_vectors.items()}
    connection = create_database(args.database, text_candidates, image_candidates)

    embedder = SentenceTransformer(args.embedding_model, device="cpu")
    member_text = [candidate for candidate in text_candidates if candidate["member"]]
    member_text_matrix = normalize_rows(embedder.encode([row["content"] for row in member_text], convert_to_numpy=True, show_progress_bar=False).astype(np.float32))
    member_images = [candidate for candidate in image_candidates if candidate["member"]]

    requests = []
    for candidate in text_candidates:
        for query_index, query in enumerate(candidate["queries"]):
            retrieved = retrieve_text(query, embedder, member_text, member_text_matrix)
            requests.append({"candidate": candidate, "queryIndex": query_index, "prompt": prompt_for(candidate, query, retrieved)})
    for candidate in image_candidates:
        for query_index, query in enumerate(candidate["queries"]):
            retrieved = retrieve_image(candidate, image_vectors, member_images)
            requests.append({"candidate": candidate, "queryIndex": query_index, "prompt": prompt_for(candidate, query, retrieved)})

    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True, local_files_only=True)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        torch_dtype=torch.float16,
        attn_implementation="sdpa",
        low_cpu_mem_usage=True,
        local_files_only=True,
        trust_remote_code=True,
    ).to("cuda:0")
    model.eval()
    started = time.perf_counter()
    answers = generate_answers(model, tokenizer, [request["prompt"] for request in requests], args.batch_size, args.max_new_tokens)

    output_rows = []
    for request, answer in zip(requests, answers):
        candidate = request["candidate"]
        score, hits = answer_score(answer, candidate["anchors"])
        row = {
            "candidateId": candidate["id"],
            "productCode": candidate["productCode"],
            "label": int(candidate["member"]),
            "queryIndex": request["queryIndex"],
            "answer": answer,
            "score": score,
            "hits": hits,
        }
        output_rows.append(row)
        connection.execute(
            "INSERT INTO membership_runs VALUES (?, ?, ?, ?, ?, ?)",
            (candidate["id"], candidate["productCode"], int(candidate["member"]), request["queryIndex"], answer, score),
        )
    connection.commit()
    summaries = [summarize(output_rows, "030701"), summarize(output_rows, "030705")]
    result_payload = {
        "schemaVersion": 1,
        "experiment": "answer-text-only RAG corpus membership inference",
        "seed": payload["seed"],
        "model": args.model,
        "textRetriever": args.embedding_model,
        "imageRetriever": image_payload["model"],
        "elapsedSeconds": round(time.perf_counter() - started, 3),
        "results": summaries,
    }
    args.results.parent.mkdir(parents=True, exist_ok=True)
    args.responses.parent.mkdir(parents=True, exist_ok=True)
    args.public_js.parent.mkdir(parents=True, exist_ok=True)
    args.results.write_text(json.dumps(result_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.responses.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in output_rows) + "\n", encoding="utf-8")
    public_payload = {"schemaVersion": 1, "results": summaries}
    args.public_js.write_text(
        "window.__RAG_MEMBERSHIP_RESULTS__=" + json.dumps(public_payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(json.dumps(result_payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
