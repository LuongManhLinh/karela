import pandas as pd

df = pd.read_parquet(
    "hf://datasets/nalmeida/agile_guerkin_dataset/data/train-00000-of-00001.parquet"
)

# save to csv
df.to_csv("train.csv", index=False)
