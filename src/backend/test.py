a = {}

keys = ["13", "12", "11", "13", "11", "11"]

for key in keys:
    a.setdefault(key, []).append("x")

print(a)
