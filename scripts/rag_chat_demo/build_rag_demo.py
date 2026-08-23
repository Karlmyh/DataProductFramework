#!/usr/bin/env python3
"""Build a real SQLite RAG index and generate the fixed Qwen demo answers."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import time
from pathlib import Path


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def vector_blob(vector) -> bytes:
    import numpy as np

    return np.asarray(vector, dtype=np.float32).tobytes()


def public_asset_path(path: str) -> str:
    prefix = "github-pages/"
    return path[len(prefix):] if path.startswith(prefix) else path


def public_answer(answer: str) -> str:
    """Remove retrieval identifiers from the browser-facing answer."""
    return re.sub(r"\s*依据\s*[:：][\s\S]*$", "", answer).strip()


def create_database(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    connection = sqlite3.connect(path)
    connection.executescript(
        """
        PRAGMA journal_mode=WAL;
        CREATE TABLE rag_documents (
          id TEXT PRIMARY KEY,
          modality TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          source TEXT NOT NULL,
          asset_path TEXT,
          embedding_model TEXT NOT NULL,
          embedding_dimension INTEGER NOT NULL,
          embedding BLOB NOT NULL
        );
        CREATE INDEX idx_rag_documents_modality ON rag_documents(modality);
        CREATE TABLE qa_runs (
          question_id TEXT PRIMARY KEY,
          product_code TEXT NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          retrieved_json TEXT NOT NULL,
          generation_model TEXT NOT NULL,
          generation_seconds REAL NOT NULL
        );
        """
    )
    return connection


def retrieve(query_vector, matrix, rows: list[dict], top_k: int) -> list[dict]:
    import numpy as np

    scores = matrix @ query_vector
    selected = np.argsort(-scores)[: min(top_k, len(rows))]
    return [
        {**rows[int(index)], "score": round(float(scores[int(index)]), 6)}
        for index in selected
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text-documents", type=Path, required=True)
    parser.add_argument("--image-documents", type=Path, required=True)
    parser.add_argument("--questions", type=Path, required=True)
    parser.add_argument("--clip-embeddings", type=Path, required=True)
    parser.add_argument("--database", type=Path, required=True)
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-js", type=Path, required=True)
    parser.add_argument("--model", default="Qwen/Qwen2.5-7B-Instruct")
    parser.add_argument("--embedding-model", default="BAAI/bge-small-en-v1.5")
    parser.add_argument("--max-new-tokens", type=int, default=320)
    args = parser.parse_args()

    import numpy as np
    import torch
    from sentence_transformers import SentenceTransformer
    from transformers import AutoModelForCausalLM, AutoTokenizer

    text_documents = read_jsonl(args.text_documents)
    image_documents = read_jsonl(args.image_documents)
    questions = json.loads(args.questions.read_text(encoding="utf-8"))
    clip_rows = {row["id"]: row for row in json.loads(args.clip_embeddings.read_text(encoding="utf-8"))["rows"]}
    manifests = [*text_documents, *image_documents, *questions]
    if not manifests or not all(item.get("fictional") is True for item in manifests):
        raise RuntimeError("The demo builder only accepts manifests explicitly marked fictional=true")
    if any("http://" in json.dumps(item) or "https://" in json.dumps(item) for item in manifests):
        raise RuntimeError("Network URLs are not allowed in the offline RAG corpus")

    embedder = SentenceTransformer(args.embedding_model, device="cpu")
    text_matrix = embedder.encode(
        [document["embedding_text"] for document in text_documents],
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    ).astype(np.float32)
    query_matrix = embedder.encode(
        [question["retrieval_query"] for question in questions],
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    ).astype(np.float32)

    connection = create_database(args.database)
    for document, embedding in zip(text_documents, text_matrix):
        connection.execute(
            "INSERT INTO rag_documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (document["id"], "text", document["title"], document["content"], document["source"], None,
             args.embedding_model, int(embedding.shape[0]), vector_blob(embedding)),
        )
    for document in image_documents:
        clip_row = clip_rows[document["id"]]
        connection.execute(
            "INSERT INTO rag_documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (document["id"], "image", document["title"], document["content"], document["source"], document["path"],
             clip_row["model"], clip_row["dimension"], vector_blob(clip_row["embedding"])),
        )
    connection.commit()
    connection.execute("PRAGMA optimize")

    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True, local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        torch_dtype=torch.float16,
        attn_implementation="sdpa",
        low_cpu_mem_usage=True,
        local_files_only=True,
        trust_remote_code=True,
    ).to("cuda:0")
    model.eval()
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id

    image_vectors = {
        row_id: np.asarray(row["embedding"], dtype=np.float32)
        for row_id, row in clip_rows.items()
    }
    generated = []
    for question_index, question in enumerate(questions):
        retrieved_text = retrieve(query_matrix[question_index], text_matrix, text_documents, 3 if question["product_code"] == "030701" else 2)
        retrieved = []
        if question.get("image_id"):
            image_id = question["image_id"]
            query_image = image_vectors[image_id]
            image_rows = [document for document in image_documents]
            image_matrix = np.stack([image_vectors[document["id"]] for document in image_rows])
            retrieved.extend(retrieve(query_image, image_matrix, image_rows, 1))
        retrieved.extend(retrieved_text)
        context = "\n\n".join(
            f"[{item['id']}] {item['title']}\n来源：{item['source']}\n{item['content']}"
            for item in retrieved
        )
        messages = [
            {
                "role": "system",
                "content": (
                    "你是数据产品安全衡量框架的知识助手。资料均为虚构演示材料。"
                    "只能依据检索上下文回答，不得补充上下文没有的事实。"
                    "先直接回答，再用清晰要点说明。"
                    "回答中不得输出资料编号、文件名、来源、引用或检索过程。"
                    "若含图片资料，只能依据检索到的图片说明，不得声称看到了说明之外的细节。"
                ),
            },
            {"role": "user", "content": f"检索上下文：\n{context}\n\n问题：{question['question']}"},
        ]
        rendered = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer(rendered, return_tensors="pt", truncation=True, max_length=4096).to("cuda:0")
        started = time.perf_counter()
        with torch.inference_mode():
            output = model.generate(
                **inputs,
                max_new_tokens=args.max_new_tokens,
                do_sample=False,
                use_cache=True,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )
        generation_seconds = time.perf_counter() - started
        input_length = int(inputs["input_ids"].shape[1])
        answer = tokenizer.decode(output[0, input_length:], skip_special_tokens=True).strip()
        public_retrieval = [
            {
                "id": item["id"],
                "title": item["title"],
                "source": item["source"],
                "score": item["score"],
                **({"path": public_asset_path(item["path"])} if item.get("path") else {}),
            }
            for item in retrieved
        ]
        connection.execute(
            "INSERT INTO qa_runs VALUES (?, ?, ?, ?, ?, ?, ?)",
            (question["id"], question["product_code"], question["question"], answer,
             json.dumps(public_retrieval, ensure_ascii=False), args.model, generation_seconds),
        )
        generated.append({
            "id": question["id"],
            "productCode": question["product_code"],
            "question": question["question"],
            "imageId": question.get("image_id"),
            "answer": public_answer(answer),
        })
    connection.commit()

    payload = {
        "schemaVersion": 2,
        "images": [
            {"id": item["id"], "title": item["title"], "path": public_asset_path(item["path"])}
            for item in image_documents
        ],
        "responses": generated,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_js.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.output_js.write_text(
        "window.__RAG_CHAT_DATA__=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "complete", "database": str(args.database), "responses": len(generated)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
