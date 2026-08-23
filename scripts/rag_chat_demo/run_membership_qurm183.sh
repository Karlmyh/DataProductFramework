#!/usr/bin/env bash
set -euo pipefail

RUN_ROOT="${1:-/home/samsung/rag-membership-inference-20260823}"
STYLECLIP_PY="/home/samsung/anaconda3/envs/styleclip/bin/python"
RAG_PY="/home/samsung/kg-privacy-runs/R121_R122/environment/bin/python"
SCRIPT_DIR="$RUN_ROOT/scripts/rag_chat_demo"
ARTIFACT_DIR="$RUN_ROOT/artifacts"
RESULT_DIR="$RUN_ROOT/results"

if [[ "${RAG_MEMBERSHIP_FIXED_BENCHMARK:-}" != "1" ]]; then
  echo "RAG_MEMBERSHIP_FIXED_BENCHMARK=1 is required" >&2
  exit 2
fi
if [[ -z "${CUDA_VISIBLE_DEVICES:-}" ]]; then
  echo "CUDA_VISIBLE_DEVICES must bind a checked idle GPU" >&2
  exit 2
fi

mkdir -p "$ARTIFACT_DIR" "$RESULT_DIR"

"$RAG_PY" "$SCRIPT_DIR/prepare_membership_benchmark.py" \
  --output-dir "$ARTIFACT_DIR/benchmark"

"$STYLECLIP_PY" "$SCRIPT_DIR/encode_membership_images.py" \
  --candidates "$ARTIFACT_DIR/benchmark/membership-candidates.json" \
  --output "$ARTIFACT_DIR/image-embeddings.json"

TRANSFORMERS_OFFLINE=1 HF_HUB_OFFLINE=1 "$RAG_PY" "$SCRIPT_DIR/run_membership_inference.py" \
  --candidates "$ARTIFACT_DIR/benchmark/membership-candidates.json" \
  --image-embeddings "$ARTIFACT_DIR/image-embeddings.json" \
  --database "$ARTIFACT_DIR/rag-membership.sqlite3" \
  --results "$RESULT_DIR/membership-inference-results.json" \
  --responses "$RESULT_DIR/membership-inference-responses.jsonl" \
  --public-js "$RESULT_DIR/rag-membership-results.js"
