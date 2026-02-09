#!/usr/bin/env python3
"""
Parse AWS practice exam markdown files and convert to JSON format for flashcard app.
"""

import os
import re
import json
from pathlib import Path

def parse_exam_file(filepath):
    """Parse a single exam markdown file and extract questions."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    
    # Pattern to match each question block
    # Questions start with a number followed by period
    question_pattern = re.compile(
        r'^\d+\.\s+(.+?)(?=^\d+\.\s+|\Z)',
        re.MULTILINE | re.DOTALL
    )
    
    matches = question_pattern.findall(content)
    
    for match in matches:
        question_data = parse_question_block(match)
        if question_data:
            questions.append(question_data)
    
    return questions

def parse_question_block(block):
    """Parse a single question block and extract question, options, and answer."""
    lines = block.strip().split('\n')
    
    # Extract question text (first line(s) before options)
    question_lines = []
    options = {}
    answer = None
    current_option = None
    
    i = 0
    # Get question text
    while i < len(lines):
        line = lines[i].strip()
        if re.match(r'^-\s+[A-F][\.\s]', line):
            break
        if line and not line.startswith('<') and not line.startswith('---'):
            # Clean HTML tags like <br/>
            clean_line = re.sub(r'<[^>]+>', ' ', line).strip()
            if clean_line:
                question_lines.append(clean_line)
        i += 1
    
    question_text = ' '.join(question_lines).strip()
    
    # Get options
    while i < len(lines):
        line = lines[i].strip()
        
        # Match option pattern: "- A. Option text" or "- A Option text"
        option_match = re.match(r'^-\s+([A-F])[\.\s]\s*(.+)$', line)
        if option_match:
            letter = option_match.group(1)
            text = option_match.group(2)
            options[letter] = text
        
        # Match answer in details block (case insensitive)
        answer_match = re.search(r'[Cc]orrect [Aa]nswer:\s*([A-F](?:[,\s]*[A-F])*)', line)
        if answer_match:
            # Parse answer - could be "D" or "B, E" or "AB" or "A, B"
            answer_text = answer_match.group(1)
            # Remove spaces and commas to get just letters
            answer = answer_text.replace(',', '').replace(' ', '')
        
        i += 1
    
    if question_text and options and answer:
        return {
            'question': question_text,
            'options': options,
            'answer_official': answer,
            'answer_community': answer
        }
    
    return None

def main():
    exam_dir = Path('/Users/jmarin/Code/AWS-Certified-Cloud-Practitioner-Notes/practice-exam')
    output_dir = Path('/Users/jmarin/Code/studyFlashcards/public')
    
    all_questions = {}
    question_id = 1
    
    # Get all practice exam files
    exam_files = sorted(exam_dir.glob('practice-exam-*.md'))
    
    print(f"Found {len(exam_files)} exam files")
    
    for exam_file in exam_files:
        print(f"Processing {exam_file.name}...")
        questions = parse_exam_file(exam_file)
        print(f"  Found {len(questions)} questions")
        
        for q in questions:
            all_questions[str(question_id)] = q
            question_id += 1
    
    # Save consolidated JSON
    output_file = output_dir / 'aws-clf-c02-practice.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)
    
    print(f"\nTotal questions: {len(all_questions)}")
    print(f"Saved to: {output_file}")

if __name__ == '__main__':
    main()
