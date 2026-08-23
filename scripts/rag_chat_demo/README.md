# 030701 / 030705 Qwen + RAG demo

This directory contains the reproducible, offline build pipeline for the fixed-question chatbot in the public security-measurement demo.

- `data/text_documents.jsonl`: fictional policy and security knowledge chunks.
- `data/image_documents.jsonl`: public demo image manifest.
- `encode_clip_images.py`: builds CLIP ViT-B/32 image vectors.
- `build_rag_demo.py`: builds the SQLite vector store, retrieves evidence, invokes locally cached Qwen2.5-7B-Instruct, and exports the audited fixed-question responses.

The public page receives only the fixed questions, generated answer text, and the three demo images. Retrieval records, document identifiers, model metadata, timings, the SQLite database, and raw embeddings remain private build artifacts. The browser-side attack therefore works only from answer text and never reads retrieval traces.

The two public RAG chatbot products expose the same low-budget call-limit choices: `2`, `5`, and `10`. Other product demos keep their existing limits.

The public metric follows the selected model-call limit. A normal Chatbot answer consumes one call; the membership attack uses only the remaining calls. The candidate pool never changes: 030701 always evaluates all 40 candidates (20 members), while 030705 always evaluates all 24 candidates (12 members). In this controlled upper-bound schedule, each attack query confirms one distinct member from its real Qwen answer; unconfirmed candidates receive score zero. ROC-AUC is always computed over the full fixed pool.

| Product | Fixed candidates | Members | Model-call limit | Normal answer | Attack queries | Confirmed members | ROC-AUC |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 030701 | 40 | 20 | 2 | 1 | 1 | 1 | 0.5250 |
| 030701 | 40 | 20 | 5 | 1 | 4 | 4 | 0.6000 |
| 030701 | 40 | 20 | 10 | 1 | 9 | 9 | 0.7250 |
| 030705 | 24 | 12 | 2 | 1 | 1 | 1 | 0.5417 |
| 030705 | 24 | 12 | 5 | 1 | 4 | 4 | 0.6667 |
| 030705 | 24 | 12 | 10 | 1 | 9 | 9 | 0.8750 |

## RAG corpus membership benchmark

The membership benchmark creates a separate, real SQLite RAG database and a balanced candidate dataset. Only member candidates are inserted into `rag_documents`; every candidate is then queried twice through Qwen2.5-7B-Instruct. The attack score is computed from the generated Chatbot answer text only. Membership labels are never used by retrieval, generation, or scoring and are read only when computing ROC-AUC.

- `prepare_membership_benchmark.py`: creates 40 fictional text candidates (20 members) and 24 synthetic image candidates (12 members).
- `encode_membership_images.py`: encodes all image candidates with offline CLIP ViT-B/32.
- `run_membership_inference.py`: builds SQLite, runs text/image RAG, scores 128 generated answers, and exports ROC-AUC summaries.
- `run_membership_qurm183.sh`: reproducible QURM183 entrypoint with explicit benchmark and GPU safety gates.

The controlled QURM183 run with seed `20260823` produced ROC-AUC `1.000` for both 030701 (80 queries) and 030705 (48 queries). This is a deliberately separable synthetic benchmark, not an estimate of general production-system risk.

On QURM183, run the fixed-corpus build on a checked idle GPU with:

```bash
RAG_CHAT_DEMO_FIXED_CORPUS=1 CUDA_VISIBLE_DEVICES=5 \
  bash scripts/rag_chat_demo/run_qurm183.sh /home/samsung/rag-chat-demo-0307-20260823
```

Run the membership benchmark in its own isolated directory with:

```bash
RAG_MEMBERSHIP_FIXED_BENCHMARK=1 CUDA_VISIBLE_DEVICES=5 \
  bash scripts/rag_chat_demo/run_membership_qurm183.sh /home/samsung/rag-membership-inference-20260823
```
