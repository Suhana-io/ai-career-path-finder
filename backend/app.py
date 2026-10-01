import os
from flask import Flask, request, jsonify
from datetime import timedelta
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)

# ── Config ────────────────────────────────────────────────
app.config['SECRET_KEY']                     = 'aicareerfinder_secret_2025'
app.config['JWT_SECRET_KEY'] = os.environ.get(
    'JWT_SECRET_KEY',
    'jwt_aicareerfinder_2025_super_secret_key_32bytes'
)
app.config['JWT_ACCESS_TOKEN_EXPIRES']       = False  
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    'mysql+pymysql://root:Suhana.sql30@localhost/ai_career_pathfinder'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, origins=['*'])
JWTManager(app)
db = SQLAlchemy(app)

# ══════════════════════════════════════════════
# DATABASE MODELS
# ══════════════════════════════════════════════

class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(120), nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    skills   = db.relationship('UserSkill', backref='user', cascade='all,delete')
    profile  = db.relationship('Profile',   backref='user', uselist=False, cascade='all,delete')
    progress = db.relationship('Progress',  backref='user', cascade='all,delete')
    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'email': self.email}

class Profile(db.Model):
    __tablename__ = 'profiles'
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    branch      = db.Column(db.String(100))
    year        = db.Column(db.Integer)
    cgpa        = db.Column(db.Float)
    interests   = db.Column(db.Text)
    career_goal = db.Column(db.Text)
    def to_dict(self):
        return {
            'branch':      self.branch,
            'year':        self.year,
            'cgpa':        self.cgpa,
            'interests':   self.interests.split(',') if self.interests else [],
            'career_goal': self.career_goal
        }

class UserSkill(db.Model):
    __tablename__ = 'user_skills'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_name = db.Column(db.String(100), nullable=False)
    level      = db.Column(db.String(20), default='beginner')

class Career(db.Model):
    __tablename__ = 'careers'
    id              = db.Column(db.Integer, primary_key=True)
    career_name     = db.Column(db.String(100), unique=True, nullable=False)
    description     = db.Column(db.Text)
    required_skills = db.Column(db.Text)
    roadmap         = db.Column(db.Text)
    salary_range    = db.Column(db.String(50))
    demand          = db.Column(db.String(20))
    resources       = db.relationship('Resource', backref='career', cascade='all,delete')
    def skills_list(self):
        return [s.strip().lower() for s in self.required_skills.split(',')]
    def roadmap_list(self):
        try:    return json.loads(self.roadmap)
        except: return []
    def to_dict(self):
        return {
            'id': self.id, 'career_name': self.career_name,
            'description': self.description,
            'required_skills': self.skills_list(),
            'roadmap': self.roadmap_list(),
            'salary_range': self.salary_range,
            'demand': self.demand
        }

class Resource(db.Model):
    __tablename__ = 'resources'
    id         = db.Column(db.Integer, primary_key=True)
    career_id  = db.Column(db.Integer, db.ForeignKey('careers.id'), nullable=False)
    skill_name = db.Column(db.String(100))
    title      = db.Column(db.String(200), nullable=False)
    platform   = db.Column(db.String(50))
    url        = db.Column(db.Text, nullable=False)
    is_free    = db.Column(db.Boolean, default=True)
    def to_dict(self):
        return {
            'id': self.id, 'skill_name': self.skill_name,
            'title': self.title, 'platform': self.platform,
            'url': self.url, 'is_free': self.is_free
        }

class Progress(db.Model):
    __tablename__ = 'progress'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    career_id  = db.Column(db.Integer, db.ForeignKey('careers.id'), nullable=False)
    step_index = db.Column(db.Integer, nullable=False)
    completed  = db.Column(db.Boolean, default=False)

# ══════════════════════════════════════════════
# SEED DATA
# ══════════════════════════════════════════════



