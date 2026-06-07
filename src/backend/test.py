from utils.js_bridge import lint_gherkin

a = """
Feature: haha
    Scenario:
"""

r = lint_gherkin(a)

print(r)
