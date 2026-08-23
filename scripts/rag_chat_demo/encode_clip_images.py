#!/usr/bin/env python3
"""Encode the fixed public demo images with the cached CLIP ViT-B/32 model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image-documents", type=Path, required=True)
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--clip-cache", type=Path, default=Path.home() / ".cache" / "clip")
    args = parser.parse_args()

    import clip
    import torch
    from PIL import Image

    documents = read_jsonl(args.image_documents)
    if not documents or not all(document.get("fictional") is True for document in documents):
        raise RuntimeError("Only the fixed fictional/public demo image manifest is allowed")

    project_root = args.project_root.resolve()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device, download_root=str(args.clip_cache), jit=False)
    model.eval()
    rows = []
    # The existing StyleCLIP environment on QURM183 uses PyTorch 1.7, where
    # inference_mode is unavailable; no_grad provides the required read-only pass.
    with torch.no_grad():
        for document in documents:
            image_path = (project_root / document["path"]).resolve()
            if project_root not in image_path.parents:
                raise RuntimeError(f"Image path escapes project root: {image_path}")
            image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
            vector = model.encode_image(image).float()
            vector = vector / vector.norm(dim=-1, keepdim=True)
            rows.append({
                "id": document["id"],
                "model": "OpenAI CLIP ViT-B/32",
                "dimension": int(vector.shape[-1]),
                "embedding": vector[0].cpu().tolist(),
            })

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"schema_version": 1, "rows": rows}, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"status": "complete", "images": len(rows), "model": "OpenAI CLIP ViT-B/32"}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