CAREERS_DATA = [
    {
        'career_name': 'Web Developer',
        'description': 'Build websites and web applications.',
        'required_skills': 'HTML, CSS, JavaScript, React, Node.js, Git, REST API',
        'roadmap': json.dumps([
            'Learn HTML basics — structure, tags, forms, tables',
            'Learn CSS — styling, flexbox, grid, animations',
            'Learn JavaScript fundamentals — variables, loops, functions',
            'Learn JavaScript advanced — DOM, events, ES6+, promises',
            'Learn React.js — components, hooks, state, props',
            'Learn Node.js and Express — backend APIs',
            'Learn MySQL or MongoDB — database basics',
            'Build project 1 — Personal portfolio website',
            'Build project 2 — Todo app with React and Node.js',
            'Build project 3 — Full stack e-commerce site',
            'Learn Git and GitHub — version control',
            'Deploy on Vercel or Netlify',
            'Practice coding problems on HackerRank',
            'Prepare for interviews — DSA + web questions',
        ]),
        'salary_range': '4-18 LPA',
        'demand': 'High',
        'resources': [
            {'skill_name': 'HTML',       'title': 'HTML Full Tutorial',           'platform': 'W3Schools',    'url': 'https://www.w3schools.com/html/',                                      'is_free': True},
            {'skill_name': 'HTML',       'title': 'HTML Tutorial for Beginners',  'platform': 'GFG',          'url': 'https://www.geeksforgeeks.org/html-tutorial/',                         'is_free': True},
            {'skill_name': 'HTML',       'title': 'HTML Crash Course',            'platform': 'YouTube',      'url': 'https://www.youtube.com/watch?v=UB1O30fR-EE',                         'is_free': True},
            {'skill_name': 'CSS',        'title': 'CSS Full Tutorial',            'platform': 'W3Schools',    'url': 'https://www.w3schools.com/css/',                                       'is_free': True},
            {'skill_name': 'CSS',        'title': 'CSS Tutorial',                 'platform': 'GFG',          'url': 'https://www.geeksforgeeks.org/css-tutorial/',                          'is_free': True},
            {'skill_name': 'CSS',        'title': 'CSS Crash Course',             'platform': 'YouTube',      'url': 'https://www.youtube.com/watch?v=yfoY53QXEnI',                         'is_free': True},
            {'skill_name': 'JavaScript', 'title': 'JavaScript Full Tutorial',     'platform': 'W3Schools',    'url': 'https://www.w3schools.com/js/',                                        'is_free': True},
            {'skill_name': 'JavaScript', 'title': 'JavaScript Tutorial',          'platform': 'GFG',          'url': 'https://www.geeksforgeeks.org/javascript/',                           'is_free': True},
            {'skill_name': 'JavaScript', 'title': 'JavaScript Full Course',       'platform': 'YouTube',      'url': 'https://www.youtube.com/watch?v=PkZNo7MFNFg',                         'is_free': True},
            {'skill_name': 'React',      'title': 'React JS Full Course',         'platform': 'YouTube',      'url': 'https://www.youtube.com/watch?v=bMknfKXIFA8',                         'is_free': True},
            {'skill_name': 'React',      'title': 'React Tutorial',               'platform': 'W3Schools',    'url': 'https://www.w3schools.com/react/',                                     'is_free': True},
            {'skill_name': 'React',      'title': 'React JS Tutorial',            'platform': 'GFG',          'url': 'https://www.geeksforgeeks.org/react/',                                'is_free': True},
            {'skill_name': 'Node.js',    'title': 'Node.js Tutorial',             'platform': 'W3Schools',    'url': 'https://www.w3schools.com/nodejs/',                                    'is_free': True},
            {'skill_name': 'Node.js',    'title': 'Node.js Full Course',          'platform': 'YouTube',      'url': 'https://www.youtube.com/watch?v=Oe421EPjeBE',                         'is_free': True},
            {'skill_name': 'Practice',   'title': 'Web Dev Practice Problems',    'platform': 'HackerRank',   'url': 'https://www.hackerrank.com/domains/tutorials/10-days-of-javascript',  'is_free': True},
            {'skill_name': 'Practice',   'title': 'Frontend Practice Problems',   'platform': 'LeetCode',     'url': 'https://leetcode.com/problemset/',                                     'is_free': True},
            {'skill_name': 'Git',        'title': 'Git Tutorial',                 'platform': 'W3Schools',    'url': 'https://www.w3schools.com/git/',                                       'is_free': True},
            {'skill_name': 'Git',        'title': 'Git and GitHub Full Course',   'platform': 'YouTube',      'url': 'https://www.youtube.com/watch?v=apGV9Kg7ics',                         'is_free': True},
        ]
    },
    {
        'career_name': 'Python Developer',
        'description': 'Build backend applications and APIs using Python.',
        'required_skills': 'Python, OOP, Flask, Django, SQL, Git, Testing, REST API',
        'roadmap': json.dumps([
            'Learn Python basics — variables, data types, loops, functions',
            'Learn Python advanced — OOP, file handling, exceptions',
            'Learn Data Structures in Python — lists, dicts, sets, tuples',
            'Practice Python problems on HackerRank',
            'Practice Python problems on LeetCode',
            'Learn SQL — queries, joins, aggregations',
            'Learn Flask — routes, templates, REST APIs',
            'Learn Django — models, views, templates, admin',
            'Learn Git and GitHub',
            'Build project 1 — REST API with Flask',
            'Build project 2 — Blog app with Django',
            'Build project 3 — Task manager with authentication',
            'Write unit tests with pytest',
            'Prepare for interviews — Python + DSA questions',
        ]),
        'salary_range': '5-20 LPA',
        'demand': 'High',
        'resources': [
            {'skill_name': 'Python',   'title': 'Python Full Tutorial',          'platform': 'W3Schools',  'url': 'https://www.w3schools.com/python/',                                          'is_free': True},
            {'skill_name': 'Python',   'title': 'Python Programming',            'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/python-programming-language/',                 'is_free': True},
            {'skill_name': 'Python',   'title': 'Python Full Course for Beginners','platform': 'YouTube',  'url': 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',                               'is_free': True},
            {'skill_name': 'Python',   'title': 'Python Practice Problems',      'platform': 'HackerRank', 'url': 'https://www.hackerrank.com/domains/python',                                  'is_free': True},
            {'skill_name': 'Python',   'title': 'Python Coding Problems',        'platform': 'LeetCode',   'url': 'https://leetcode.com/problemset/?topicSlugs=array',                         'is_free': True},
            {'skill_name': 'Python',   'title': 'Python Competitive Programming','platform': 'CodeChef',   'url': 'https://www.codechef.com/learn/course/python',                              'is_free': True},
            {'skill_name': 'SQL',      'title': 'SQL Full Tutorial',             'platform': 'W3Schools',  'url': 'https://www.w3schools.com/sql/',                                             'is_free': True},
            {'skill_name': 'SQL',      'title': 'SQL Tutorial',                  'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/sql-tutorial/',                               'is_free': True},
            {'skill_name': 'SQL',      'title': 'SQL Full Course',               'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',                               'is_free': True},
            {'skill_name': 'SQL',      'title': 'SQL Practice',                  'platform': 'HackerRank', 'url': 'https://www.hackerrank.com/domains/sql',                                    'is_free': True},
            {'skill_name': 'Flask',    'title': 'Flask Tutorial',                'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/flask-tutorial/',                             'is_free': True},
            {'skill_name': 'Flask',    'title': 'Flask Full Course',             'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=Qr4QMBUPxWo',                               'is_free': True},
            {'skill_name': 'Django',   'title': 'Django Tutorial',               'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/django-tutorial/',                            'is_free': True},
            {'skill_name': 'Django',   'title': 'Django Full Course',            'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=rHux0gMZ3Eg',                               'is_free': True},
            {'skill_name': 'DSA',      'title': 'DSA Problems — Python',         'platform': 'LeetCode',   'url': 'https://leetcode.com/problemset/',                                          'is_free': True},
        ]
    },
    {
        'career_name': 'AI/ML Engineer',
        'description': 'Design and deploy machine learning models and AI solutions.',
        'required_skills': 'Python, Machine Learning, Deep Learning, Pandas, NumPy, Statistics, TensorFlow, Scikit-learn',
        'roadmap': json.dumps([
            'Learn Python fundamentals',
            'Learn Mathematics — Linear Algebra, Calculus basics',
            'Learn Statistics and Probability',
            'Learn NumPy — arrays, matrix operations',
            'Learn Pandas — data manipulation, cleaning',
            'Learn Matplotlib and Seaborn — data visualization',
            'Learn Machine Learning with scikit-learn',
            'Learn Deep Learning with TensorFlow and Keras',
            'Learn Natural Language Processing basics',
            'Practice on Kaggle datasets and competitions',
            'Build project 1 — House price prediction',
            'Build project 2 — Image classification model',
            'Build project 3 — Sentiment analysis NLP project',
            'Learn MLOps — model deployment with Flask',
            'Practice ML problems on HackerRank',
            'Prepare for interviews — ML theory + coding',
        ]),
        'salary_range': '8-25 LPA',
        'demand': 'Very High',
        'resources': [
            {'skill_name': 'Python',           'title': 'Python for Data Science',           'platform': 'Coursera',   'url': 'https://www.coursera.org/learn/python-for-applied-data-science-ai',               'is_free': False},
            {'skill_name': 'Python',           'title': 'Python Full Course',                'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',                                     'is_free': True},
            {'skill_name': 'Machine Learning', 'title': 'ML Specialization — Andrew Ng',    'platform': 'Coursera',   'url': 'https://www.coursera.org/specializations/machine-learning-introduction',           'is_free': False},
            {'skill_name': 'Machine Learning', 'title': 'Machine Learning Tutorial',         'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/machine-learning/',                                  'is_free': True},
            {'skill_name': 'Machine Learning', 'title': 'ML Full Course',                   'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=GwIo3gDZCVQ',                                     'is_free': True},
            {'skill_name': 'Pandas',           'title': 'Pandas Tutorial',                  'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/pandas-tutorial/',                                   'is_free': True},
            {'skill_name': 'Pandas',           'title': 'Pandas Full Course',               'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=vmEHCJofslg',                                     'is_free': True},
            {'skill_name': 'NumPy',            'title': 'NumPy Tutorial',                   'platform': 'W3Schools',  'url': 'https://www.w3schools.com/python/numpy/',                                          'is_free': True},
            {'skill_name': 'NumPy',            'title': 'NumPy Full Course',                'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=QUT1VHiLmmI',                                     'is_free': True},
            {'skill_name': 'Statistics',       'title': 'Statistics for Data Science',      'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=xxpc-HPKN28',                                     'is_free': True},
            {'skill_name': 'Statistics',       'title': 'Statistics Tutorial',              'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/statistics-for-machine-learning/',                   'is_free': True},
            {'skill_name': 'Deep Learning',    'title': 'Deep Learning Specialization',     'platform': 'Coursera',   'url': 'https://www.coursera.org/specializations/deep-learning',                          'is_free': False},
            {'skill_name': 'Deep Learning',    'title': 'Deep Learning Full Course',        'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=aircAruvnKk',                                     'is_free': True},
            {'skill_name': 'Practice',         'title': 'ML Practice Problems',             'platform': 'Kaggle',     'url': 'https://www.kaggle.com/competitions',                                              'is_free': True},
            {'skill_name': 'Practice',         'title': 'AI/ML Problems',                   'platform': 'HackerRank', 'url': 'https://www.hackerrank.com/domains/ai',                                            'is_free': True},
            {'skill_name': 'Practice',         'title': 'Python DSA for ML',                'platform': 'LeetCode',   'url': 'https://leetcode.com/problemset/',                                                 'is_free': True},
            {'skill_name': 'TensorFlow',       'title': 'TensorFlow Tutorial',              'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/introduction-to-tensorflow/',                       'is_free': True},
            {'skill_name': 'TensorFlow',       'title': 'TensorFlow Full Course',           'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=tPYj3fFJGjk',                                     'is_free': True},
        ]
    },
    {
        'career_name': 'Data Analyst',
        'description': 'Analyze data to extract insights and support decisions.',
        'required_skills': 'Python, SQL, Excel, Tableau, Power BI, Statistics, Pandas, Data Visualization',
        'roadmap': json.dumps([
            'Learn Excel — formulas, pivot tables, charts',
            'Learn SQL basics — SELECT, WHERE, JOIN, GROUP BY',
            'Learn SQL advanced — subqueries, window functions',
            'Practice SQL on HackerRank',
            'Practice SQL on LeetCode',
            'Learn Python basics',
            'Learn Pandas — data cleaning and manipulation',
            'Learn NumPy — numerical computing',
            'Learn Matplotlib and Seaborn — visualization',
            'Learn Statistics — mean, median, distributions',
            'Learn Tableau or Power BI — dashboards',
            'Work on real datasets on Kaggle',
            'Build project 1 — Sales analysis dashboard',
            'Build project 2 — COVID-19 data analysis',
            'Build project 3 — Customer churn analysis',
            'Prepare for interviews — SQL + Python + statistics',
        ]),
        'salary_range': '4-15 LPA',
        'demand': 'High',
        'resources': [
            {'skill_name': 'SQL',                'title': 'SQL Full Tutorial',              'platform': 'W3Schools',  'url': 'https://www.w3schools.com/sql/',                                              'is_free': True},
            {'skill_name': 'SQL',                'title': 'SQL Tutorial',                   'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/sql-tutorial/',                                 'is_free': True},
            {'skill_name': 'SQL',                'title': 'SQL Full Course',                'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',                                'is_free': True},
            {'skill_name': 'SQL',                'title': 'SQL Practice Problems',          'platform': 'HackerRank', 'url': 'https://www.hackerrank.com/domains/sql',                                     'is_free': True},
            {'skill_name': 'SQL',                'title': 'SQL Interview Problems',         'platform': 'LeetCode',   'url': 'https://leetcode.com/problemset/?topicSlugs=database',                      'is_free': True},
            {'skill_name': 'Excel',              'title': 'Excel Tutorial',                 'platform': 'W3Schools',  'url': 'https://www.w3schools.com/excel/',                                            'is_free': True},
            {'skill_name': 'Excel',              'title': 'Excel Full Course',              'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=Vl0H-qTclOg',                                'is_free': True},
            {'skill_name': 'Python',             'title': 'Python for Data Analysis',      'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/data-analysis-with-python/',                   'is_free': True},
            {'skill_name': 'Pandas',             'title': 'Pandas Tutorial',               'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/pandas-tutorial/',                             'is_free': True},
            {'skill_name': 'Pandas',             'title': 'Pandas Full Course',            'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=vmEHCJofslg',                                'is_free': True},
            {'skill_name': 'Data Visualization', 'title': 'Data Analysis with Python',     'platform': 'Coursera',   'url': 'https://www.coursera.org/learn/data-analysis-with-python',                  'is_free': False},
            {'skill_name': 'Tableau',            'title': 'Tableau for Beginners',         'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=TPMlZxRRaBQ',                                'is_free': True},
            {'skill_name': 'Power BI',           'title': 'Power BI Full Course',          'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=fnA-_iDV_LY',                                'is_free': True},
            {'skill_name': 'Practice',           'title': 'Data Analysis Datasets',        'platform': 'Kaggle',     'url': 'https://www.kaggle.com/datasets',                                            'is_free': True},
            {'skill_name': 'Statistics',         'title': 'Statistics Tutorial',           'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/statistics-for-machine-learning/',             'is_free': True},
        ]
    },
    {
        'career_name': 'Cybersecurity Analyst',
        'description': 'Protect systems and networks from cyber threats.',
        'required_skills': 'Networking, Linux, Python, Security, Ethical Hacking, Cryptography, SIEM',
        'roadmap': json.dumps([
            'Learn Networking — TCP/IP, DNS, HTTP, OSI model',
            'Learn Linux command line — basic to advanced',
            'Learn Python scripting for security',
            'Learn cybersecurity basics — CIA triad, threats, attacks',
            'Learn ethical hacking fundamentals',
            'Practice on TryHackMe — beginner rooms',
            'Practice on HackTheBox — intermediate challenges',
            'Learn cryptography basics — encryption, hashing',
            'Learn OWASP Top 10 — web vulnerabilities',
            'Get certified — CompTIA Security+ or CEH',
            'Learn SIEM tools — Splunk basics',
            'Build project 1 — Network scanner with Python',
            'Build project 2 — Password strength checker',
            'Build project 3 — Simple port scanner',
            'Practice CTF challenges on CTFtime',
            'Prepare for interviews — security concepts',
        ]),
        'salary_range': '6-22 LPA',
        'demand': 'Very High',
        'resources': [
            {'skill_name': 'Networking',      'title': 'Computer Networks Tutorial',      'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/computer-network-tutorials/',                   'is_free': True},
            {'skill_name': 'Networking',      'title': 'Computer Networks Full Course',   'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=IPvYjXCsTg8',                                 'is_free': True},
            {'skill_name': 'Linux',           'title': 'Linux Tutorial',                  'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/linux-tutorial/',                               'is_free': True},
            {'skill_name': 'Linux',           'title': 'Linux Command Line Full Course',  'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=ZtqBQ68cfJc',                                 'is_free': True},
            {'skill_name': 'Python',          'title': 'Python for Hackers',              'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=1F_y9GoBKfg',                                 'is_free': True},
            {'skill_name': 'Ethical Hacking', 'title': 'Ethical Hacking Full Course',    'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=3Kq1MIfTWCE',                                 'is_free': True},
            {'skill_name': 'Ethical Hacking', 'title': 'Ethical Hacking Tutorial',       'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/ethical-hacking-introduction/',                 'is_free': True},
            {'skill_name': 'Practice',        'title': 'TryHackMe — Beginner Rooms',     'platform': 'TryHackMe',  'url': 'https://tryhackme.com/paths',                                                  'is_free': True},
            {'skill_name': 'Practice',        'title': 'HackTheBox Challenges',          'platform': 'HackTheBox', 'url': 'https://www.hackthebox.com/',                                                  'is_free': True},
            {'skill_name': 'Practice',        'title': 'CTF Challenges',                 'platform': 'CTFtime',    'url': 'https://ctftime.org/',                                                         'is_free': True},
            {'skill_name': 'Security',        'title': 'Google Cybersecurity Certificate','platform': 'Coursera',  'url': 'https://www.coursera.org/professional-certificates/google-cybersecurity',     'is_free': False},
            {'skill_name': 'Cryptography',    'title': 'Cryptography Tutorial',          'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/cryptography-introduction/',                    'is_free': True},
            {'skill_name': 'Cryptography',    'title': 'Cryptography Full Course',       'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=AQDCe585Lnc',                                 'is_free': True},
        ]
    },
    {
        'career_name': 'Cloud Engineer',
        'description': 'Design and manage cloud infrastructure and services.',
        'required_skills': 'AWS, Python, Linux, Docker, Kubernetes, Terraform, Networking, CI/CD',
        'roadmap': json.dumps([
            'Learn Linux command line basics',
            'Learn Networking — TCP/IP, DNS, firewalls',
            'Learn Python scripting',
            'Learn AWS core services — EC2, S3, RDS, Lambda, VPC',
            'Learn Docker — containers, images, Dockerfile',
            'Learn Kubernetes — pods, deployments, services',
            'Learn Terraform — infrastructure as code',
            'Learn CI/CD — GitHub Actions or Jenkins',
            'Get AWS Cloud Practitioner certification',
            'Get AWS Solutions Architect certification',
            'Build project 1 — Deploy app on AWS EC2',
            'Build project 2 — Dockerize a Flask app',
            'Build project 3 — Kubernetes deployment',
            'Practice on AWS Free Tier',
            'Practice Linux on HackerRank',
            'Prepare for interviews — cloud + DevOps concepts',
        ]),
        'salary_range': '8-30 LPA',
        'demand': 'Very High',
        'resources': [
            {'skill_name': 'AWS',        'title': 'AWS Cloud Practitioner',        'platform': 'Coursera',   'url': 'https://www.coursera.org/learn/aws-cloud-practitioner-essentials',         'is_free': False},
            {'skill_name': 'AWS',        'title': 'AWS Tutorial',                  'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/aws-tutorial/',                               'is_free': True},
            {'skill_name': 'AWS',        'title': 'AWS Full Course',               'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=k1RI5locZE4',                               'is_free': True},
            {'skill_name': 'Docker',     'title': 'Docker Tutorial',               'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/docker-tutorial/',                           'is_free': True},
            {'skill_name': 'Docker',     'title': 'Docker Full Course',            'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=fqMOX6JJhGo',                              'is_free': True},
            {'skill_name': 'Kubernetes', 'title': 'Kubernetes Tutorial',           'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/kubernetes-tutorial/',                       'is_free': True},
            {'skill_name': 'Kubernetes', 'title': 'Kubernetes Full Course',        'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=X48VuDVv0do',                              'is_free': True},
            {'skill_name': 'Linux',      'title': 'Linux Command Line',            'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=ZtqBQ68cfJc',                              'is_free': True},
            {'skill_name': 'Linux',      'title': 'Linux Practice',                'platform': 'HackerRank', 'url': 'https://www.hackerrank.com/domains/shell',                                 'is_free': True},
            {'skill_name': 'Terraform',  'title': 'Terraform Tutorial',            'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/terraform-tutorial/',                        'is_free': True},
            {'skill_name': 'Terraform',  'title': 'Terraform Full Course',         'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=SLB_c_ayRMo',                              'is_free': True},
            {'skill_name': 'Practice',   'title': 'AWS Free Tier Practice',        'platform': 'AWS',        'url': 'https://aws.amazon.com/free/',                                             'is_free': True},
        ]
    },
    {
        'career_name': 'DevOps Engineer',
        'description': 'Automate software delivery pipelines and manage infrastructure.',
        'required_skills': 'Linux, Git, Docker, Kubernetes, Jenkins, CI/CD, Python, AWS, Monitoring',
        'roadmap': json.dumps([
            'Learn Linux and shell scripting',
            'Learn Git and GitHub — branching, merging, pull requests',
            'Practice Linux commands on HackerRank',
            'Learn Python scripting for automation',
            'Learn Docker — containers and images',
            'Learn CI/CD — Jenkins or GitHub Actions',
            'Learn Kubernetes — orchestration',
            'Learn Terraform — infrastructure as code',
            'Learn Ansible — configuration management',
            'Learn cloud platforms — AWS or Azure',
            'Learn monitoring — Prometheus and Grafana',
            'Build project 1 — CI/CD pipeline with GitHub Actions',
            'Build project 2 — Docker + Kubernetes deployment',
            'Build project 3 — Full DevOps pipeline',
            'Practice coding problems on HackerRank',
            'Prepare for interviews — DevOps concepts + Linux',
        ]),
        'salary_range': '7-28 LPA',
        'demand': 'Very High',
        'resources': [
            {'skill_name': 'Linux',      'title': 'Linux Tutorial',               'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/linux-tutorial/',                            'is_free': True},
            {'skill_name': 'Linux',      'title': 'Linux Full Course',            'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=ZtqBQ68cfJc',                               'is_free': True},
            {'skill_name': 'Linux',      'title': 'Linux Shell Practice',         'platform': 'HackerRank', 'url': 'https://www.hackerrank.com/domains/shell',                                  'is_free': True},
            {'skill_name': 'Git',        'title': 'Git Tutorial',                 'platform': 'W3Schools',  'url': 'https://www.w3schools.com/git/',                                            'is_free': True},
            {'skill_name': 'Git',        'title': 'Git and GitHub Full Course',   'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=apGV9Kg7ics',                               'is_free': True},
            {'skill_name': 'Docker',     'title': 'Docker Tutorial',              'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/docker-tutorial/',                           'is_free': True},
            {'skill_name': 'Docker',     'title': 'Docker Full Course',           'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=fqMOX6JJhGo',                              'is_free': True},
            {'skill_name': 'Jenkins',    'title': 'Jenkins Tutorial',             'platform': 'GFG',        'url': 'https://www.geeksforgeeks.org/jenkins-tutorial/',                          'is_free': True},
            {'skill_name': 'Jenkins',    'title': 'Jenkins Full Course',          'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=FX322RVNGj4',                              'is_free': True},
            {'skill_name': 'Kubernetes', 'title': 'Kubernetes Full Course',       'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=X48VuDVv0do',                              'is_free': True},
            {'skill_name': 'CI/CD',      'title': 'DevOps Specialization',        'platform': 'Coursera',   'url': 'https://www.coursera.org/specializations/devops-cloud-and-agile-foundations','is_free': False},
            {'skill_name': 'Monitoring', 'title': 'Prometheus and Grafana',       'platform': 'YouTube',    'url': 'https://www.youtube.com/watch?v=9TJx7QTrTyo',                              'is_free': True},
            {'skill_name': 'Practice',   'title': 'DevOps Practice Problems',     'platform': 'HackerRank', 'url': 'https://www.hackerrank.com/domains/shell',                                 'is_free': True},
            {'skill_name': 'Practice',   'title': 'LeetCode DSA Problems',        'platform': 'LeetCode',   'url': 'https://leetcode.com/problemset/',                                         'is_free': True},
            {'skill_name': 'Practice',   'title': 'CodeChef Practice',            'platform': 'CodeChef',   'url': 'https://www.codechef.com/practice',                                        'is_free': True},
        ]
    },
]


def seed_careers():
    if Career.query.count() > 0:
        print('✅ Careers already seeded.')
        return
    for c in CAREERS_DATA:
        resources = c.pop('resources', [])
        career    = Career(**c)
        db.session.add(career)
        db.session.flush()
        for r in resources:
            db.session.add(Resource(career_id=career.id, **r))
    db.session.commit()
    print('✅ Career data seeded successfully!')

# ══════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════

# ── Home ──────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        'status':  '✅ Running',
        'message': 'AI Career Path Finder API is working!',
        'endpoints': {
            'careers':    'GET  /api/careers/',
            'register':   'POST /api/auth/register',
            'login':      'POST /api/auth/login',
            'profile':    'GET  /api/profile/',
            'recommend':  'GET  /api/recommend/',
            'gap':        'GET  /api/recommend/gap/<career_id>',
            'roadmap':    'GET  /api/recommend/roadmap/<career_id>',
            'dashboard':  'GET  /api/recommend/dashboard',
        }
    })

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'db': 'connected'})

