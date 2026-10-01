import json
from models.db import db
from models.models import Career, Resource

CAREERS = [
    {
        "career_name": "Web Developer",
        "description": "Build and maintain websites and web applications.",
        "required_skills": "HTML, CSS, JavaScript, React, Node.js, REST API, Git",
        "roadmap": json.dumps([
            "Learn HTML & CSS basics",
            "Learn JavaScript (ES6+)",
            "Learn React.js framework",
            "Learn Node.js & Express",
            "Learn databases (MySQL / MongoDB)",
            "Build 3 full-stack projects",
            "Deploy on Vercel / Netlify",
            "Prepare for interviews"
        ]),
        "salary_range": "4-18 LPA",
        "demand": "High",
        "resources": [
            {"skill_name": "HTML",       "title": "HTML Tutorial",        "platform": "W3Schools", "url": "https://www.w3schools.com/html/",       "is_free": True},
            {"skill_name": "CSS",        "title": "CSS Tutorial",         "platform": "W3Schools", "url": "https://www.w3schools.com/css/",        "is_free": True},
            {"skill_name": "JavaScript", "title": "JavaScript Tutorial",  "platform": "W3Schools", "url": "https://www.w3schools.com/js/",         "is_free": True},
            {"skill_name": "React",      "title": "React JS Full Course", "platform": "YouTube",   "url": "https://www.youtube.com/watch?v=bMknfKXIFA8", "is_free": True},
            {"skill_name": "Node.js",    "title": "Node.js Tutorial",     "platform": "GFG",       "url": "https://www.geeksforgeeks.org/nodejs/", "is_free": True},
        ]
    },
    {
        "career_name": "Python Developer",
        "description": "Develop backend applications and APIs using Python.",
        "required_skills": "Python, OOP, Flask, Django, REST API, SQL, Git, Testing",
        "roadmap": json.dumps([
            "Learn Python fundamentals",
            "Learn OOP in Python",
            "Learn Flask or Django",
            "Learn SQL and databases",
            "Build REST APIs",
            "Write unit tests (pytest)",
            "Build 2-3 backend projects",
            "Prepare for interviews"
        ]),
        "salary_range": "5-20 LPA",
        "demand": "High",
        "resources": [
            {"skill_name": "Python", "title": "Python Tutorial",      "platform": "W3Schools", "url": "https://www.w3schools.com/python/",                      "is_free": True},
            {"skill_name": "Python", "title": "Python Programming",   "platform": "GFG",       "url": "https://www.geeksforgeeks.org/python-programming-language/", "is_free": True},
            {"skill_name": "Flask",  "title": "Flask Tutorial",       "platform": "GFG",       "url": "https://www.geeksforgeeks.org/flask-tutorial/",            "is_free": True},
            {"skill_name": "SQL",    "title": "SQL Tutorial",         "platform": "W3Schools", "url": "https://www.w3schools.com/sql/",                          "is_free": True},
        ]
    },
    {
        "career_name": "AI/ML Engineer",
        "description": "Design and deploy machine learning models and AI solutions.",
        "required_skills": "Python, Machine Learning, Deep Learning, Pandas, NumPy, Statistics, TensorFlow, Scikit-learn",
        "roadmap": json.dumps([
            "Learn Python fundamentals",
            "Learn Mathematics & Statistics",
            "Learn NumPy and Pandas",
            "Learn Machine Learning (scikit-learn)",
            "Learn Deep Learning (TensorFlow/PyTorch)",
            "Work on Kaggle competitions",
            "Build 3 end-to-end ML projects",
            "Learn MLOps basics",
            "Prepare for interviews"
        ]),
        "salary_range": "8-25 LPA",
        "demand": "Very High",
        "resources": [
            {"skill_name": "Machine Learning", "title": "ML Specialization - Andrew Ng", "platform": "Coursera", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "is_free": False},
            {"skill_name": "Pandas",           "title": "Pandas Tutorial",               "platform": "GFG",      "url": "https://www.geeksforgeeks.org/pandas-tutorial/",                        "is_free": True},
            {"skill_name": "NumPy",            "title": "NumPy Tutorial",                "platform": "W3Schools","url": "https://www.w3schools.com/python/numpy/",                               "is_free": True},
            {"skill_name": "Deep Learning",    "title": "Deep Learning Specialization",  "platform": "Coursera", "url": "https://www.coursera.org/specializations/deep-learning",                "is_free": False},
            {"skill_name": "Statistics",       "title": "Statistics for Data Science",   "platform": "YouTube",  "url": "https://www.youtube.com/watch?v=xxpc-HPKN28",                           "is_free": True},
        ]
    },
    {
        "career_name": "Data Analyst",
        "description": "Analyze data to extract insights and support business decisions.",
        "required_skills": "Python, SQL, Excel, Tableau, Power BI, Statistics, Pandas, Data Visualization",
        "roadmap": json.dumps([
            "Learn Python basics",
            "Learn SQL deeply",
            "Learn Excel for data analysis",
            "Learn Pandas and NumPy",
            "Learn Matplotlib and Seaborn",
            "Learn Tableau or Power BI",
            "Work on real datasets (Kaggle)",
            "Build portfolio with 3 projects",
            "Prepare for interviews"
        ]),
        "salary_range": "4-15 LPA",
        "demand": "High",
        "resources": [
            {"skill_name": "SQL",     "title": "SQL for Data Analysis",  "platform": "GFG",      "url": "https://www.geeksforgeeks.org/sql-tutorial/",                      "is_free": True},
            {"skill_name": "Excel",   "title": "Excel Tutorial",         "platform": "W3Schools", "url": "https://www.w3schools.com/excel/",                                "is_free": True},
            {"skill_name": "Tableau", "title": "Tableau for Beginners",  "platform": "YouTube",   "url": "https://www.youtube.com/watch?v=TPMlZxRRaBQ",                     "is_free": True},
            {"skill_name": "Python",  "title": "Data Analysis - Python", "platform": "Coursera",  "url": "https://www.coursera.org/learn/data-analysis-with-python",        "is_free": False},
        ]
    },
    {
        "career_name": "Cybersecurity Analyst",
        "description": "Protect systems and networks from cyber threats.",
        "required_skills": "Networking, Linux, Python, Security, Ethical Hacking, Cryptography, SIEM",
        "roadmap": json.dumps([
            "Learn Networking fundamentals (TCP/IP, DNS)",
            "Learn Linux command line",
            "Learn Python scripting",
            "Learn cybersecurity basics",
            "Learn ethical hacking fundamentals",
            "Get CompTIA Security+ or CEH certified",
            "Practice on TryHackMe / HackTheBox",
            "Build security projects",
            "Prepare for interviews"
        ]),
        "salary_range": "6-22 LPA",
        "demand": "Very High",
        "resources": [
            {"skill_name": "Networking",      "title": "Computer Networks",          "platform": "GFG",      "url": "https://www.geeksforgeeks.org/computer-network-tutorials/",                    "is_free": True},
            {"skill_name": "Linux",           "title": "Linux Tutorial",             "platform": "GFG",      "url": "https://www.geeksforgeeks.org/linux-tutorial/",                               "is_free": True},
            {"skill_name": "Ethical Hacking", "title": "Ethical Hacking Course",     "platform": "YouTube",  "url": "https://www.youtube.com/watch?v=3Kq1MIfTWCE",                                "is_free": True},
            {"skill_name": "Security",        "title": "Google Cybersecurity Cert.", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/google-cybersecurity",     "is_free": False},
        ]
    },
    {
        "career_name": "Cloud Engineer",
        "description": "Design and manage cloud infrastructure and services.",
        "required_skills": "AWS, Python, Linux, Docker, Kubernetes, Terraform, Networking, CI/CD",
        "roadmap": json.dumps([
            "Learn Linux basics",
            "Learn Networking fundamentals",
            "Learn Python scripting",
            "Learn AWS core services (EC2, S3, RDS, Lambda)",
            "Learn Docker and containers",
            "Learn Kubernetes",
            "Learn Terraform (IaC)",
            "Get AWS Solutions Architect certification",
            "Build cloud deployment projects"
        ]),
        "salary_range": "8-30 LPA",
        "demand": "Very High",
        "resources": [
            {"skill_name": "AWS",        "title": "AWS Cloud Practitioner", "platform": "Coursera", "url": "https://www.coursera.org/learn/aws-cloud-practitioner-essentials", "is_free": False},
            {"skill_name": "Docker",     "title": "Docker Tutorial",        "platform": "GFG",      "url": "https://www.geeksforgeeks.org/docker-tutorial/",                   "is_free": True},
            {"skill_name": "Linux",      "title": "Linux Command Line",     "platform": "YouTube",  "url": "https://www.youtube.com/watch?v=ZtqBQ68cfJc",                     "is_free": True},
            {"skill_name": "Kubernetes", "title": "Kubernetes Tutorial",    "platform": "GFG",      "url": "https://www.geeksforgeeks.org/kubernetes-tutorial/",               "is_free": True},
        ]
    },
    {
        "career_name": "DevOps Engineer",
        "description": "Automate software delivery pipelines and manage infrastructure.",
        "required_skills": "Linux, Git, Docker, Kubernetes, Jenkins, CI/CD, Python, AWS, Monitoring",
        "roadmap": json.dumps([
            "Learn Linux and shell scripting",
            "Learn Git and version control",
            "Learn Docker and containerization",
            "Learn CI/CD (Jenkins / GitHub Actions)",
            "Learn Kubernetes",
            "Learn Terraform or Ansible",
            "Learn cloud platforms (AWS / Azure)",
            "Learn monitoring (Prometheus, Grafana)",
            "Build DevOps pipeline projects"
        ]),
        "salary_range": "7-28 LPA",
        "demand": "Very High",
        "resources": [
            {"skill_name": "Git",     "title": "Git Tutorial",       "platform": "W3Schools", "url": "https://www.w3schools.com/git/",                                                       "is_free": True},
            {"skill_name": "Docker",  "title": "Docker Full Course",  "platform": "YouTube",   "url": "https://www.youtube.com/watch?v=fqMOX6JJhGo",                                        "is_free": True},
            {"skill_name": "Jenkins", "title": "Jenkins Tutorial",    "platform": "GFG",       "url": "https://www.geeksforgeeks.org/jenkins-tutorial/",                                     "is_free": True},
            {"skill_name": "CI/CD",   "title": "DevOps Specialization","platform": "Coursera",  "url": "https://www.coursera.org/specializations/devops-cloud-and-agile-foundations",        "is_free": False},
        ]
    },
]


def seed_careers():
    if Career.query.count() > 0:
        return
    for c in CAREERS:
        resources_data = c.pop('resources', [])
        career = Career(**c)
        db.session.add(career)
        db.session.flush()
        for r in resources_data:
            db.session.add(Resource(career_id=career.id, **r))
    db.session.commit()
    print("Career database seeded successfully.")