#!/usr/bin/env bash
set -euo pipefail

RUN_ROOT="${1:-/home/samsung/rag-chat-demo-0307-20260823}"
STYLECLIP_PY="/home/samsung/anaconda3/envs/styleclip/bin/python"
RAG_PY="/home/samsung/kg-privacy-runs/R121_R122/environment/bin/python"
WORKSPACE="$RUN_ROOT"
DATA_DIR="$WORKSPACE/scripts/rag_chat_demo/data"
ARTIFACT_DIR="$WORKSPACE/artifacts"
RESULT_DIR="$WORKSPACE/results"

if [[ "${RAG_CHAT_DEMO_FIXED_CORPUS:-}" != "1" ]]; then
  echo "RAG_CHAT_DEMO_FIXED_CORPUS=1 is required" >&2
  exit 2
fi
if [[ -z "${CUDA_VISIBLE_DEVICES:-}" ]]; then
  echo "CUDA_VISIBLE_DEVICES must bind the checked GPU" >&2
  exit 2
fi

mkdir -p "$ARTIFACT_DIR" "$RESULT_DIR"

"$STYLECLIP_PY" "$WORKSPACE/scripts/rag_chat_demo/encode_clip_images.py" \
  --image-documents "$DATA_DIR/image_documents.jsonl" \
  --project-root "$WORKSPACE" \
  --output "$ARTIFACT_DIR/clip-image-embeddings.json"

TRANSFORMERS_OFFLINE=1 HF_HUB_OFFLINE=1 "$RAG_PY" "$WORKSPACE/scripts/rag_chat_demo/build_rag_demo.py" \
  --text-documents "$DATA_DIR/text_documents.jsonl" \
  --image-documents "$DATA_DIR/image_documents.jsonl" \
  --questions "$DATA_DIR/questions.json" \
  --clip-embeddings "$ARTIFACT_DIR/clip-image-embeddings.json" \
  --database "$ARTIFACT_DIR/rag-demo.sqlite3" \
  --output-json "$RESULT_DIR/qwen-rag-responses.json" \
  --output-js "$RESULT_DIR/rag-chat-data.js"