# ── Auth ──────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def register():
    data     = request.get_json()
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        name          = name,
        email         = email,
        password_hash = generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'Registered successfully!', 'token': token, 'user': user.to_dict()}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    user     = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'Login successful!', 'token': token, 'user': user.to_dict()}), 200

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify({'user': user.to_dict()})

# ── Profile ───────────────────────────────────
@app.route('/api/profile/', methods=['GET'])
@jwt_required()
def get_profile():
    user   = User.query.get_or_404(int(get_jwt_identity()))
    skills = [{'skill_name': s.skill_name, 'level': s.level} for s in user.skills]
    return jsonify({
        'user':    user.to_dict(),
        'profile': user.profile.to_dict() if user.profile else {},
        'skills':  skills
    })

@app.route('/api/profile/', methods=['POST'])
@jwt_required()
def save_profile():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = Profile(user_id=user_id)
        db.session.add(profile)

    profile.branch      = data.get('branch', '')
    profile.year        = data.get('year', 1)
    profile.cgpa        = data.get('cgpa', None)
    profile.interests   = ','.join(data.get('interests', []))
    profile.career_goal = data.get('career_goal', '')

    UserSkill.query.filter_by(user_id=user_id).delete()
    for skill in data.get('skills', []):
        name  = skill.get('skill_name', skill) if isinstance(skill, dict) else skill
        level = skill.get('level', 'beginner')  if isinstance(skill, dict) else 'beginner'
        if str(name).strip():
            db.session.add(UserSkill(user_id=user_id, skill_name=str(name).strip(), level=level))

    db.session.commit()
    return jsonify({'message': 'Profile saved successfully!'})

