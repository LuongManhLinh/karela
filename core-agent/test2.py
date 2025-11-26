def x(y):
    y(100)


def z():
    res = None

    def y(value):
        nonlocal res
        res = value

    x(y)
    return res


print(z())
