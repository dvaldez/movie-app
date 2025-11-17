# test_qg_load.py

import sys

print("START")
print(" Executable:", sys.executable)
print(" Version:   ", sys.version.replace('\n', ' '))

# STEP 1: import classes
print("STEP 1: importing classes")
try:
    from transformers import T5Tokenizer, T5ForConditionalGeneration
    print("STEP 1 OK")
except Exception as e:
    print("STEP 1 FAILED:", e)
    sys.exit(1)

# STEP 2: load the slow SentencePiece tokenizer
print("STEP 2: loading slow tokenizer")
try:
    tokenizer = T5Tokenizer.from_pretrained("ThomasSimonini/t5-end2end-question-generation")
    print("STEP 2 OK")
except Exception as e:
    print("STEP 2 FAILED:", e)
    sys.exit(1)

# STEP 3: load the model
print("STEP 3: loading model")
try:
    model = T5ForConditionalGeneration.from_pretrained("ThomasSimonini/t5-end2end-question-generation")
    print("STEP 3 OK")
except Exception as e:
    print("STEP 3 FAILED:", e)
    sys.exit(1)

print("ALL STEPS SUCCEEDED")