# ── Careers ───────────────────────────────────
@app.route('/api/careers/', methods=['GET'])
def list_careers():
    return jsonify({'careers': [c.to_dict() for c in Career.query.all()]})

@app.route('/api/careers/<int:career_id>', methods=['GET'])
def get_career(career_id):
    career        = Career.query.get_or_404(career_id)
    data          = career.to_dict()
    data['resources'] = [r.to_dict() for r in career.resources]
    return jsonify({'career': data})

@app.route('/api/careers/<int:career_id>/resources', methods=['GET'])
def get_resources(career_id):
    career = Career.query.get_or_404(career_id)
    return jsonify({'resources': [r.to_dict() for r in career.resources]})

# ── Recommendation engine ─────────────────────
def compute_match(user_skills, user_interests, career):
    required    = career.skills_list()
    us          = [s.lower().strip() for s in user_skills]
    ui          = [i.lower().strip() for i in user_interests]
    matched, missing, score = [], [], 0
    for skill in required:
        if skill in us:
            matched.append(skill)
            score += 3
        elif any(skill in i or i in skill for i in ui):
            matched.append(skill + ' (interest)')
            score += 2
        else:
            missing.append(skill)
    max_score = len(required) * 3
    pct       = round((score / max_score) * 100, 1) if max_score > 0 else 0
    return {
        **career.to_dict(),
        'match_percent':  pct,
        'matched_skills': matched,
        'missing_skills': missing
    }

