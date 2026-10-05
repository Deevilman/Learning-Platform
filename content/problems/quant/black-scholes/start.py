import math

S, K, r, sigma, T = map(float, input().split())


def Phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))
