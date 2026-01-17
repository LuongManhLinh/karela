import subprocess
import sys


def check_gherkin_syntax_in_file(path):
    result = subprocess.run(["gherlint", path], capture_output=True, text=True)

    if result.returncode == 0:
        print("✅ Syntax check passed!")
    else:
        print("❌ Syntax errors found:")
        print(result.stdout)


def check_gherkin_syntax_in_string(gherkin_string):
    process = subprocess.Popen(
        ["gherlint", "-"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    stdout, stderr = process.communicate(input=gherkin_string)

    if process.returncode == 0:
        print("✅ Syntax check passed!")
    else:
        print("❌ Syntax errors found:")
        print(stdout)


if __name__ == "__main__":
    file = "sample_ac.feature"
    print(f"Checking Gherkin syntax in file: {file}")
    check_gherkin_syntax_in_file(file)