@app.route('/api/recommend/', methods=['GET'])
@jwt_required()
def recommend():
    user        = User.query.get_or_404(int(get_jwt_identity()))
    us          = [s.skill_name.lower() for s in user.skills]
    ui          = user.profile.interests.split(',') if user.profile and user.profile.interests else []
    results     = sorted([compute_match(us, ui, c) for c in Career.query.all()],
                         key=lambda x: x['match_percent'], reverse=True)
    return jsonify({'recommendations': results})

@app.route('/api/recommend/gap/<int:career_id>', methods=['GET'])
@jwt_required()
def skill_gap(career_id):
    user    = User.query.get_or_404(int(get_jwt_identity()))
    career  = Career.query.get_or_404(career_id)
    us      = [s.skill_name.lower() for s in user.skills]
    req     = career.skills_list()
    matched = [s for s in req if s in us]
    missing = [s for s in req if s not in us]
    pct     = round(len(matched) / len(req) * 100, 1) if req else 0
    gap_res = [r.to_dict() for r in career.resources
               if r.skill_name and r.skill_name.lower() in [m.lower() for m in missing]]
    return jsonify({
        'career_name':     career.career_name,
        'user_skills':     us,
        'required_skills': req,
        'matched_skills':  matched,
        'missing_skills':  missing,
        'match_percent':   pct,
        'gap_resources':   gap_res
    })

