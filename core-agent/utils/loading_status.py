import time
import sys


def loading_dots(duration=5):
    print("1. Dots Loading:")
    for i in range(duration * 2):
        dots = "." * (i % 4)  # Cycles through "", ".", "..", "..."
        # \r moves to start, \033[K clears the line to prevent ghost characters
        sys.stdout.write(f"\rLoading{dots}\033[K")
        sys.stdout.flush()
        time.sleep(0.5)
    print("\nDone!\n")


def spinning_stick(duration=20):
    print("2. Spinning Stick:")
    symbols = ["|", "/", "-", "\\"]
    for i in range(duration):
        sys.stdout.write(f"\rProcessing {symbols[i % len(symbols)]}")
        sys.stdout.flush()
        time.sleep(0.1)
    print("\nDone!\n")


def progress_bar(steps=20):
    print("3. Growing Arrow:")
    for i in range(steps + 1):
        # Creates "===>" effect
        bar = "=" * i + ">"
        sys.stdout.write(f"\rProgress: [{bar:<21}]")  # <21 keeps the width steady
        sys.stdout.flush()
        time.sleep(0.1)
    print("\nDone!")


# Run them
if __name__ == "__main__":
    loading_dots()
    spinning_stick()
    progress_bar()
