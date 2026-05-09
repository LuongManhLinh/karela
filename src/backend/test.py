a = [False, True, None, False, True, None]
order = {None: 0, True: 1, False: 2}

a.sort(key=lambda x: order[x])
print(a)  # Output: [False, False, True, True, None, None
