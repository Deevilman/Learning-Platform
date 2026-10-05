# Referenceløsning til quant/markov (kun hos dommeren)
a, b, pi0, k = input().split()
a, b, pi0, k = float(a), float(b), float(pi0), int(k)
star = (1 - b) / ((1 - a) + (1 - b))


def power(x, e):
    result = 1.0
    while e:
        if e & 1:
            result *= x
        x *= x
        e >>= 1
    return result


print(f"{star + power(a + b - 1, k) * (pi0 - star):.6f}")
print(f"{star:.6f}")
