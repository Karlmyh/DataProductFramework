#!/usr/bin/env python3
"""Encode every synthetic image candidate with the cached CLIP model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import clip
import torch
from PIL import Image


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--clip-model", default="/home/samsung/.cache/clip/ViT-B-32.pt")
    args = parser.parse_args()
    payload = json.loads(args.candidates.read_text(encoding="utf-8"))
    model, preprocess = clip.load(args.clip_model, device="cuda:0", jit=False)
    model.eval()
    rows = []
    with torch.no_grad():
        for candidate in payload["imageCandidates"]:
            image = preprocess(Image.open(candidate["path"]).convert("RGB")).unsqueeze(0).to("cuda:0")
            embedding = model.encode_image(image).float()
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            rows.append({"id": candidate["id"], "embedding": embedding[0].cpu().tolist()})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"model": "OpenAI CLIP ViT-B/32", "rows": rows}), encoding="utf-8")
    print(json.dumps({"images": len(rows), "output": str(args.output)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
