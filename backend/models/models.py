from models.db import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(120), nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    profile  = db.relationship('Profile',   backref='user', uselist=False, cascade='all,delete')
    skills   = db.relationship('UserSkill', backref='user', cascade='all,delete')
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
        import json
        try:
            return json.loads(self.roadmap)
        except:
            return []

    def to_dict(self):
        return {
            'id':              self.id,
            'career_name':     self.career_name,
            'description':     self.description,
            'required_skills': self.skills_list(),
            'roadmap':         self.roadmap_list(),
            'salary_range':    self.salary_range,
            'demand':          self.demand
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
            'id':         self.id,
            'skill_name': self.skill_name,
            'title':      self.title,
            'platform':   self.platform,
            'url':        self.url,
            'is_free':    self.is_free
        }


class Progress(db.Model):
    __tablename__ = 'progress'
    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    career_id    = db.Column(db.Integer, db.ForeignKey('careers.id'), nullable=False)
    step_index   = db.Column(db.Integer, nullable=False)
    completed    = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)