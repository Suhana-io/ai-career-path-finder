from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.models import User, Career, Progress
from datetime import datetime

recommend_bp = Blueprint('recommend', __name__)


def compute_match(user_skills, user_interests, career):
    required    = career.skills_list()
    u_skills    = [s.lower().strip() for s in user_skills]
    u_interests = [i.lower().strip() for i in user_interests]
    matched, missing, score = [], [], 0

    for skill in required:
        if skill in u_skills:
            matched.append(skill)
            score += 3
        elif any(skill in i or i in skill for i in u_interests):
            matched.append(skill + ' (interest)')
            score += 2
        else:
            missing.append(skill)

    max_score = len(required) * 3
    pct       = round((score / max_score) * 100, 1) if max_score > 0 else 0

    return {
        **career.to_dict(),
        'match_percent':   pct,
        'matched_skills':  matched,
        'missing_skills':  missing,
    }


@recommend_bp.route('/', methods=['GET'])
@jwt_required()
def recommend():
    user_id     = int(get_jwt_identity())
    user        = User.query.get_or_404(user_id)
    u_skills    = [s.skill_name.lower() for s in user.skills]
    u_interests = []
    if user.profile and user.profile.interests:
        u_interests = [i.lower().strip() for i in user.profile.interests.split(',')]

    careers = Career.query.all()
    results = [compute_match(u_skills, u_interests, c) for c in careers]
    results.sort(key=lambda x: x['match_percent'], reverse=True)
    return jsonify({'recommendations': results}), 200


@recommend_bp.route('/gap/<int:career_id>', methods=['GET'])
@jwt_required()
def skill_gap(career_id):
    user_id  = int(get_jwt_identity())
    user     = User.query.get_or_404(user_id)
    career   = Career.query.get_or_404(career_id)
    u_skills = [s.skill_name.lower() for s in user.skills]
    required = career.skills_list()
    matched  = [s for s in required if s in u_skills]
    missing  = [s for s in required if s not in u_skills]
    pct      = round(len(matched) / len(required) * 100, 1) if required else 0

    resources = [
        r.to_dict() for r in career.resources
        if r.skill_name and r.skill_name.lower() in [m.lower() for m in missing]
    ]
    return jsonify({
        'career_name':     career.career_name,
        'user_skills':     u_skills,
        'required_skills': required,
        'matched_skills':  matched,
        'missing_skills':  missing,
        'match_percent':   pct,
        'gap_resources':   resources
    }), 200


@recommend_bp.route('/roadmap/<int:career_id>', methods=['GET'])
@jwt_required()
def roadmap(career_id):
    user_id  = int(get_jwt_identity())
    career   = Career.query.get_or_404(career_id)
    steps    = career.roadmap_list()
    done_set = {
        p.step_index for p in
        Progress.query.filter_by(user_id=user_id, career_id=career_id).all()
        if p.completed
    }
    roadmap_data = [
        {'step_index': i, 'step': s, 'completed': i in done_set}
        for i, s in enumerate(steps)
    ]
    total = len(steps)
    done  = len(done_set)
    pct   = round((done / total) * 100, 1) if total > 0 else 0

    return jsonify({
        'career_name':      career.career_name,
        'roadmap':          roadmap_data,
        'total_steps':      total,
        'completed_steps':  done,
        'progress_percent': pct
    }), 200


@recommend_bp.route('/progress', methods=['POST'])
@jwt_required()
def update_progress():
    user_id    = int(get_jwt_identity())
    data       = request.get_json()
    career_id  = data.get('career_id')
    step_index = data.get('step_index')
    completed  = data.get('completed', True)

    record = Progress.query.filter_by(
        user_id=user_id, career_id=career_id, step_index=step_index
    ).first()

    if not record:
        record = Progress(user_id=user_id, career_id=career_id, step_index=step_index)
        db.session.add(record)

    record.completed    = completed
    record.completed_at = datetime.utcnow() if completed else None
    db.session.commit()
    return jsonify({'message': 'Progress updated', 'completed': completed}), 200


@recommend_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id     = int(get_jwt_identity())
    user        = User.query.get_or_404(user_id)
    u_skills    = [s.skill_name.lower() for s in user.skills]
    u_interests = []
    if user.profile and user.profile.interests:
        u_interests = [i.lower().strip() for i in user.profile.interests.split(',')]

    careers = Career.query.all()
    results = [compute_match(u_skills, u_interests, c) for c in careers]
    results.sort(key=lambda x: x['match_percent'], reverse=True)

    return jsonify({
        'user':               user.to_dict(),
        'profile':            user.profile.to_dict() if user.profile else {},
        'skills':             u_skills,
        'top_recommendations': results[:3],
        'total_skills':       len(u_skills)
    }), 200