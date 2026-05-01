from concurrent.futures import ThreadPoolExecutor
import os

# Create executor with default settings
with ThreadPoolExecutor() as executor:
    print(f"Default threads on this machine: {executor._max_workers}")

# Verifying manually with the formula
cpu_count = os.cpu_count() or 1
calculated_default = min(32, cpu_count + 4)
print(f"Calculated default: {calculated_default}")
