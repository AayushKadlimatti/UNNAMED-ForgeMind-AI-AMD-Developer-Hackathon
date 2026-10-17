"""Deterministic SAMPLE retrieval. No PDFs, embeddings, LLM, or FAISS are used."""
import re
from typing import Protocol

DISCLAIMER = ("SAMPLE DEMONSTRATION EXCERPTS — not verified manufacturer instructions. "
              "Do not use for real maintenance until the real OEM manual is provided and checked. "
              "Only qualified personnel should perform maintenance under approved site procedures.")

EXCERPTS = (
    {
        "excerpt_id": "sample-bearing-5.3",
        "citation": "HydroConveyor Series 4 Manual, Section 5.3 (Bearing Assembly)",
        "content": "For excessive vibration above 3.0g or outer race wear, isolate the 480V power source using the approved Lockout/Tagout (LOTO) procedure before inspection. Inspect the bearing cage for fatigue. Re-torque mounting bolts to 45 Nm using a calibrated wrench.",
        "keywords": frozenset({"bearing", "vibration", "torque", "race", "loto", "bolts"}),
    },
    {
        "excerpt_id": "sample-thermal-7.1",
        "citation": "HydroConveyor Series 4 Manual, Section 7.1 (Thermal Limits)",
        "content": "Winding temperature exceeding 65°C may indicate ventilation blockage or severe stator misalignment. Inspect and clear cooling ducts where safe, and verify fan rotation according to the manufacturer's approved procedure.",
        "keywords": frozenset({"temperature", "heat", "cooling", "ventilation", "thermal", "stator", "fan", "ducts"}),
    },
)
ALIASES = {"bearings": "bearing", "vibrations": "vibration", "vibrating": "vibration",
           "overheating": "heat", "overheat": "heat", "hot": "heat", "heating": "heat",
           "temperatures": "temperature", "torquing": "torque", "bolt": "bolts",
           "duct": "ducts"}


class ManualRetriever(Protocol):
    """Future PDF/vector retrievers must preserve the API response contract.

    A real retriever must also update schemas that currently declare sample/keyword literals.
    """
    def search(self, query: str) -> dict: ...


class KeywordManualRetriever:
    def search(self, query: str) -> dict:
        if not isinstance(query, str) or not query.strip() or len(query.strip()) > 1000:
            raise ValueError("query must contain 1–1000 non-whitespace characters")
        query = query.strip()
        tokens = {ALIASES.get(word, word) for word in re.findall(r"[a-z]+", query.lower())}
        matches = []
        for excerpt in EXCERPTS:
            hits = sorted(tokens & excerpt["keywords"])
            if hits:
                matches.append({key: excerpt[key] for key in ("excerpt_id", "citation", "content")} |
                               {"score": float(len(hits)), "matched_keywords": hits, "is_sample": True})
        matches.sort(key=lambda match: (-match["score"], match["excerpt_id"]))
        return {"query": query, "matched": bool(matches), "matches": matches,
                "message": ("Matched sample excerpts; score counts distinct matching keyword concepts."
                            if matches else "No sample excerpt matched. Try bearing, vibration, torque, temperature, heat, cooling, or ventilation; obtain the verified OEM manual for other issues."),
                "retrieval_method": "keyword", "is_sample": True, "disclaimer": DISCLAIMER}


_retriever: ManualRetriever = KeywordManualRetriever()


def search_manual(query: str) -> dict:
    return _retriever.search(query)