@app.route('/api/recommend/roadmap/<int:career_id>', methods=['GET'])
@jwt_required()
def roadmap(career_id):
    user_id = int(get_jwt_identity())
    career  = Career.query.get_or_404(career_id)
    steps   = career.roadmap_list()
    done    = {p.step_index for p in
               Progress.query.filter_by(user_id=user_id, career_id=career_id)
               if p.completed}
    data    = [{'step_index': i, 'step': s, 'completed': i in done}
               for i, s in enumerate(steps)]
    pct     = round(len(done) / len(steps) * 100, 1) if steps else 0
    return jsonify({
        'career_name':      career.career_name,
        'roadmap':          data,
        'total_steps':      len(steps),
        'completed_steps':  len(done),
        'progress_percent': pct
    })

@app.route('/api/recommend/progress', methods=['POST'])
@jwt_required()
def update_progress():
    user_id    = int(get_jwt_identity())
    data       = request.get_json()
    career_id  = data.get('career_id')
    step_index = data.get('step_index')
    completed  = data.get('completed', True)
    rec = Progress.query.filter_by(
        user_id=user_id, career_id=career_id, step_index=step_index
    ).first()
    if not rec:
        rec = Progress(user_id=user_id, career_id=career_id, step_index=step_index)
        db.session.add(rec)
    rec.completed = completed
    db.session.commit()
    return jsonify({'message': 'Progress updated!', 'completed': completed})

@app.route('/api/recommend/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user    = User.query.get_or_404(int(get_jwt_identity()))
    us      = [s.skill_name.lower() for s in user.skills]
    ui      = user.profile.interests.split(',') if user.profile and user.profile.interests else []
    top3    = sorted([compute_match(us, ui, c) for c in Career.query.all()],
                     key=lambda x: x['match_percent'], reverse=True)[:3]
    return jsonify({
        'user':                user.to_dict(),
        'profile':             user.profile.to_dict() if user.profile else {},
        'skills':              us,
        'top_recommendations': top3,
        'total_skills':        len(us)
    })

# ── Error handlers ────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'error': '404 Not Found',
        'hint':  'Try: http://127.0.0.1:5000/ or http://127.0.0.1:5000/api/careers/'
    }), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': '405 Method Not Allowed'}), 405

# ══════════════════════════════════════════════
# START
# ══════════════════════════════════════════════
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)