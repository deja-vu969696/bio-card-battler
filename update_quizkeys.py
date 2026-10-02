import re

with open('src/data/biologyData.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace quizKeys
# Chemistry
code = re.sub(r"(id: 'chem-1',.*?quizKey: )'[^']+'", r"\1'ritomasu_shikenshi'", code)
code = re.sub(r"(id: 'chem-2',.*?quizKey: )'[^']+'", r"\1'kitai_kenchikan'", code)

# Physics
code = re.sub(r"(id: 'phys-1',.*?quizKey: )'[^']+'", r"\1'kansei_drive'", code)
code = re.sub(r"(id: 'phys-2',.*?quizKey: )'[^']+'", r"\1'ichi_energy_tou'", code)
code = re.sub(r"(id: 'phys-3',.*?quizKey: )'[^']+'", r"\1'denjiyuudou_turbine'", code)

# Earth
code = re.sub(r"(id: 'earth-1',.*?quizKey: )'[^']+'", r"\1'shinshoku_jikken_souchi'", code)
code = re.sub(r"(id: 'earth-2',.*?quizKey: )'[^']+'", r"\1'chisou_hagitori_hyohon'", code)
code = re.sub(r"(id: 'earth-3',.*?quizKey: )'[^']+'", r"\1'jishinkei'", code)

# Neutral (didn't have quizKey previously, so we'll add it before quiz:)
# Let's check how neu-1 is defined:
# id: 'neu-1', title: '精密天秤', category: 'scientific_inquiry', subject: 'neutral', status: 'unlocked', prerequisites: [],
# quiz: { ... }
code = re.sub(r"(id: 'neu-1',.*?prerequisites: \[\],)(.*?)quiz: \{", r"\1 quizKey: 'tenbin_hakari',\n    quiz: {", code, flags=re.DOTALL)
code = re.sub(r"(id: 'neu-2',.*?prerequisites: \[\],)(.*?)quiz: \{", r"\1 quizKey: 'jouhatsu_zara',\n    quiz: {", code, flags=re.DOTALL)
code = re.sub(r"(id: 'neu-3',.*?prerequisites: \[\],)(.*?)quiz: \{", r"\1 quizKey: 'loupe_kenbikyou',\n    quiz: {", code, flags=re.DOTALL)
code = re.sub(r"(id: 'neu-4',.*?prerequisites: \[\],)(.*?)quiz: \{", r"\1 quizKey: 'shigen_junkan_recycler',\n    quiz: {", code, flags=re.DOTALL)

with open('src/data/biologyData.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated quizKeys in biologyData.ts")
