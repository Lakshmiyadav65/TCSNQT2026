import json
import os

files = ['numerical.json', 'verbal.json', 'reasoning.json', 'programming.json', 'coding.json', 'scenario.json']
base_path = 'c:/Users/laksh/Downloads/Projects/TCS NQT/data/'

results = {}
for f in files:
    with open(os.path.join(base_path, f), 'r', encoding='utf-8') as jf:
        data = json.load(jf)
        if isinstance(data, dict) and 'questions' in data:
            results[f] = len(data['questions'])
        else:
            results[f] = len(data)

print(json.dumps(results))
