from sentence_transformers import CrossEncoder
from time import time

model = CrossEncoder("cross-encoder/nli-deberta-v3-small", device="cuda")
print(model.model.config.id2label)

label_mapping = ["contradiction", "entailment", "neutral"]


# bidirectional check, return both directions and average the scores
def predict(pairs):
    sentences1, sentences2 = zip(*pairs)
    scores1 = model.predict(list(zip(sentences1, sentences2)), batch_size=16)
    scores2 = model.predict(list(zip(sentences2, sentences1)), batch_size=16)
    avg_scores = (scores1 + scores2) / 2

    labels_scores1 = [label_mapping[score_max] for score_max in scores1.argmax(axis=1)]
    labels_scores2 = [label_mapping[score_max] for score_max in scores2.argmax(axis=1)]
    labels_avg = [label_mapping[score_max] for score_max in avg_scores.argmax(axis=1)]
    return labels_scores1, labels_scores2, labels_avg


start_time = time()
labels1, labels2, labels_avg = predict(
    [
        ("the app show a picture and text", "the application response an image"),
        (
            "user can login using phone number and password",
            "only email and password are used to login",
        ),
        ("The app display a dialog to confirm", "A dialog appear to confirm"),
        ("He has a phone call", "He is sitting"),
        ("True", "False"),
        ("The sky is blue", "The sky is clear"),
        ("Cats are animals", "Cats are plants"),
        ("I love programming", "I hate coding"),
        ("The sun rises in the east", "The sun sets in the west"),
    ]
)

end_time = time()
print("Labels from scores1:", labels1)
print("Labels from scores2:", labels2)
print("Labels from averaged scores:", labels_avg)
print(f"Total prediction time (bidirectional): {end_time - start_time} seconds")
