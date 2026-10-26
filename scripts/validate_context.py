#!/usr/bin/env python3
"""Validate Tevra Design Context v1 using the Python standard library."""

import json
import sys
from pathlib import Path


def validate(context: object) -> list[str]:
    errors: list[str] = []
    if not isinstance(context, dict):
        return ["root: expected object"]

    def obj(parent: dict, key: str, required: tuple[str, ...]) -> dict:
        value = parent.get(key)
        if not isinstance(value, dict):
            errors.append(f"{key}: expected object")
            return {}
        for field in required:
            if field not in value:
                errors.append(f"{key}.{field}: required")
        return value

    def strings(value: object, path: str, minimum: int = 0) -> None:
        if not isinstance(value, list) or len(value) < minimum or any(not isinstance(x, str) for x in value):
            errors.append(f"{path}: expected array of strings (minimum {minimum})")

    def unexpected(value: dict, allowed: set[str], path: str) -> None:
        errors.extend(f"{path}.{key}: unexpected property" for key in value.keys() - allowed)

    allowed = {"schemaVersion", "project", "experience", "direction", "tokens", "qualityBar", "constraints", "decisions"}
    errors.extend(f"{key}: unexpected property" for key in context.keys() - allowed)
    if context.get("schemaVersion") != "1.0.0":
        errors.append("schemaVersion: expected 1.0.0")

    project = obj(context, "project", ("name", "productType", "goal", "audience"))
    unexpected(project, {"name", "productType", "goal", "audience", "evidence"}, "project")
    for key in ("name", "productType", "goal"):
        if not isinstance(project.get(key), str) or not project.get(key, "").strip():
            errors.append(f"project.{key}: expected non-empty string")
    strings(project.get("audience"), "project.audience", 1)
    evidence = project.get("evidence", [])
    if not isinstance(evidence, list):
        errors.append("project.evidence: expected array")
    else:
        for index, entry in enumerate(evidence):
            path = f"project.evidence[{index}]"
            if not isinstance(entry, dict):
                errors.append(f"{path}: expected object")
                continue
            unexpected(entry, {"claim", "source", "confidence"}, path)
            if any(not isinstance(entry.get(k), str) or not entry[k] for k in ("claim", "source")):
                errors.append(f"{path}: expected claim and source strings")
            if entry.get("confidence") not in {"observed", "reported", "inferred", "unknown"}:
                errors.append(f"{path}.confidence: invalid value")

    experience = obj(context, "experience", ("platform", "primaryFlow", "states"))
    unexpected(experience, {"platform", "primaryFlow", "states", "accessibilityTarget"}, "experience")
    if experience.get("platform") not in {"web", "mobile-web", "ios", "android", "desktop", "multi-platform"}:
        errors.append("experience.platform: invalid value")
    strings(experience.get("primaryFlow"), "experience.primaryFlow", 1)
    strings(experience.get("states"), "experience.states")
    state_values = {"loading", "empty", "error", "success", "disabled", "offline"}
    if isinstance(experience.get("states"), list) and any(s not in state_values for s in experience["states"]):
        errors.append("experience.states: contains invalid state")
    if "accessibilityTarget" in experience and not isinstance(experience["accessibilityTarget"], str):
        errors.append("experience.accessibilityTarget: expected string")

    direction = obj(context, "direction", ("concept", "principles", "references", "avoid"))
    unexpected(direction, {"concept", "principles", "references", "avoid"}, "direction")
    if not isinstance(direction.get("concept"), str) or not direction.get("concept", "").strip():
        errors.append("direction.concept: expected non-empty string")
    for key, minimum in (("principles", 1), ("references", 0), ("avoid", 0)):
        strings(direction.get(key), f"direction.{key}", minimum)

    tokens = obj(context, "tokens", ("color", "typography", "spacing", "shape", "motion"))
    unexpected(tokens, {"color", "typography", "spacing", "shape", "motion"}, "tokens")
    for key in ("color", "typography", "spacing", "shape", "motion"):
        value = tokens.get(key)
        if not isinstance(value, dict) or not value or any(not isinstance(v, str) or not v for v in value.values()):
            errors.append(f"tokens.{key}: expected non-empty object of strings")
    strings(context.get("qualityBar"), "qualityBar", 1)
    for key in ("constraints", "decisions"):
        if key in context:
            strings(context[key], key)
    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: validate_context.py <design-context.json>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    try:
        context = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Cannot read valid JSON from {path}: {exc}", file=sys.stderr)
        return 2
    errors = validate(context)
    if errors:
        print("Invalid design context:\n" + "\n".join(f"- {error}" for error in errors))
        return 1
    print(f"Valid Tevra Design Context v1.0.0: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
