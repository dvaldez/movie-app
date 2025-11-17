from transformers import T5ForConditionalGeneration, T5TokenizerFast

# use a public, Apache-licensed question-generation model:
tokenizer = T5TokenizerFast.from_pretrained("ThomasSimonini/t5-end2end-question-generation")
model     = T5ForConditionalGeneration.from_pretrained("ThomasSimonini/t5-end2end-question-generation")


print("✅ Import and tokenizer load succeeded!")
