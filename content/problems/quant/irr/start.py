cs = [float(x) for x in input().split()]


def npv(r):
    return sum(c / (1 + r) ** t for t, c in enumerate(cs))

# find r mellem -0.9 og 10, hvor npv(r) = 0
