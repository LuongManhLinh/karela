from utils.wordnet import synonyms_wordnet, antonyms_wordnet, are_opposites

word1 = "conflict"
word2 = "contradict"

print(f"Synonyms of '{word1}': {synonyms_wordnet(word1, pos='v')}")
print(f"Synonyms of '{word2}': {synonyms_wordnet(word2, pos='v')}")
print(f"Antonyms of '{word1}': {antonyms_wordnet(word1, pos='v')}")
print(f"Antonyms of '{word2}': {antonyms_wordnet(word2, pos='v')}")
print(f"Are '{word1}' and '{word2}' opposites? {are_opposites(word1, word2)}")
