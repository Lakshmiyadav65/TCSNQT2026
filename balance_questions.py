import json
import os

base_path = 'c:/Users/laksh/Downloads/Projects/TCS NQT/data/'
targets = {
    'numerical.json': 200,
    'verbal.json': 200,
    'reasoning.json': 200,
    'programming.json': 250,
    'coding.json': 150
}

def duplicate_questions(filename, target_count):
    path = os.path.join(base_path, filename)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    is_dict = isinstance(data, dict) and 'questions' in data
    questions = data['questions'] if is_dict else data
    
    current_count = len(questions)
    if current_count >= target_count:
        # If already at or above target, just trim if it's verbal (203 -> 200)
        new_questions = questions[:target_count]
    else:
        # Duplicate questions to reach target
        new_questions = list(questions)
        while len(new_questions) < target_count:
            # Take from the beginning as requested ("Slide 1")
            for q in questions:
                if len(new_questions) >= target_count:
                    break
                # Deep copy by re-encoding/decoding or just copy dict
                new_q = json.loads(json.dumps(q))
                # Update ID to be unique
                new_q['id'] = f"{new_q['id']}_extra_{len(new_questions)}"
                new_questions.append(new_q)
    
    if is_dict:
        data['questions'] = new_questions
        if 'metadata' in data:
            data['metadata']['total_questions'] = len(new_questions)
    else:
        data = new_questions
        
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    return len(new_questions)

results = {}
for f, target in targets.items():
    results[f] = duplicate_questions(f, target)

print(json.dumps(results))
