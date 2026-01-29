# install:
# pip install nltk
# python -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

from nltk.corpus import wordnet as wn


def synonyms_wordnet(lemma: str, pos="n") -> set[str]:
    syns = set()
    for syn in wn.synsets(lemma, pos=pos):
        for l in syn.lemmas():
            syns.add(l.name().replace("_", " "))
    return syns


OPPOSITES = {
    "allow": {"deny", "forbid", "disallow"},
    "enable": {"disable"},
    "grant": {"revoke"},
    "require": {"permit"},  # domain nuance: "require X" vs "permit without X"
    "increase": {"decrease", "reduce"},
    "add": {"remove", "delete"},
    "lock": {"unlock"},
    "show": {"hide"},
}


def antonyms_wordnet(lemma: str, pos="v") -> set[str]:
    ants = set()
    for syn in wn.synsets(lemma, pos=pos):
        for l in syn.lemmas():
            for a in l.antonyms():
                ants.add(a.name().replace("_", " "))
    return ants


def are_opposites(v1: str, v2: str) -> bool:
    v1, v2 = v1.lower(), v2.lower()
    if v1 in OPPOSITES and v2 in OPPOSITES[v1]:
        return True
    if v2 in OPPOSITES and v1 in OPPOSITES[v2]:
        return True
    # fallback
    return v2 in antonyms_wordnet(v1) or v1 in antonyms_wordnet(v2)
