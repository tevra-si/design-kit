import json
import unittest
from pathlib import Path

from scripts.validate_context import validate


ROOT = Path(__file__).resolve().parents[1]


class ValidateContextTests(unittest.TestCase):
    def setUp(self):
        self.context = json.loads((ROOT / "examples/design-context.json").read_text(encoding="utf-8"))

    def test_example_is_valid(self):
        self.assertEqual([], validate(self.context))

    def test_missing_primary_flow_is_rejected(self):
        del self.context["experience"]["primaryFlow"]
        self.assertIn("experience.primaryFlow: required", validate(self.context))

    def test_unknown_version_is_rejected(self):
        self.context["schemaVersion"] = "2.0.0"
        self.assertIn("schemaVersion: expected 1.0.0", validate(self.context))

    def test_unknown_root_field_is_rejected(self):
        self.context["unreviewed"] = True
        self.assertIn("unreviewed: unexpected property", validate(self.context))

    def test_unknown_token_category_is_rejected(self):
        self.context["tokens"]["sound"] = {"click": "soft"}
        self.assertIn("tokens.sound: unexpected property", validate(self.context))

    def test_evidence_requires_confidence(self):
        self.context["project"]["evidence"][0].pop("confidence")
        self.assertIn("project.evidence[0].confidence: invalid value", validate(self.context))


if __name__ == "__main__":
    unittest.main()
