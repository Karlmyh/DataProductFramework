# 030701 / 030705 Qwen + RAG demo

This directory contains the reproducible, offline build pipeline for the fixed-question chatbot in the public security-measurement demo.

- `data/text_documents.jsonl`: fictional policy and security knowledge chunks.
- `data/image_documents.jsonl`: public demo image manifest.
- `encode_clip_images.py`: builds CLIP ViT-B/32 image vectors.
- `build_rag_demo.py`: builds the SQLite vector store, retrieves evidence, invokes locally cached Qwen2.5-7B-Instruct, and exports the audited fixed-question responses.

The public page receives only the generated answers, public citations, model names, and corpus hashes. The SQLite database and raw embeddings remain build artifacts and are not published.

On QURM183, run the fixed-corpus build on a checked idle GPU with:

```bash
RAG_CHAT_DEMO_FIXED_CORPUS=1 CUDA_VISIBLE_DEVICES=5 \
  bash scripts/rag_chat_demo/run_qurm183.sh /home/samsung/rag-chat-demo-0307-20260823
```
