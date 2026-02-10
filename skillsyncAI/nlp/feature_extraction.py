
import re

# A small sample list of common tech skills for extraction
# In a real app, this would be a much larger database or loaded from a file
COMMON_SKILLS = {
    "python", "java", "c++", "c#", "javascript", "typescript", "react", "angular", "vue",
    "node.js", "django", "flask", "spring", "sql", "mysql", "postgresql", "mongodb",
    "aws", "azure", "gcp", "docker", "kubernetes", "git", "linux", "html", "css",
    "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "pandas", "numpy",
    "scikit-learn", "data analysis", "project management", "agile", "scrum", "leadership",
    "communication", "problem solving"
}

def extract_skills(text: str) -> set[str]:
    """
    Extract skills from text based on a predefined list.
    Returns a set of lowercase skill strings.
    """
    if not text:
        return set()
    
    text_lower = text.lower()
    found_skills = set()
    
    # Simple keyword matching
    for skill in COMMON_SKILLS:
        # Use regex boundary to avoid partial matches (e.g. "java" in "javascript")
        # Escape skill special chars like C++
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.add(skill)
            
    return found_skills

def calculate_skill_overlap(text1: str, text2: str) -> float:
    """
    Calculate Jaccard similarity of skills found in two texts.
    Returns a float between 0.0 and 1.0.
    """
    skills1 = extract_skills(text1)
    skills2 = extract_skills(text2)
    
    if not skills1 and not skills2:
        return 0.0
    
    intersection = skills1.intersection(skills2)
    union = skills1.union(skills2)
    
    return len(intersection) / len(union) if union else 0.0

def extract_experience_years(text: str) -> float:
    """
    Attempt to extract years of experience using regex.
    Returns the maximum number of years found, or 0.0 if none.
    """
    if not text:
        return 0.0
        
    # Patterns like "5 years", "5+ years", "5-7 years"
    # We look for digits followed by "year"
    pattern = r"(\d+)(?:\+)?\s*-?\s*(?:\d+)?\s*years?"
    
    matches = re.findall(pattern, text.lower())
    if not matches:
        return 0.0
    
    # Convert matches to integers and find the max
    # (Assuming the max mentioned is likely the total experience)
    years = [int(m) for m in matches]
    return float(max(years))

def calculate_experience_gap(cv_text: str, job_text: str) -> float:
    """
    Calculate (CV Experience - Job Experience).
    Positive means CV has more experience (good), negative means less (bad).
    """
    cv_exp = extract_experience_years(cv_text)
    job_exp = extract_experience_years(job_text)
    
    return cv_exp - job_exp
