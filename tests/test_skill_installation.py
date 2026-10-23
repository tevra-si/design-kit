import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL_NAMES = ("design-research", "design-direction", "design-system", "ui-builder", "ui-redesign", "responsive-design", "interaction-motion", "visual-review", "accessibility-qa")


class SkillInstallationTests(unittest.TestCase):
    def test_each_skill_has_metadata_and_complete_workflow_sections(self):
        for name in SKILL_NAMES:
            with self.subTest(skill=name):
                skill = (ROOT / "skills" / name / "SKILL.md").read_text(encoding="utf-8")
                self.assertTrue(skill.startswith("---\nname: " + name + "\n"))
                self.assertIn("## Workflow", skill)
                self.assertIn("## Completion criteria", skill)
                self.assertIn("design system", skill.lower())

    def test_local_installed_copies_match_sources(self):
        if not (ROOT / ".agents" / "skills").exists():
            self.skipTest("Root .agents installation unavailable; TypeScript integration tests verify adapters in temporary projects")
        for name in SKILL_NAMES:
            with self.subTest(skill=name):
                source = (ROOT / "skills" / name / "SKILL.md").read_text(encoding="utf-8")
                installed = (ROOT / ".agents" / "skills" / name / "SKILL.md").read_text(encoding="utf-8")
                self.assertEqual(source, installed)


if __name__ == "__main__":
    unittest.main()
